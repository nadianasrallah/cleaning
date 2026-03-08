import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Plus,
  ArrowRight,
  Sparkles,
  MapPin,
  DollarSign
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
}

interface DashboardStats {
  upcomingBookings: number
  completedBookings: number
  totalSpent: number
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<DashboardStats>({ upcomingBookings: 0, completedBookings: 0, totalSpent: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        api.get('/client/bookings?status=upcoming&limit=3'),
        api.get('/client/stats')
      ])
      setUpcomingBookings(bookingsRes.bookings || [])
      setStats(statsRes.stats || { upcomingBookings: 0, completedBookings: 0, totalSpent: 0 })
    } catch (error) {
      console.error('Failed to load dashboard:', error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Here's an overview of your cleaning services
          </p>
        </div>
        <Link 
          to="/client/bookings/new"
          className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Book a Cleaning
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white shadow-sm border-t-4 border-sky-500 p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-sky-100 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.upcomingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm border-t-4 border-teal-500 p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-teal-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.completedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm border-t-4 border-violet-500 p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-violet-100 flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Spent</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                ${stats.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Bookings</h2>
          <Link 
            to="/client/bookings" 
            className="text-teal-600 hover:text-teal-700 text-sm font-bold flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white shadow-sm p-16 text-center">
            <div className="h-16 w-16 bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No upcoming bookings</h3>
            <p className="text-slate-500 mb-6">Schedule your next cleaning service today</p>
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
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="bg-white shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-7 w-7 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{booking.serviceName}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {format(new Date(booking.scheduledDate), 'EEEE, MMMM d, yyyy')} at{' '}
                        {format(new Date(booking.scheduledDate), 'h:mm a')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {booking.address}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusBadge(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <span className="text-xl font-extrabold text-slate-900">
                      ${parseFloat(booking.totalPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
