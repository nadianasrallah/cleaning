import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail, 
  DollarSign, FileText, Edit2, Check, X, Users, RefreshCw,
  CreditCard, MessageSquare, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'completed', label: 'Completed', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
]

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState<any[]>([])
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  useEffect(() => {
    loadBooking()
    loadStaff()
  }, [id])

  async function loadBooking() {
    try {
      const data = await api.get<any>(`/bookings/${id}`)
      setBooking(data)
      setNotes(data.booking?.notes || '')
    } catch (error) {
      console.error('Failed to load booking:', error)
      toast.error('Failed to load booking')
    } finally {
      setLoading(false)
    }
  }

  async function loadStaff() {
    try {
      const data = await api.get<{ staff: any[] }>('/staff')
      setStaffList(data.staff)
    } catch (error) {
      console.error('Failed to load staff:', error)
    }
  }

  async function updateStatus(newStatus: string) {
    setSaving(true)
    try {
      await api.put(`/bookings/${id}`, { status: newStatus })
      setBooking((prev: any) => ({
        ...prev,
        booking: { ...prev.booking, status: newStatus }
      }))
      toast.success(`Status updated to ${newStatus}`)
      setShowStatusMenu(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  async function saveNotes() {
    setSaving(true)
    try {
      await api.put(`/bookings/${id}`, { notes })
      setBooking((prev: any) => ({
        ...prev,
        booking: { ...prev.booking, notes }
      }))
      setEditingNotes(false)
      toast.success('Notes saved')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  async function assignStaff(staffId: number | null) {
    setSaving(true)
    try {
      await api.post(`/bookings/${id}/assign`, { staffId })
      await loadBooking()
      toast.success(staffId ? 'Staff assigned' : 'Staff unassigned')
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign staff')
    } finally {
      setSaving(false)
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
        <Link to="/admin/bookings" className="text-teal-600 hover:text-teal-700 mt-2 inline-block">
          Back to bookings
        </Link>
      </div>
    )
  }

  const { booking: bookingData, client, clientUser, service, staff: assignedStaff } = booking
  const currentStatus = STATUSES.find(s => s.value === bookingData.status)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/bookings')}
            className="p-2 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Booking Details
            </h1>
            <p className="text-slate-500 mt-1">
              {format(new Date(bookingData.scheduledDate), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`px-6 py-3 border font-bold text-xs uppercase tracking-widest ${currentStatus?.color}`}
            disabled={saving}
          >
            {currentStatus?.label || bookingData.status}
          </button>
          {showStatusMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg border border-slate-200 z-10">
              {STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => updateStatus(status.value)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                    bookingData.status === status.value ? 'bg-slate-50' : ''
                  }`}
                >
                  {bookingData.status === status.value && (
                    <Check className="h-4 w-4 text-teal-600" />
                  )}
                  <span className={bookingData.status === status.value ? 'font-medium' : ''}>
                    {status.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm border-t-4 border-teal-600">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Appointment Details
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                    <p className="text-slate-900 font-medium">
                      {format(new Date(bookingData.scheduledDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</p>
                    <p className="text-slate-900 font-medium">{bookingData.scheduledTime || 'TBD'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service</p>
                    <p className="text-slate-900 font-medium">{service?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price</p>
                    <p className="text-slate-900 font-medium">
                      ${parseFloat(bookingData.totalPrice || service?.basePrice || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                  <p className="text-slate-900 font-medium">
                    {bookingData.address || client?.address || 'No address provided'}
                  </p>
                  {(bookingData.bedrooms || bookingData.bathrooms) && (
                    <p className="text-slate-500 text-sm mt-1">
                      {bookingData.bedrooms} bed, {bookingData.bathrooms} bath
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {bookingData.frequency !== 'one-time' && (
            <div className="bg-white shadow-sm border-t-4 border-sky-500">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recurring Schedule</p>
                    <p className="text-slate-900 font-medium capitalize">{bookingData.frequency}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Notes & Instructions
              </h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-teal-600 hover:text-teal-700"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="p-6">
              {editingNotes ? (
                <div className="space-y-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Add notes about this booking..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveNotes}
                      disabled={saving}
                      className="px-4 py-2 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(false)
                        setNotes(bookingData.notes || '')
                      }}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-600">
                  {bookingData.notes || 'No notes added yet.'}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Payment Status
              </h2>
            </div>
            <div className="p-6">
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
                  {bookingData.paymentIntentId && (
                    <p className="text-slate-500 text-sm mt-2">
                      Payment ID: {bookingData.paymentIntentId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm border-t-4 border-sky-500">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Client Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {clientUser?.firstName} {clientUser?.lastName}
                  </p>
                  <Link 
                    to={`/admin/clients/${client?.id}`}
                    className="text-teal-600 hover:text-teal-700 text-sm"
                  >
                    View profile
                  </Link>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{clientUser?.email}</span>
                </div>
                {clientUser?.phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{clientUser.phone}</span>
                  </div>
                )}
              </div>
              <Link
                to={`/admin/messages?client=${client?.id}`}
                className="block w-full mt-4 px-4 py-3 border border-slate-200 text-center font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50"
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Message Client
              </Link>
            </div>
          </div>

          <div className="bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Assigned Staff
              </h2>
            </div>
            <div className="p-6">
              {assignedStaff ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {assignedStaff.user?.firstName} {assignedStaff.user?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{assignedStaff.staff?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => assignStaff(null)}
                    disabled={saving}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-slate-500 text-sm">No staff assigned</p>
                  <select
                    onChange={(e) => assignStaff(parseInt(e.target.value))}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Select staff member</option>
                    {staffList.map((s) => (
                      <option key={s.staff.id} value={s.staff.id}>
                        {s.user.firstName} {s.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-teal-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Created</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(bookingData.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                {bookingData.completedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 bg-teal-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Completed</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(bookingData.completedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
                {bookingData.cancelledAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Cancelled</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(bookingData.cancelledAt), 'MMM d, yyyy h:mm a')}
                      </p>
                      {bookingData.cancellationReason && (
                        <p className="text-xs text-slate-600 mt-1">
                          Reason: {bookingData.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
