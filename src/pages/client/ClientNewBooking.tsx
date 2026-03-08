import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Check
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Service {
  id: number
  name: string
  description: string
  basePrice: string
  durationMinutes: number
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
]

export default function ClientNewBooking() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    serviceId: 0,
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '',
    address: '',
    bedrooms: 2,
    bathrooms: 1,
    notes: ''
  })

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    try {
      const res = await api.get('/client/services')
      setServices(res.services || [])
    } catch (error) {
      console.error('Failed to load services:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await api.post('/client/bookings', {
        serviceId: formData.serviceId,
        scheduledDate: `${formData.date}T${formData.time}:00`,
        address: formData.address,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        notes: formData.notes
      })
      toast.success('Booking request submitted!')
      navigate('/client/bookings')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.serviceId)

  function calculatePrice() {
    if (!selectedService) return 0
    return parseFloat(selectedService.basePrice)
  }

  const nextDays = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/client/bookings')}
          className="p-2 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Book a Cleaning</h1>
          <p className="text-slate-500 text-sm sm:text-base">Step {step} of 4</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 ${
              s <= step ? 'bg-teal-600' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900">Select a Service</h2>
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
                      ? 'ring-2 ring-teal-600 bg-teal-50'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 bg-teal-100 flex items-center justify-center">
                        <Sparkles className="h-7 w-7 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{service.name}</h3>
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
                        <div className="h-7 w-7 bg-teal-600 flex items-center justify-center mt-2 ml-auto">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setStep(2)}
            disabled={!formData.serviceId}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <h2 className="text-lg font-extrabold text-slate-900">Choose Date & Time</h2>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Select Date</label>
            <div className="grid grid-cols-7 gap-2">
              {nextDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const isSelected = formData.date === dateStr
                return (
                  <button
                    key={dateStr}
                    onClick={() => setFormData({ ...formData, date: dateStr })}
                    className={`p-3 text-center transition-colors ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'bg-white border border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{format(day, 'EEE')}</div>
                    <div className="text-lg font-extrabold">{format(day, 'd')}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Select Time</label>
            <div className="grid grid-cols-5 gap-2">
              {timeSlots.map((time) => {
                const isSelected = formData.time === time
                return (
                  <button
                    key={time}
                    onClick={() => setFormData({ ...formData, time })}
                    className={`p-3 text-center font-bold transition-colors ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'bg-white border border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!formData.time}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8">
          <h2 className="text-lg font-extrabold text-slate-900">Property Details</h2>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bedrooms</label>
              <select
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              placeholder="Any special requests or access instructions..."
              rows={3}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setStep(4)}
            disabled={!formData.address}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8">
          <h2 className="text-lg font-extrabold text-slate-900">Confirm Your Booking</h2>
          
          <div className="bg-white shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="h-14 w-14 bg-teal-100 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{selectedService?.name}</h3>
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
                <span className="font-medium">{formData.address}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Property</span>
                <span className="font-bold">{formData.bedrooms} bed, {formData.bathrooms} bath</span>
              </div>
              {formData.notes && (
                <div className="mt-3">
                  <span className="text-sm text-slate-400">Notes: {formData.notes}</span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-3xl font-extrabold text-teal-600">${calculatePrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-teal-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Confirm Booking'}
          </button>

          <p className="text-sm text-slate-500 text-center">
            You'll receive a confirmation once your booking is accepted
          </p>
        </div>
      )}
    </div>
  )
}
