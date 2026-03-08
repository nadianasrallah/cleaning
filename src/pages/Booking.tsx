import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ServiceSelection } from '@/components/booking/ServiceSelection'
import { DateTimeSelection } from '@/components/booking/DateTimeSelection'
import { CustomerInfoForm } from '@/components/booking/CustomerInfoForm'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'

const DEMO_SERVICES = [
  { id: '1', name: 'Standard Cleaning', description: 'Regular house cleaning service', price: 80, duration_minutes: 60 },
  { id: '2', name: 'Deep Cleaning', description: 'Thorough deep cleaning for your home', price: 150, duration_minutes: 120 },
  { id: '3', name: 'Move-in/Move-out', description: 'Complete cleaning for moving', price: 200, duration_minutes: 180 },
]

export default function Booking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const companyId = searchParams.get('company')

  const [loading, setLoading] = useState(true)
  const [companyBranding, setCompanyBranding] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])

  const [bedrooms, setBedrooms] = useState(1)
  const [bathrooms, setBathrooms] = useState(1)

  const [clientSecret, setClientSecret] = useState<string>("")
  const [isInitializingPayment, setIsInitializingPayment] = useState(false)

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [frequency, setFrequency] = useState<string>('one_time')
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    if (!isSupabaseConfigured || companyId === 'demo') {
      setServices(DEMO_SERVICES)
      setCompanyBranding({ 
        app_name: 'CleanPro',
        primary_color: '#3b82f6',
        secondary_color: '#1e40af',
        accent_color: '#dbeafe'
      })
      setLoading(false)
      return
    }
    if (!companyId) {
      toast.error('Invalid company link')
      navigate('/')
      return
    }
    loadCompanyData()
  }, [companyId])

  const calculateTotal = () => {
    if (!selectedService) return 0
    const basePrice = selectedService.price
    const bedPrice = (bedrooms - 1) * 10
    const bathPrice = (bathrooms - 1) * 15
    return basePrice + Math.max(0, bedPrice) + Math.max(0, bathPrice)
  }

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      const { data: branding } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', companyId)
        .single()

      setCompanyBranding(branding)
      if (branding) {
        document.documentElement.style.setProperty('--primary', branding.primary_color)
        document.documentElement.style.setProperty('--secondary', branding.secondary_color)
        document.documentElement.style.setProperty('--accent', branding.accent_color)
      }

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)

      setServices(servicesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load booking information')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerInfoSubmit = async (info: any) => {
    setCustomerInfo(info)
    setCurrentStep(4)
    if (isSupabaseConfigured) {
      initializePaymentIntent(info)
    }
  }

  const initializePaymentIntent = async (customerData: any) => {
    if (!isSupabaseConfigured) return
    
    setIsInitializingPayment(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: calculateTotal(),
          currency: 'usd',
          email: customerData.email,
          companyId: companyId,
          frequency: frequency,
          metadata: {
            service_id: selectedService.id,
            bedrooms,
            bathrooms
          }
        },
      })

      if (error) throw error
      if (data?.clientSecret) {
        setClientSecret(data.clientSecret)
      }
    } catch (error) {
      console.error('Error initializing payment:', error)
      toast.error('Could not initialize secure payment system.')
    } finally {
      setIsInitializingPayment(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!isSupabaseConfigured) {
      toast.success('Demo booking completed!')
      return
    }
    
    try {
      setLoading(true)

      let customerId
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', customerInfo.email)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            company_id: companyId,
            first_name: customerInfo.firstName,
            last_name: customerInfo.lastName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: customerInfo.address,
            notes: customerInfo.notes
          })
          .select()
          .single()
        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          company_id: companyId,
          customer_id: customerId,
          service_id: selectedService.id,
          scheduled_date: selectedDate?.toISOString().split('T')[0],
          scheduled_time: selectedTime,
          frequency,
          notes: `${customerInfo.notes}\nDetails: ${bedrooms} Bed, ${bathrooms} Bath\nStripe Payment ID: ${paymentIntentId}`,
          status: 'confirmed'
        } as any)

      if (bookingError) throw bookingError

      toast.success('Booking confirmed and paid successfully!')

      setTimeout(() => {
        window.location.reload()
      }, 3000)

    } catch (error: any) {
      console.error('Error finalizing booking:', error)
      toast.error('Payment succeeded but booking creation failed. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !companyBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {companyBranding?.logo_url && (
              <img
                src={companyBranding.logo_url}
                alt={companyBranding.app_name}
                className="h-12 w-auto"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {companyBranding?.app_name || 'Book a Service'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-0 border-none shadow-none">
            {currentStep === 1 && (
              <ServiceSelection
                services={services}
                onSelect={(s) => { setSelectedService(s); setCurrentStep(2) }}
                bedrooms={bedrooms}
                setBedrooms={setBedrooms}
                bathrooms={bathrooms}
                setBathrooms={setBathrooms}
              />
            )}

            {currentStep === 2 && selectedService && (
              <DateTimeSelection
                service={selectedService}
                onSelect={(d, t, f) => {
                  setSelectedDate(d)
                  setSelectedTime(t)
                  setFrequency(f)
                  setCurrentStep(3)
                }}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && (
              <CustomerInfoForm
                onSubmit={handleCustomerInfoSubmit}
                onBack={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 4 && (
              <>
                {!isSupabaseConfigured ? (
                  <Card className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Demo Booking Summary</h2>
                    <div className="space-y-4 text-left max-w-md mx-auto mb-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold">{selectedService?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedDate?.toLocaleDateString()} at {selectedTime}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p><strong>Customer:</strong> {customerInfo.firstName} {customerInfo.lastName}</p>
                        <p><strong>Email:</strong> {customerInfo.email}</p>
                        <p><strong>Address:</strong> {customerInfo.address}</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="font-bold text-lg text-primary">Total: ${calculateTotal().toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">This is a demo. Configure Supabase and Stripe to enable real bookings.</p>
                    <div className="flex gap-4 justify-center">
                      <Button variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                      <Button onClick={() => toast.success('Demo booking completed!')}>Complete Demo Booking</Button>
                    </div>
                  </Card>
                ) : isInitializingPayment ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Initializing Secure Payment...</p>
                  </div>
                ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <BookingSummary
                      service={selectedService}
                      date={selectedDate}
                      time={selectedTime}
                      frequency={frequency}
                      customerInfo={customerInfo}
                      bedrooms={bedrooms}
                      bathrooms={bathrooms}
                      totalPrice={calculateTotal()}
                      onConfirm={handlePaymentSuccess}
                      onBack={() => setCurrentStep(3)}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-12 text-red-500">
                    Failed to load payment system. Please try again.
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
