import { useState, useEffect } from 'react'
import { api, Service } from '@/lib/api'
import { 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign, 
  X,
  Package,
  TrendingUp,
  Home,
  Bath,
  ChevronRight,
  Star
} from 'lucide-react'
import { toast } from 'sonner'

const SERVICE_COLORS = [
  { border: 'border-teal-500', bg: 'bg-teal-50', icon: 'text-teal-600' },
  { border: 'border-sky-500', bg: 'bg-sky-50', icon: 'text-sky-600' },
  { border: 'border-violet-500', bg: 'bg-violet-50', icon: 'text-violet-600' },
  { border: 'border-amber-500', bg: 'bg-amber-50', icon: 'text-amber-600' },
  { border: 'border-rose-500', bg: 'bg-rose-50', icon: 'text-rose-600' },
  { border: 'border-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-600' },
]

function getServiceColor(index: number) {
  return SERVICE_COLORS[index % SERVICE_COLORS.length]
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    pricePerBedroom: '',
    pricePerBathroom: '',
    durationMinutes: 60,
  })

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    try {
      const data = await api.get<{ services: Service[] }>('/services')
      setServices(data.services.filter(s => s.isActive))
    } catch (error) {
      console.error('Failed to load services:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(service: Service) {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      basePrice: service.basePrice,
      pricePerBedroom: service.pricePerBedroom || '',
      pricePerBathroom: service.pricePerBathroom || '',
      durationMinutes: service.durationMinutes,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, formData)
        toast.success('Service updated')
      } else {
        await api.post('/services', formData)
        toast.success('Service created')
      }
      
      setShowForm(false)
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        basePrice: '',
        pricePerBedroom: '',
        pricePerBathroom: '',
        durationMinutes: 60,
      })
      loadServices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this service?')) return
    
    try {
      await api.delete(`/services/${id}`)
      toast.success('Service deleted')
      loadServices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service')
    }
  }

  const stats = {
    total: services.length,
    avgPrice: services.length > 0 
      ? Math.round(services.reduce((sum, s) => sum + parseFloat(s.basePrice), 0) / services.length)
      : 0,
    avgDuration: services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + s.durationMinutes, 0) / services.length)
      : 0,
    withPricing: services.filter(s => s.pricePerBedroom || s.pricePerBathroom).length
  }

  const quickStats = [
    { label: 'Total Services', value: stats.total, icon: Package, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Avg Price', value: `$${stats.avgPrice}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg Duration', value: `${stats.avgDuration}m`, icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Dynamic Pricing', value: stats.withPricing, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-100 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Service Configuration</h1>
            </div>
            <p className="text-violet-100 max-w-xl">
              Define your cleaning services with pricing, duration, and descriptions. 
              These will appear on your public booking page for customers to choose from.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingService(null)
              setFormData({
                name: '',
                description: '',
                basePrice: '',
                pricePerBedroom: '',
                pricePerBathroom: '',
                durationMinutes: 60,
              })
              setShowForm(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-violet-700 font-bold text-sm rounded-xl hover:bg-violet-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Services', value: stats.total, icon: Package, gradient: 'from-violet-500 to-purple-600', description: 'Active offerings' },
          { label: 'Avg Price', value: `$${stats.avgPrice}`, icon: DollarSign, gradient: 'from-emerald-500 to-emerald-600', description: 'Base price' },
          { label: 'Avg Duration', value: `${stats.avgDuration}m`, icon: Clock, gradient: 'from-sky-500 to-sky-600', description: 'Per service' },
          { label: 'Dynamic Pricing', value: stats.withPricing, icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', description: 'With size-based rates' },
        ].map((stat, index) => (
          <div 
            key={stat.label} 
            className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.description}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white shadow-lg rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Fill in the details below to configure this service</p>
            </div>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Standard Clean, Deep Clean"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Base Price ($) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe what's included in this service..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Dynamic Pricing (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Per Bedroom ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.pricePerBedroom}
                    onChange={(e) => setFormData({ ...formData, pricePerBedroom: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Bath className="h-3 w-3" />
                    Per Bathroom ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.pricePerBathroom}
                    onChange={(e) => setFormData({ ...formData, pricePerBathroom: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Duration (min) *
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-3 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition-colors"
              >
                {editingService ? 'Save Changes' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm p-12 sm:p-16 text-center border border-slate-100">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl mx-auto mb-5 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-violet-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No services yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Create your first cleaning service to start accepting bookings from customers.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
            >
              <Plus className="h-4 w-4" />
              Create Your First Service
            </button>
          </div>
        ) : (
          services.map((service, index) => {
            const colors = getServiceColor(index)
            return (
              <div 
                key={service.id} 
                className="group bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
              >
                <div className={`h-1.5 bg-gradient-to-r ${index % 6 === 0 ? 'from-teal-400 to-teal-600' : index % 6 === 1 ? 'from-sky-400 to-sky-600' : index % 6 === 2 ? 'from-violet-400 to-violet-600' : index % 6 === 3 ? 'from-amber-400 to-amber-600' : index % 6 === 4 ? 'from-rose-400 to-rose-600' : 'from-emerald-400 to-emerald-600'}`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                        <Sparkles className={`h-5 w-5 ${colors.icon}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">{service.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Base price</span>
                      <span className="text-2xl font-extrabold text-slate-900">${parseFloat(service.basePrice).toFixed(0)}</span>
                    </div>
                    
                    {(service.pricePerBedroom || service.pricePerBathroom) && (
                      <div className="flex flex-wrap gap-2">
                        {service.pricePerBedroom && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded-lg">
                            <Home className="h-3 w-3" />
                            +${parseFloat(service.pricePerBedroom).toFixed(0)}/bed
                          </span>
                        )}
                        {service.pricePerBathroom && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded-lg">
                            <Bath className="h-3 w-3" />
                            +${parseFloat(service.pricePerBathroom).toFixed(0)}/bath
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {service.durationMinutes >= 60 
                        ? `${Math.floor(service.durationMinutes / 60)}h ${service.durationMinutes % 60 ? service.durationMinutes % 60 + 'm' : ''}`
                        : `${service.durationMinutes}m`
                      }
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-violet-500/20 rounded-xl">
            <Star className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Service Configuration Tips</h3>
            <p className="text-slate-400 text-sm mb-4">
              Optimize your services for better customer experience and accurate scheduling.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-violet-400" />
                Use dynamic pricing for fair property-size-based rates
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-violet-400" />
                Set accurate durations to prevent scheduling conflicts
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-violet-400" />
                Write clear descriptions to help customers choose the right service
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
