import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Home,
  MessageSquare, Plus, Edit2, AlertCircle, DollarSign, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-sky-50 text-sky-700',
  'in-progress': 'bg-violet-50 text-violet-700',
  completed: 'bg-teal-50 text-teal-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadClient()
  }, [id])

  async function loadClient() {
    try {
      const data = await api.get<any>(`/clients/${id}`)
      setClient(data)
      setFormData({
        firstName: data.user?.firstName || '',
        lastName: data.user?.lastName || '',
        phone: data.user?.phone || '',
        address: data.client?.address || '',
        city: data.client?.city || '',
        state: data.client?.state || '',
        zipCode: data.client?.zipCode || '',
        propertyType: data.client?.propertyType || '',
        bedrooms: data.client?.bedrooms || '',
        bathrooms: data.client?.bathrooms || '',
        squareFeet: data.client?.squareFeet || '',
        accessInstructions: data.client?.accessInstructions || '',
        notes: data.client?.notes || '',
      })
    } catch (error) {
      console.error('Failed to load client:', error)
      toast.error('Failed to load client')
    } finally {
      setLoading(false)
    }
  }

  async function saveClient() {
    setSaving(true)
    try {
      await api.put(`/clients/${id}`, formData)
      await loadClient()
      setEditing(false)
      toast.success('Client updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update client')
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

  if (!client) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Client not found</h2>
        <Link to="/admin/clients" className="text-teal-600 hover:text-teal-700 mt-2 inline-block">
          Back to clients
        </Link>
      </div>
    )
  }

  const { client: clientData, user, bookings } = client

  const completedBookings = bookings?.filter((b: any) => b.status === 'completed') || []
  const upcomingBookings = bookings?.filter((b: any) => 
    ['pending', 'confirmed'].includes(b.status) && new Date(b.scheduledDate) >= new Date()
  ) || []
  const totalSpent = bookings?.reduce((sum: number, b: any) => 
    b.status === 'completed' ? sum + parseFloat(b.totalPrice || 0) : sum, 0
  ) || 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/clients')}
            className="p-2 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-slate-500 mt-1">
              Client since {format(new Date(clientData?.createdAt || new Date()), 'MMMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/admin/messages?client=${id}`}
            className="inline-flex items-center px-4 py-3 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Link>
          <Link
            to={`/admin/bookings/new?client=${id}`}
            className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white shadow-sm p-6 border-t-4 border-teal-600">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Bookings</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{bookings?.length || 0}</p>
        </div>
        <div className="bg-white shadow-sm p-6 border-t-4 border-sky-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{upcomingBookings.length}</p>
        </div>
        <div className="bg-white shadow-sm p-6 border-t-4 border-violet-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{completedBookings.length}</p>
        </div>
        <div className="bg-white shadow-sm p-6 border-t-4 border-amber-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Spent</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">${totalSpent.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Contact Information
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-teal-600 hover:text-teal-700"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="p-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveClient}
                      disabled={saving}
                      className="px-4 py-2 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-900">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-900">{user?.phone || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Booking History
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {bookings && bookings.length > 0 ? (
                bookings.slice(0, 10).map((booking: any) => (
                  <Link
                    key={booking.id}
                    to={`/admin/bookings/${booking.id}`}
                    className="block p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {format(new Date(booking.scheduledDate), 'MMMM d, yyyy')}
                          </p>
                          <p className="text-sm text-slate-500">
                            {booking.scheduledTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-900 font-medium">
                          ${parseFloat(booking.totalPrice || 0).toFixed(2)}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusColors[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">
                  No bookings yet
                </div>
              )}
            </div>
            {bookings && bookings.length > 10 && (
              <div className="p-4 border-t border-slate-100 text-center">
                <Link 
                  to={`/admin/bookings?client=${id}`}
                  className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                >
                  View all {bookings.length} bookings
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm border-t-4 border-teal-600">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Property Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</p>
                  <p className="text-slate-900">
                    {clientData?.address || 'Not provided'}
                  </p>
                  {(clientData?.city || clientData?.state || clientData?.zipCode) && (
                    <p className="text-slate-600">
                      {[clientData.city, clientData.state, clientData.zipCode].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Home className="h-5 w-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Type</p>
                  <p className="text-slate-900 capitalize">
                    {clientData?.propertyType || 'Not specified'}
                  </p>
                </div>
              </div>
              {(clientData?.bedrooms || clientData?.bathrooms) && (
                <div className="pt-2 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bedrooms</p>
                    <p className="text-xl font-bold text-slate-900">{clientData.bedrooms || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bathrooms</p>
                    <p className="text-xl font-bold text-slate-900">{clientData.bathrooms || '-'}</p>
                  </div>
                </div>
              )}
              {clientData?.squareFeet && (
                <div className="bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Square Feet</p>
                  <p className="text-xl font-bold text-slate-900">{clientData.squareFeet.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {clientData?.accessInstructions && (
            <div className="bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Access Instructions
                </h2>
              </div>
              <div className="p-6">
                <p className="text-slate-600">{clientData.accessInstructions}</p>
              </div>
            </div>
          )}

          {clientData?.notes && (
            <div className="bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Notes
                </h2>
              </div>
              <div className="p-6">
                <p className="text-slate-600">{clientData.notes}</p>
              </div>
            </div>
          )}

          <div className="bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Source
              </h2>
            </div>
            <div className="p-6">
              <p className="text-slate-900 capitalize">{clientData?.source || 'Direct'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
