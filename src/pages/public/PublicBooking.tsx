import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Check,
  User,
  Mail,
  Phone,
  CreditCard,
  Shield,
  Star,
  MessageSquare,
  Gift,
  X
} from 'lucide-react'
import { format, addDays, parse } from 'date-fns'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  description: string
  basePrice: string
  durationMinutes: number
}

interface Company {
  id: string
  name: string
  slug: string
  phone: string
  email: string
}

interface Branding {
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
}

interface TimeSlot {
  time: string
  available: boolean
}

interface ReferralInfo {
  valid: boolean
  referrerName?: string
  discount?: {
    type: string
    value: string
  }
}

const API_BASE = '/api'

export default function PublicBooking() {
  const { companySlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quoteSubmitting, setQuoteSubmitting] = useState(false)
  const [quoteSubmitted, setQuoteSubmitted] = useState(false)
  
  const [company, setCompany] = useState<Company | null>(null)
  const [branding, setBranding] = useState<Branding | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)

  const [formData, setFormData] = useState({
    serviceId: '',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: 2,
    bathrooms: 1,
    notes: ''
  })
  
  const [quoteData, setQuoteData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    serviceInterest: '',
    address: '',
    bedrooms: 2,
    bathrooms: 1,
    preferredDate: '',
    notes: ''
  })

  useEffect(() => {
    loadCompanyData()
    const refCode = searchParams.get('ref')
    if (refCode) {
      setReferralCode(refCode)
    }
  }, [companySlug, searchParams])

  useEffect(() => {
    if (formData.serviceId && formData.date && company) {
      loadAvailableSlots()
    }
  }, [formData.serviceId, formData.date, company])
  
  useEffect(() => {
    if (referralCode && company) {
      validateReferralCode()
    }
  }, [referralCode, company])

  const trackAbandonedBooking = useCallback(async () => {
    if (!company || step >= 5 || !formData.email) return
    
    try {
      await fetch(`${API_BASE}/public/abandoned-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          step,
          formData: {
            ...formData,
            referralCode
          }
        })
      })
    } catch (error) {
      console.error('Failed to track abandoned booking:', error)
    }
  }, [company, step, formData, referralCode])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (step >= 3 && step < 5 && formData.email) {
        navigator.sendBeacon(
          `${API_BASE}/public/abandoned-booking`,
          JSON.stringify({
            companyId: company?.id,
            step,
            formData: {
              ...formData,
              referralCode
            }
          })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (step >= 3 && step < 5 && formData.email && company) {
        trackAbandonedBooking()
      }
    }
  }, [company, step, formData, referralCode, trackAbandonedBooking])

  async function validateReferralCode() {
    if (!referralCode || !company) return
    try {
      const res = await fetch(`${API_BASE}/public/referral/validate/${referralCode}?companyId=${company.id}`)
      if (res.ok) {
        const data = await res.json()
        setReferralInfo(data)
        if (data.valid) {
          toast.success(`Referred by ${data.referrerName}! You'll get $${data.discount?.value} off.`)
        }
      }
    } catch (error) {
      console.error('Failed to validate referral:', error)
    }
  }

  async function loadCompanyData() {
    try {
      const res = await fetch(`${API_BASE}/public/company/${companySlug}`)
      if (!res.ok) throw new Error('Company not found')
      const data = await res.json()
      setCompany(data.company)
      setBranding(data.branding)
      setServices(data.services || [])
    } catch (error) {
      console.error('Failed to load company:', error)
      toast.error('Company not found')
    } finally {
      setLoading(false)
    }
  }

  async function loadAvailableSlots() {
    if (!company || !formData.serviceId) return
    setCheckingAvailability(true)
    try {
      const res = await fetch(
        `${API_BASE}/public/availability/${company.id}?date=${formData.date}&serviceId=${formData.serviceId}`
      )
      if (res.ok) {
        const data = await res.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      console.error('Failed to load availability:', error)
    } finally {
      setCheckingAvailability(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/public/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id,
          ...formData
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Booking failed')
      }
      
      const data = await res.json()
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        toast.success('Booking confirmed!')
        setStep(6)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }
  
  async function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quoteData.email) {
      toast.error('Please enter your email')
      return
    }
    
    setQuoteSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/public/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id,
          ...quoteData,
          referralCode
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to submit quote request')
      }
      
      setQuoteSubmitted(true)
      toast.success('Quote request submitted! We\'ll get back to you soon.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit quote request')
    } finally {
      setQuoteSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.serviceId)
  const primaryColor = branding?.primaryColor || '#0d9488'

  function calculatePrice() {
    if (!selectedService) return 0
    return parseFloat(selectedService.basePrice)
  }

  const nextDays = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');`}
        </style>
        <div className="animate-spin h-10 w-10 border-4 border-slate-200 border-t-teal-600"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');`}
        </style>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Company Not Found</h1>
          <p className="text-slate-500">The cleaning company you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');`}
      </style>

      {referralInfo?.valid && (
        <div className="bg-gradient-to-r from-teal-600 to-sky-600 text-white px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-sm">
            <Gift className="h-4 w-4" />
            <span>
              <strong>{referralInfo.referrerName}</strong> referred you!
              Get <strong>${referralInfo.discount?.value}</strong> off your first booking.
            </span>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt={company.name} className="h-10 w-auto" />
              ) : (
                <div 
                  className="h-10 w-10 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {company.name[0]}
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-900">{company.name}</h1>
                <p className="text-xs text-slate-500">Professional Cleaning Services</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowQuoteForm(true)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border-2 hover:bg-slate-50 transition-colors"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <MessageSquare className="h-4 w-4" />
                Get a Quote
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
                <Shield className="h-4 w-4" style={{ color: primaryColor }} />
                <span>Secure Booking</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {step < 6 && (
          <>
            <div className="flex items-center gap-4 mb-8">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="p-2 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Book Your Cleaning</h2>
                <p className="text-slate-500">Step {step} of 5</p>
              </div>
            </div>

            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className="h-2 flex-1 transition-colors"
                  style={{ backgroundColor: s <= step ? primaryColor : '#e2e8f0' }}
                />
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Select a Service</h3>
              {services.length === 0 ? (
                <div className="bg-white shadow-sm p-12 text-center">
                  <p className="text-slate-500">No services available at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setFormData({ ...formData, serviceId: service.id })}
                      className={`bg-white shadow-sm p-6 cursor-pointer transition-all ${
                        formData.serviceId === service.id
                          ? 'ring-2 ring-offset-2'
                          : 'hover:shadow-md'
                      }`}
                      style={{ 
                        ringColor: formData.serviceId === service.id ? primaryColor : undefined,
                        backgroundColor: formData.serviceId === service.id ? `${primaryColor}08` : undefined
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div 
                            className="h-14 w-14 flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}20` }}
                          >
                            <Sparkles className="h-7 w-7" style={{ color: primaryColor }} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{service.name}</h4>
                            <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                            <p className="text-sm text-slate-400 mt-2 flex items-center">
                              <Clock className="h-4 w-4 mr-1.5" />
                              {service.durationMinutes} minutes
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-slate-900">
                            ${parseFloat(service.basePrice).toFixed(2)}
                          </p>
                          {formData.serviceId === service.id && (
                            <div 
                              className="h-7 w-7 flex items-center justify-center mt-2 ml-auto"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!formData.serviceId}
              className="w-full inline-flex items-center justify-center px-6 py-4 text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Choose Date & Time</h3>
              
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Select Date</label>
                <div className="grid grid-cols-7 gap-2">
                  {nextDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isSelected = formData.date === dateStr
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setFormData({ ...formData, date: dateStr, time: '' })}
                        className={`p-3 text-center transition-colors ${
                          isSelected
                            ? 'text-white'
                            : 'bg-white border border-slate-200 hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: isSelected ? primaryColor : undefined }}
                      >
                        <div className="text-xs font-bold">{format(day, 'EEE')}</div>
                        <div className="text-lg font-extrabold">{format(day, 'd')}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Available Times
                  {checkingAvailability && <span className="ml-2 text-slate-300">(checking...)</span>}
                </label>
                {availableSlots.length === 0 ? (
                  <div className="bg-white shadow-sm p-8 text-center">
                    <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {checkingAvailability ? 'Checking availability...' : 'Select a service to see available times'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {availableSlots.map((slot) => {
                      const isSelected = formData.time === slot.time
                      return (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setFormData({ ...formData, time: slot.time })}
                          disabled={!slot.available}
                          className={`p-3 text-center font-bold transition-colors ${
                            isSelected
                              ? 'text-white'
                              : slot.available
                                ? 'bg-white border border-slate-200 hover:border-slate-300'
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          }`}
                          style={{ backgroundColor: isSelected ? primaryColor : undefined }}
                        >
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!formData.time}
              className="w-full inline-flex items-center justify-center px-6 py-4 text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <h3 className="text-lg font-extrabold text-slate-900">Your Information</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': primaryColor } as any}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Smith"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
              className="w-full inline-flex items-center justify-center px-6 py-4 text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <h3 className="text-lg font-extrabold text-slate-900">Property Details</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Street Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Zip Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="10001"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bedrooms</label>
                <select
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} bedroom{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bathrooms</label>
                <select
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent"
                >
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((n) => (
                    <option key={n} value={n}>{n} bathroom{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Special Instructions (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Gate code, parking instructions, pets, etc..."
                rows={3}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setStep(5)}
              disabled={!formData.address}
              className="w-full inline-flex items-center justify-center px-6 py-4 text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              Review Booking
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <h3 className="text-lg font-extrabold text-slate-900">Review & Pay</h3>
            
            <div className="bg-white shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div 
                  className="h-14 w-14 flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Sparkles className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedService?.name}</h4>
                  <p className="text-sm text-slate-500">{selectedService?.durationMinutes} minutes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">{format(new Date(formData.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">{formData.time}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">
                    {formData.address}, {formData.city}, {formData.state} {formData.zipCode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <User className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500">Property</span>
                  <span className="font-bold">{formData.bedrooms} bed, {formData.bathrooms} bath</span>
                </div>
                {formData.notes && (
                  <div className="text-sm text-slate-400 mt-2">
                    Notes: {formData.notes}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Due Today</span>
                  <span className="text-3xl font-extrabold" style={{ color: primaryColor }}>
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-4 flex items-center gap-3">
              <CreditCard className="h-5 w-5" style={{ color: primaryColor }} />
              <span className="text-sm text-slate-600">
                You'll be securely redirected to complete payment
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center px-6 py-4 text-white font-bold text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay ${calculatePrice().toFixed(2)} & Confirm Booking
                </>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center">
              By confirming, you agree to {company.name}'s terms of service
            </p>
          </div>
        )}

        {step === 6 && (
          <div className="bg-white shadow-sm p-12 text-center">
            <div 
              className="h-20 w-20 mx-auto flex items-center justify-center mb-6"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Check className="h-10 w-10" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Booking Confirmed!</h3>
            <p className="text-slate-500 mb-6">
              Thank you for booking with {company.name}. A confirmation email has been sent to {formData.email}.
            </p>
            <div className="bg-slate-50 p-6 text-left mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                  <span className="font-medium">{format(new Date(formData.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                  <span className="font-medium">{formData.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" style={{ color: primaryColor }} />
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Questions? Contact {company.name} at {company.phone || company.email}
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-4">
              <Star className="h-4 w-4" style={{ color: primaryColor }} />
              <span>Powered by CleanPro</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secure & Encrypted</span>
            </div>
          </div>
        </div>
      </footer>

      {showQuoteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Get a Free Quote</h3>
                <p className="text-sm text-slate-500">We'll get back to you within 24 hours</p>
              </div>
              <button
                onClick={() => setShowQuoteForm(false)}
                className="p-2 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {quoteSubmitted ? (
              <div className="p-8 text-center">
                <div 
                  className="h-16 w-16 mx-auto flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Check className="h-8 w-8" style={{ color: primaryColor }} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Quote Request Submitted!</h4>
                <p className="text-slate-500 mb-6">
                  Thank you for your interest. We'll review your request and get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setShowQuoteForm(false)
                    setQuoteSubmitted(false)
                  }}
                  className="px-6 py-3 text-white font-bold text-xs uppercase tracking-widest"
                  style={{ backgroundColor: primaryColor }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                    <input
                      type="text"
                      value={quoteData.firstName}
                      onChange={(e) => setQuoteData({ ...quoteData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                    <input
                      type="text"
                      value={quoteData.lastName}
                      onChange={(e) => setQuoteData({ ...quoteData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email *</label>
                  <input
                    type="email"
                    value={quoteData.email}
                    onChange={(e) => setQuoteData({ ...quoteData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                  <input
                    type="tel"
                    value={quoteData.phone}
                    onChange={(e) => setQuoteData({ ...quoteData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Interest</label>
                  <select
                    value={quoteData.serviceInterest}
                    onChange={(e) => setQuoteData({ ...quoteData, serviceInterest: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select a service...</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>{service.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Property Address</label>
                  <input
                    type="text"
                    value={quoteData.address}
                    onChange={(e) => setQuoteData({ ...quoteData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="123 Main St, City, State"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bedrooms</label>
                    <select
                      value={quoteData.bedrooms}
                      onChange={(e) => setQuoteData({ ...quoteData, bedrooms: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n} bedroom{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bathrooms</label>
                    <select
                      value={quoteData.bathrooms}
                      onChange={(e) => setQuoteData({ ...quoteData, bathrooms: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(n => (
                        <option key={n} value={n}>{n} bathroom{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Preferred Date</label>
                  <input
                    type="date"
                    value={quoteData.preferredDate}
                    onChange={(e) => setQuoteData({ ...quoteData, preferredDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Additional Notes</label>
                  <textarea
                    value={quoteData.notes}
                    onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Tell us about your cleaning needs..."
                  />
                </div>

                {referralInfo?.valid && (
                  <div className="bg-teal-50 border border-teal-200 p-4 flex items-center gap-3">
                    <Gift className="h-5 w-5 text-teal-600 flex-shrink-0" />
                    <span className="text-sm text-teal-700">
                      Referred by <strong>{referralInfo.referrerName}</strong>!
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={quoteSubmitting}
                  className="w-full px-6 py-4 text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  {quoteSubmitting ? 'Submitting...' : 'Get My Free Quote'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
