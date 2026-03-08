import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Check, Calendar, Clock, Sparkles, ArrowRight, Home, CreditCard, ClipboardCheck } from 'lucide-react'
import { format } from 'date-fns'

interface Booking {
  id: string
  status: string
  paymentStatus: string
  scheduledDate: string
  scheduledTime: string
  totalPrice: string
  serviceName: string
  companyName: string
}

export default function BookingSuccess() {
  const { companySlug } = useParams()
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  const bookingId = searchParams.get('booking_id')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (bookingId) {
      confirmPaymentAndLoadBooking()
    } else {
      setLoading(false)
    }
  }, [bookingId])

  async function confirmPaymentAndLoadBooking() {
    try {
      if (sessionId) {
        await fetch('/api/public/booking/payment-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, bookingId })
        })
      }

      const res = await fetch(`/api/public/booking/${bookingId}/status`)
      if (res.ok) {
        const data = await res.json()
        setBooking(data.booking)
      }
    } catch (error) {
      console.error('Failed to load booking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');`}
        </style>
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-slate-200 border-t-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Confirming your booking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');`}
      </style>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white shadow-sm p-12 text-center">
          <div className="h-20 w-20 mx-auto bg-green-100 flex items-center justify-center mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Payment Successful!
          </h1>
          
          <p className="text-slate-500 mb-8">
            Your payment has been received. The cleaning company will review and confirm your booking shortly.
          </p>

          {booking && (
            <div className="flex justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800">
                <CreditCard className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Payment: {booking.paymentStatus === 'paid' ? 'Confirmed' : booking.paymentStatus}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 ${
                booking.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <ClipboardCheck className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Booking: {booking.status === 'pending' ? 'Awaiting Confirmation' : booking.status}
                </span>
              </div>
            </div>
          )}

          {booking && (
            <div className="bg-slate-50 p-6 text-left mb-8">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Booking Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-teal-600" />
                  <div>
                    <span className="font-bold text-slate-900">{booking.serviceName}</span>
                    <span className="text-slate-400 ml-2">by {booking.companyName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <span className="font-medium text-slate-700">
                    {format(new Date(booking.scheduledDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-teal-600" />
                  <span className="font-medium text-slate-700">{booking.scheduledTime}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Total Paid</span>
                <span className="text-2xl font-extrabold text-teal-600">
                  ${parseFloat(booking.totalPrice || '0').toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-100 p-4">
              <h3 className="font-bold text-teal-800 mb-2">What's Next?</h3>
              <ul className="text-sm text-teal-700 text-left space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>You'll receive a payment receipt email shortly</span>
                </li>
                <li className="flex items-start gap-2">
                  <ClipboardCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>The cleaning company will confirm your booking (usually within 24 hours)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Once confirmed, you'll receive a booking confirmation with cleaner details</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>We'll send you a reminder the day before your cleaning</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/book/${companySlug}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition-colors"
            >
              Book Another Cleaning
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          Booking ID: {bookingId}
        </p>
      </div>
    </div>
  )
}
