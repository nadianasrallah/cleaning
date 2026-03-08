import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, Clock, Repeat, MapPin, Bed, Bath, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { toast } from 'sonner'

interface BookingSummaryProps {
  service: any
  date: Date | null
  time: string
  frequency: string
  customerInfo: any
  bedrooms: number
  bathrooms: number
  totalPrice: number
  onConfirm: (paymentIntentId: string) => void
  onBack: () => void
}

export function BookingSummary({
  service,
  date,
  time,
  frequency,
  customerInfo,
  bedrooms,
  bathrooms,
  totalPrice,
  onConfirm,
  onBack,
}: BookingSummaryProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const frequencyLabels: Record<string, string> = {
    'one_time': 'One Time',
    'weekly': 'Weekly',
    'bi_weekly': 'Bi-Weekly',
    'monthly': 'Monthly'
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'An unexpected error occurred.')
        toast.error(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onConfirm(paymentIntent.id)
      }
    } catch (err: any) {
      setErrorMessage(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={processing}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Review & Pay</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Service Details</h3>
            <div className="space-y-3">
              <div className="font-medium text-lg">{service.name}</div>
              <p className="text-sm text-muted-foreground">{service.description}</p>

              <Separator className="my-2" />

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{service.duration_minutes} mins</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span>{bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span>{bathrooms} Bathrooms</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Schedule & Location</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{date ? format(date, 'EEEE, MMMM d, yyyy') : 'No date'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{time}</span>
              </div>
              <div className="flex items-center gap-3">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span>{frequencyLabels[frequency]}</span>
              </div>
              <div className="flex items-start gap-3 pt-2 mt-2 border-t">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{customerInfo.address}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-4">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Service</span>
                <span>${service.price.toFixed(2)}</span>
              </div>
              {(bedrooms > 1) && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Extra Bedrooms ({bedrooms - 1} x $10)</span>
                  <span>+${((bedrooms - 1) * 10).toFixed(2)}</span>
                </div>
              )}
              {(bathrooms > 1) && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Extra Bathrooms ({bathrooms - 1} x $15)</span>
                  <span>+${((bathrooms - 1) * 15).toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2 bg-primary/20" />
              <div className="flex justify-between font-bold text-lg text-primary">
                <span>Total Due</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              {frequency !== 'one_time' && (
                <div className="text-xs text-center mt-2 text-muted-foreground bg-white/50 p-2 rounded">
                  You will be charged <strong>${totalPrice.toFixed(2)}</strong> every {frequencyLabels[frequency].toLowerCase()}.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-primary/20 shadow-md">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="font-semibold">Secure Payment</h3>
            </div>

            <form onSubmit={handleSubmit}>
              <PaymentElement />

              {errorMessage && (
                <div className="text-red-500 text-sm mt-4 p-2 bg-red-50 rounded">
                  {errorMessage}
                </div>
              )}

              <Button
                className="w-full mt-6"
                size="lg"
                type="submit"
                disabled={!stripe || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${totalPrice.toFixed(2)} & Book`
                )}
              </Button>
            </form>
          </Card>

          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>Powered by Stripe</span>
            </div>
            <div className="flex items-center gap-1">
              <span>SSL Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
