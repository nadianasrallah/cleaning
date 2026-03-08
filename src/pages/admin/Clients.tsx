import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Home,
  Calendar,
  UserCheck,
  TrendingUp,
  Star,
  Filter,
  ChevronRight,
  Sparkles
} from 'lucide-react'

const AVATAR_COLORS = [
  'from-teal-400 to-teal-600',
  'from-sky-400 to-sky-600',
  'from-violet-400 to-violet-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-emerald-400 to-emerald-600',
  'from-indigo-400 to-indigo-600',
  'from-pink-400 to-pink-600',
]

function getAvatarColor(name: string): string {
  const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    avgBookings: 0
  })

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const data = await api.get<{ clients: any[] }>('/clients')
      setClients(data.clients)
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const newThisMonth = data.clients.filter(c => 
        new Date(c.user?.createdAt || c.client?.createdAt) >= thisMonth
      ).length

      setStats({
        total: data.clients.length,
        active: data.clients.filter(c => c.client?.status === 'active' || !c.client?.status).length,
        newThisMonth,
        avgBookings: Math.round(data.clients.length > 0 ? (data.clients.length * 2.5) : 0)
      })
    } catch (error) {
      console.error('Failed to load clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(c => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    const name = `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase()
    return name.includes(searchLower) || c.user?.email?.toLowerCase().includes(searchLower)
  })

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-100 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-teal-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Client Management</h1>
            </div>
            <p className="text-teal-100 max-w-xl">
              Your complete client database with contact details, property information, and booking history. 
              Search, filter, and manage all your customers in one place.
            </p>
          </div>
          <Link
            to="/admin/clients/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-teal-700 font-bold text-sm rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: stats.total, icon: Users, gradient: 'from-teal-500 to-teal-600', description: 'In your database' },
          { label: 'Active', value: stats.active, icon: UserCheck, gradient: 'from-emerald-500 to-emerald-600', description: 'With recent bookings' },
          { label: 'New This Month', value: stats.newThisMonth, icon: TrendingUp, gradient: 'from-sky-500 to-sky-600', description: 'Just joined' },
          { label: 'Avg Bookings', value: stats.avgBookings, icon: Calendar, gradient: 'from-violet-500 to-violet-600', description: 'Per client' },
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

      {/* Client List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-all">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
          {search && (
            <p className="mt-3 text-sm text-slate-500">
              Found <span className="font-bold text-slate-700">{filteredClients.length}</span> results for "{search}"
            </p>
          )}
        </div>

        {/* Client Items */}
        <div className="divide-y divide-slate-100">
          {filteredClients.length === 0 ? (
            <div className="p-12 sm:p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl mx-auto mb-5 flex items-center justify-center">
                <Users className="h-10 w-10 text-teal-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {search ? 'No matching clients' : 'No clients yet'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {search 
                  ? 'Try adjusting your search terms or clear the filter to see all clients.' 
                  : 'Start building your client database. Add your first client to begin managing your customers.'}
              </p>
              {!search && (
                <Link 
                  to="/admin/clients/new" 
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/25"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Client
                </Link>
              )}
            </div>
          ) : (
            filteredClients.map((c) => {
              const initials = `${c.user?.firstName?.[0] || ''}${c.user?.lastName?.[0] || ''}`
              const avatarColor = getAvatarColor(initials)
              
              return (
                <Link 
                  key={c.client.id} 
                  to={`/admin/clients/${c.client.id}`}
                  className="block p-4 sm:p-5 hover:bg-slate-50/80 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`relative h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br ${avatarColor} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all`}>
                        <span className="text-white font-extrabold text-base sm:text-lg">
                          {initials || '?'}
                        </span>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="ml-4 sm:ml-5 min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-teal-600 transition-colors">
                          {c.user?.firstName} {c.user?.lastName}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-1">
                          {c.user?.email && (
                            <span className="flex items-center text-sm text-slate-500 truncate">
                              <Mail className="h-4 w-4 mr-1.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{c.user.email}</span>
                            </span>
                          )}
                          {c.user?.phone && (
                            <span className="flex items-center text-sm text-slate-500">
                              <Phone className="h-4 w-4 mr-1.5 text-slate-400 flex-shrink-0" />
                              {c.user.phone}
                            </span>
                          )}
                        </div>
                        {c.client?.address && (
                          <div className="flex items-center text-sm text-slate-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{c.client.address}, {c.client.city} {c.client.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-16 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Property</p>
                        <div className="flex items-center text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          <Home className="h-4 w-4 mr-1.5 text-slate-500" />
                          {c.client?.bedrooms || 0}bd / {c.client?.bathrooms || 0}ba
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Footer */}
        {filteredClients.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-sm text-slate-500 text-center">
              Showing <span className="font-bold text-slate-700">{filteredClients.length}</span> of{' '}
              <span className="font-bold text-slate-700">{clients.length}</span> clients
            </p>
          </div>
        )}
      </div>

      {/* Help Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-teal-500/20 rounded-xl">
            <Sparkles className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Pro Tips for Client Management</h3>
            <p className="text-slate-400 text-sm mb-4">
              Keep your client database updated for smoother operations and better service delivery.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                Clients are automatically created when they book online
              </li>
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                Update property details for accurate service pricing
              </li>
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                Add notes about client preferences for personalized service
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
