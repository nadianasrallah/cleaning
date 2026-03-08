import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Calendar, Plus, Search, Clock, User, MapPin, ArrowRight, ChevronDown, Check, List, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Lightbulb, Sparkles } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { toast } from 'sonner'

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700', dotColor: 'bg-amber-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-sky-50 text-sky-700', dotColor: 'bg-sky-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-violet-50 text-violet-700', dotColor: 'bg-violet-500' },
  { value: 'completed', label: 'Completed', color: 'bg-teal-50 text-teal-700', dotColor: 'bg-teal-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-700', dotColor: 'bg-red-500' },
]

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700' },
  { value: 'paid', label: 'Paid', color: 'bg-green-50 text-green-700' },
  { value: 'failed', label: 'Failed', color: 'bg-red-50 text-red-700' },
  { value: 'refunded', label: 'Refunded', color: 'bg-slate-50 text-slate-700' },
]

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdown && !(e.target as Element).closest('.status-dropdown')) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openDropdown])

  async function loadBookings() {
    try {
      const data = await api.get<{ bookings: any[] }>('/bookings')
      setBookings(data.bookings)
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateBookingStatus(bookingId: string, newStatus: string) {
    setUpdatingBooking(bookingId)
    try {
      await api.put(`/bookings/${bookingId}`, { status: newStatus })
      setBookings(prev => prev.map(b => 
        b.booking.id === bookingId 
          ? { ...b, booking: { ...b.booking, status: newStatus } }
          : b
      ))
      toast.success(`Booking status updated to ${newStatus}`)
      setOpenDropdown(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking status')
    } finally {
      setUpdatingBooking(null)
    }
  }

  const filteredBookings = bookings.filter(b => {
    if (filter !== 'all' && b.booking.status !== filter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      const clientName = `${b.clientUser?.firstName || ''} ${b.clientUser?.lastName || ''}`.toLowerCase()
      return clientName.includes(searchLower) || b.service?.name?.toLowerCase().includes(searchLower)
    }
    return true
  })

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-sky-50 text-sky-700',
    'in-progress': 'bg-violet-50 text-violet-700',
    completed: 'bg-teal-50 text-teal-700',
    cancelled: 'bg-red-50 text-red-700',
  }

  const statusDotColors: Record<string, string> = {
    pending: 'bg-amber-500',
    confirmed: 'bg-sky-500',
    'in-progress': 'bg-violet-500',
    completed: 'bg-teal-500',
    cancelled: 'bg-red-500',
  }

  function getStatusLabel(status: string) {
    const found = STATUSES.find(s => s.value === status)
    return found?.label || status
  }

  function getPaymentStatusInfo(status: string) {
    const found = PAYMENT_STATUSES.find(s => s.value === status)
    return found || { value: status, label: status, color: 'bg-slate-50 text-slate-700' }
  }

  function getBookingsForDate(date: Date) {
    return filteredBookings.filter(b => {
      const bookingDate = new Date(b.booking.scheduledDate)
      return isSameDay(bookingDate, date)
    })
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-cyan-600 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Bookings</h1>
              <p className="text-white/80 mt-1 text-sm sm:text-base">
                Manage your cleaning appointments • {filteredBookings.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-white/20 backdrop-blur-sm rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 sm:px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                  viewMode === 'list' ? 'bg-white text-cyan-600' : 'text-white hover:bg-white/20'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 sm:px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                  viewMode === 'calendar' ? 'bg-white text-cyan-600' : 'text-white hover:bg-white/20'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/admin/bookings/new"
              className="inline-flex items-center px-6 py-3 bg-white text-cyan-600 font-bold text-xs uppercase tracking-widest hover:bg-cyan-50 transition-colors shadow-lg rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Link>
          </div>
        </div>
      </div>

      {/* Pro Tips Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl"></div>
        <div className="relative flex items-start gap-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">Pro Tips</h3>
            <p className="text-slate-300 text-sm">
              Move bookings through the workflow: Pending → Confirmed → In Progress → Completed. 
              Use recurring schedules for regular clients to save time and build predictable revenue.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${
                  filter === status
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-extrabold text-slate-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-slate-50 p-3 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{day}</span>
                </div>
              ))}
              {calendarDays.map((day) => {
                const dayBookings = getBookingsForDate(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`bg-white min-h-[100px] p-2 cursor-pointer transition-colors ${
                      !isCurrentMonth ? 'bg-slate-50' : ''
                    } ${isSelected ? 'ring-2 ring-teal-600 ring-inset' : ''} hover:bg-slate-50`}
                  >
                    <div className={`text-sm font-bold mb-1 ${
                      isToday ? 'h-7 w-7 bg-teal-600 text-white flex items-center justify-center' : 
                      isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.booking.id}
                          className={`text-xs p-1 truncate ${statusColors[b.booking.status] || 'bg-slate-100'}`}
                        >
                          <span className="font-medium">{format(new Date(b.booking.scheduledDate), 'h:mm a')}</span>
                          {' '}{b.clientUser?.firstName}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-slate-500 font-medium">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              {STATUSES.map((status) => (
                <div key={status.value} className="flex items-center gap-2">
                  <div className={`h-3 w-3 ${status.dotColor}`}></div>
                  <span className="text-xs text-slate-600">{status.label}</span>
                </div>
              ))}
            </div>

            {selectedDate && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-lg font-extrabold text-slate-900 mb-4">
                  Bookings for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                {selectedDateBookings.length === 0 ? (
                  <p className="text-slate-500">No bookings on this date</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateBookings.map((b) => (
                      <div key={b.booking.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-extrabold text-slate-900">
                              {format(new Date(b.booking.scheduledDate), 'h:mm')}
                            </div>
                            <div className="text-xs text-slate-500 uppercase">
                              {format(new Date(b.booking.scheduledDate), 'a')}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {b.clientUser?.firstName} {b.clientUser?.lastName}
                            </div>
                            <div className="text-sm text-slate-500">{b.service?.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative status-dropdown">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenDropdown(openDropdown === b.booking.id ? null : b.booking.id)
                              }}
                              disabled={updatingBooking === b.booking.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                                statusColors[b.booking.status] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {getStatusLabel(b.booking.status)}
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            {openDropdown === b.booking.id && (
                              <div className="absolute z-20 mt-1 right-0 bg-white border border-slate-200 shadow-lg min-w-[160px]">
                                <div className="py-1">
                                  {STATUSES.map((status) => (
                                    <button
                                      key={status.value}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (b.booking.status !== status.value) {
                                          updateBookingStatus(b.booking.id, status.value)
                                        }
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm font-medium flex items-center justify-between hover:bg-slate-50"
                                    >
                                      <span className={`px-2 py-0.5 text-xs font-bold uppercase ${status.color}`}>
                                        {status.label}
                                      </span>
                                      {b.booking.status === status.value && (
                                        <Check className="h-4 w-4 text-teal-600" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/admin/bookings/${b.booking.id}`}
                            className="text-teal-600 hover:text-teal-700 font-bold text-sm"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No bookings found</p>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-slate-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900">
                              {b.clientUser?.firstName} {b.clientUser?.lastName}
                            </div>
                            <div className="text-sm text-slate-500">{b.clientUser?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{b.service?.name}</div>
                        {b.client?.address && (
                          <div className="text-sm text-slate-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {b.client.address}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">
                          {format(new Date(b.booking.scheduledDate), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {b.booking.scheduledTime || format(new Date(b.booking.scheduledDate), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${getPaymentStatusInfo(b.booking.paymentStatus || 'pending').color}`}>
                          <CreditCard className="h-3 w-3" />
                          {getPaymentStatusInfo(b.booking.paymentStatus || 'pending').label}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative status-dropdown">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenDropdown(openDropdown === b.booking.id ? null : b.booking.id)
                            }}
                            disabled={updatingBooking === b.booking.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md ${
                              statusColors[b.booking.status] || 'bg-slate-100 text-slate-600'
                            } ${updatingBooking === b.booking.id ? 'opacity-50' : ''}`}
                          >
                            {updatingBooking === b.booking.id ? (
                              <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent"></span>
                            ) : (
                              <>
                                {getStatusLabel(b.booking.status)}
                                <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>

                          {openDropdown === b.booking.id && (
                            <div className="absolute z-20 mt-1 left-0 bg-white border border-slate-200 shadow-lg min-w-[160px]">
                              <div className="py-1">
                                {STATUSES.map((status) => (
                                  <button
                                    key={status.value}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (b.booking.status !== status.value) {
                                        updateBookingStatus(b.booking.id, status.value)
                                      }
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                      b.booking.status === status.value ? 'bg-slate-50' : ''
                                    }`}
                                  >
                                    <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${status.color}`}>
                                      {status.label}
                                    </span>
                                    {b.booking.status === status.value && (
                                      <Check className="h-4 w-4 text-teal-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">
                          ${parseFloat(b.booking.totalPrice || '0').toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/admin/bookings/${b.booking.id}`}
                          className="inline-flex items-center text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          View <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewMode === 'list' && (
        <div className="bg-white shadow-sm p-6 border-t-4 border-sky-500">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const pendingBookings = bookings.filter(b => b.booking.status === 'pending')
                if (pendingBookings.length === 0) {
                  toast.info('No pending bookings to confirm')
                  return
                }
                if (confirm(`Confirm all ${pendingBookings.length} pending booking(s)?`)) {
                  pendingBookings.forEach(b => updateBookingStatus(b.booking.id, 'confirmed'))
                }
              }}
              className="px-4 py-2 bg-sky-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-sky-700 transition-colors"
            >
              Confirm All Pending
            </button>
            <button
              onClick={() => {
                const confirmedBookings = bookings.filter(b => b.booking.status === 'confirmed')
                if (confirmedBookings.length === 0) {
                  toast.info('No confirmed bookings to mark as completed')
                  return
                }
                if (confirm(`Mark all ${confirmedBookings.length} confirmed booking(s) as completed?`)) {
                  confirmedBookings.forEach(b => updateBookingStatus(b.booking.id, 'completed'))
                }
              }}
              className="px-4 py-2 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition-colors"
            >
              Complete All Confirmed
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
