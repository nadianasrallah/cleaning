import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  ArrowLeft, Calendar, Clock, MapPin, FileText, 
  DollarSign, MessageSquare, AlertCircle, CreditCard, 
  RefreshCw, CheckCircle, XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700', icon: Clock },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-sky-50 text-sky-700', icon: CheckCircle },
  { value: 'in-progress', label: 'In Progress', color: 'bg-violet-50 text-violet-700', icon: RefreshCw },
  { value: 'completed', label: 'Completed', color: 'bg-teal-50 text-teal-700', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-700', icon: XCircle },
]

export default function ClientBookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    loadBooking()
  }, [id])

  async function loadBooking() {
    try {
      const data = await api.get<any>(`/client/bookings/${id}`)
      setBooking(data)
    } catch (error) {
      console.error('Failed to load booking:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  async function cancelBooking() {
    setCancelling(true)
    try {
      await api.put(`/client/bookings/${id}/cancel`, { reason: cancelReason })
      toast.success('Booking cancelled successfully')
      await loadBooking()
      setShowCancelModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Booking not found</h2>
        <Link to="/client/bookings" className="text-teal-600 hover:text-teal-700 mt-2 inline-block">
          Back to bookings
        </Link>
      </div>
    )
  }

  const { booking: bookingData, service, staff: assignedStaff } = booking
  const currentStatus = STATUSES.find(s => s.value === bookingData.status)
  const StatusIcon = currentStatus?.icon || Clock
  const canCancel = ['pending', 'confirmed'].includes(bookingData.status)
  const isPast = new Date(bookingData.scheduledDate) < new Date()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/client/bookings')}
          className="p-2 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Booking Details
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            {format(new Date(bookingData.scheduledDate), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm border-t-4 border-teal-600 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-6 w-6 ${currentStatus?.color?.includes('amber') ? 'text-amber-600' : 
              currentStatus?.color?.includes('sky') ? 'text-sky-600' : 
              currentStatus?.color?.includes('violet') ? 'text-violet-600' : 
              currentStatus?.color?.includes('teal') ? 'text-teal-600' : 'text-red-600'}`} 
            />
            <span className={`px-4 py-2 font-bold text-sm uppercase tracking-widest ${currentStatus?.color}`}>
              {currentStatus?.label || bookingData.status}
            </span>
          </div>
          {canCancel && !isPast && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 border border-red-200 text-red-600 font-bold text-xs uppercase tracking-widest hover:bg-red-50"
            >
              Cancel Booking
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-slate-900 font-medium text-lg">
                  {format(new Date(bookingData.scheduledDate), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</p>
                <p className="text-slate-900 font-medium text-lg">
                  {bookingData.scheduledTime || 'To be scheduled'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service</p>
                <p className="text-slate-900 font-medium text-lg">{service?.name}</p>
                {service?.description && (
                  <p className="text-slate-500 text-sm mt-1">{service.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                <p className="text-slate-900 font-medium">
                  {bookingData.address || 'Your registered address'}
                </p>
                {(bookingData.bedrooms || bookingData.bathrooms) && (
                  <p className="text-slate-500 text-sm mt-1">
                    {bookingData.bedrooms} bedroom{bookingData.bedrooms !== 1 ? 's' : ''}, {bookingData.bathrooms} bathroom{bookingData.bathrooms !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Price</p>
                <p className="text-slate-900 font-bold text-2xl">
                  ${parseFloat(bookingData.totalPrice || service?.basePrice || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {assignedStaff && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-4 h-4 bg-teal-600 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Cleaner</p>
                  <p className="text-slate-900 font-medium">
                    {assignedStaff.user?.firstName} {assignedStaff.user?.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {bookingData.frequency !== 'one-time' && (
        <div className="bg-sky-50 border border-sky-200 p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-sky-600" />
            <div>
              <p className="font-bold text-sky-900">Recurring Booking</p>
              <p className="text-sky-700 capitalize">
                This is a {bookingData.frequency} cleaning schedule
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Payment Status
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-teal-600" />
              <div>
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  bookingData.paymentStatus === 'paid' 
                    ? 'bg-teal-50 text-teal-700' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {bookingData.paymentStatus || 'Pending'}
                </span>
              </div>
            </div>
            {bookingData.paymentStatus !== 'paid' && (
              <Link
                to={`/client/invoices?booking=${id}`}
                className="px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700"
              >
                Pay Now
              </Link>
            )}
          </div>
        </div>
      </div>

      {bookingData.notes && (
        <div className="bg-white shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Special Instructions
            </h2>
          </div>
          <div className="p-6">
            <p className="text-slate-600">{bookingData.notes}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Need Help?
          </h2>
        </div>
        <div className="p-6">
          <p className="text-slate-600 mb-4">
            Have questions about this booking? Send us a message and we'll get back to you as soon as possible.
          </p>
          <Link
            to="/client/messages"
            className="inline-flex items-center px-6 py-3 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Support
          </Link>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white max-w-md w-full mx-4 shadow-xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Cancel Booking</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600">
                Are you sure you want to cancel this booking for {format(new Date(bookingData.scheduledDate), 'MMMM d, yyyy')}?
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Please let us know why you're cancelling..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={cancelBooking}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
