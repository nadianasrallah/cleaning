import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Calendar, Clock, User, Home, Lightbulb, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'

interface Client {
  client: {
    id: number
    address: string
    bedrooms: number
    bathrooms: string
  }
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

interface Service {
  id: string
  name: string
  basePrice: string
  durationMinutes: number
}

export default function NewBooking() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '09:00',
    address: '',
    bedrooms: 2,
    bathrooms: '1',
    notes: '',
    frequency: 'one-time'
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [clientsRes, servicesRes] = await Promise.all([
        api.get<{ clients: Client[] }>('/clients'),
        api.get<{ services: Service[] }>('/services')
      ])
      setClients(clientsRes.clients || [])
      setServices(servicesRes.services || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  function handleClientChange(clientId: string) {
    setFormData({ ...formData, clientId })
    const selectedClient = clients.find(c => c.client.id === parseInt(clientId))
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientId,
        address: selectedClient.client.address || '',
        bedrooms: selectedClient.client.bedrooms || 2,
        bathrooms: selectedClient.client.bathrooms || '1'
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.clientId || !formData.serviceId) {
      toast.error('Please select a client and service')
      return
    }
    
    setLoading(true)

    try {
      const scheduledDate = new Date(`${formData.date}T${formData.time}:00`)
      
      await api.post('/bookings', {
        clientId: parseInt(formData.clientId),
        serviceId: formData.serviceId,
        scheduledDate: scheduledDate.toISOString(),
        address: formData.address,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        notes: formData.notes,
        frequency: formData.frequency
      })
      
      toast.success('Booking created successfully')
      navigate('/admin/bookings')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.serviceId)
  const estimatedPrice = selectedService ? parseFloat(selectedService.basePrice) : 0

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-cyan-600 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative flex items-start gap-4">
          <Link to="/admin/bookings" className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Create New Booking</h1>
              <p className="text-white/80 mt-1">Schedule a cleaning appointment</p>
            </div>
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
              Select a client to auto-fill their property details. Set up recurring bookings to schedule multiple appointments at once.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 space-y-8 p-8">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-lg">
                <User className="h-5 w-5 text-cyan-600" />
              </div>
              Client & Service
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((c) => (
                    <option key={c.client.id} value={c.client.id}>
                      {c.user.firstName} {c.user.lastName}
                    </option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-sm text-slate-500 mt-2">
                    No clients yet. <Link to="/admin/clients/new" className="text-cyan-600 font-bold hover:text-cyan-700">Add a client first</Link>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Service *</label>
                <select
                  required
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Choose a service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ${parseFloat(s.basePrice).toFixed(2)}
                    </option>
                  ))}
                </select>
                {services.length === 0 && (
                  <p className="text-sm text-slate-500 mt-2">
                    No services yet. <Link to="/admin/services" className="text-cyan-600 font-bold hover:text-cyan-700">Add services first</Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-lg">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              Date & Time
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Time *</label>
                <select
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="one-time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-lg">
                <Home className="h-5 w-5 text-cyan-600" />
              </div>
              Property Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Service address"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bedrooms</label>
                  <select
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bathrooms</label>
                  <select
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    {['1', '1.5', '2', '2.5', '3', '3.5', '4'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Special instructions, access codes, etc."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {selectedService && (
            <div className="bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-extrabold text-cyan-900">{selectedService.name}</p>
                  <p className="text-sm text-cyan-700 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1.5" />
                    Duration: {selectedService.durationMinutes} minutes
                  </p>
                </div>
                <p className="text-3xl font-extrabold text-cyan-900">${estimatedPrice.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-100">
            <Link 
              to="/admin/bookings"
              className="px-6 py-3 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors rounded-lg text-center"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-sky-600 text-white font-bold text-xs uppercase tracking-widest hover:from-cyan-600 hover:to-sky-700 disabled:opacity-50 transition-all rounded-lg shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
