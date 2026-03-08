import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MapPin,
  Plus,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface Booking {
  id: number
  scheduledDate: string
  status: string
  serviceName: string
  address: string
  totalPrice: string
  notes: string
}

export default function ClientBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')

  useEffect(() => {
    loadBookings()
  }, [filter])

  async function loadBookings() {
    try {
      setLoading(true)
      const res = await api.get(`/client/bookings?status=${filter}`)
      setBookings(res.bookings || [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700',
      confirmed: 'bg-sky-50 text-sky-700',
      in_progress: 'bg-violet-50 text-violet-700',
      completed: 'bg-teal-50 text-teal-700',
      cancelled: 'bg-red-50 text-red-700',
    }
    return styles[status] || 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">View and manage your cleaning appointments</p>
        </div>
        <Link 
          to="/client/bookings/new"
          className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Book a Cleaning
        </Link>
      </div>

      <div className="flex gap-2">
        {(['all', 'upcoming', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              filter === f
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white shadow-sm p-16 text-center">
          <div className="h-16 w-16 bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
          </h3>
          <p className="text-slate-500 mb-6">
            {filter === 'all' 
              ? 'Schedule your first cleaning service today' 
              : 'Check back later or book a new cleaning'}
          </p>
          <Link 
            to="/client/bookings/new"
            className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Book a Cleaning
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-7 w-7 text-teal-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">{booking.serviceName}</h3>
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusBadge(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 mt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {format(new Date(booking.scheduledDate), 'EEEE, MMMM d, yyyy')} at{' '}
                        {format(new Date(booking.scheduledDate), 'h:mm a')}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {booking.address}
                      </div>
                    </div>
                    {booking.notes && (
                      <p className="text-sm text-slate-400 mt-2">{booking.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-extrabold text-slate-900">
                    ${parseFloat(booking.totalPrice).toFixed(2)}
                  </span>
                  <Link 
                    to={`/client/bookings/${booking.id}`}
                    className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
