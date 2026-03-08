import { useState, useEffect } from 'react'
import { api, Lead } from '@/lib/api'
import { Target, Mail, Phone, UserPlus, TrendingUp, Star, ChevronRight, Zap, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    try {
      const data = await api.get<{ leads: Lead[] }>('/leads')
      setLeads(data.leads)
    } catch (error) {
      console.error('Failed to load leads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: number, status: string) {
    try {
      await api.put(`/leads/${id}`, { status })
      toast.success('Lead status updated')
      loadLeads()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    }
  }

  async function handleConvert(id: number) {
    try {
      await api.post(`/leads/${id}/convert`, {})
      toast.success('Lead converted to client!')
      loadLeads()
    } catch (error: any) {
      toast.error(error.message || 'Failed to convert lead')
    }
  }

  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.status === filter)

  const statusColors: Record<string, string> = {
    new: 'bg-sky-50 text-sky-700',
    contacted: 'bg-amber-50 text-amber-700',
    qualified: 'bg-teal-50 text-teal-700',
    converted: 'bg-violet-50 text-violet-700',
    lost: 'bg-slate-100 text-slate-600',
  }

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
  }

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-100 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Target className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Lead Management</h1>
          </div>
          <p className="text-amber-100 max-w-xl">
            Track potential customers from quote requests, abandoned bookings, and referrals. 
            Convert qualified leads into paying clients with systematic follow-up.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Target, gradient: 'from-amber-500 to-orange-500', description: 'In pipeline' },
          { label: 'New Leads', value: stats.new, icon: Zap, gradient: 'from-sky-500 to-blue-600', description: 'Awaiting contact' },
          { label: 'Qualified', value: stats.qualified, icon: Star, gradient: 'from-teal-500 to-emerald-600', description: 'Ready to convert' },
          { label: 'Converted', value: stats.converted, icon: TrendingUp, gradient: 'from-violet-500 to-purple-600', description: 'Now clients' },
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

      {/* Lead List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex gap-2 flex-wrap">
            {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLeads.length === 0 ? (
            <div className="p-12 sm:p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mx-auto mb-5 flex items-center justify-center">
                <Target className="h-10 w-10 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No leads found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                New leads will appear here when visitors request quotes or leave contact information on your booking page.
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {lead.firstName} {lead.lastName}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                      {lead.score > 0 && (
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5">
                          Score: {lead.score}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                      {lead.email && (
                        <span className="flex items-center text-sm text-slate-500 truncate">
                          <Mail className="h-4 w-4 mr-1.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center text-sm text-slate-500">
                          <Phone className="h-4 w-4 mr-1.5 text-slate-400 flex-shrink-0" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.source && (
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          via {lead.source}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {lead.status === 'new' && (
                      <button
                        onClick={() => handleStatusChange(lead.id, 'contacted')}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {lead.status === 'contacted' && (
                      <button
                        onClick={() => handleStatusChange(lead.id, 'qualified')}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                      >
                        Qualify
                      </button>
                    )}
                    {['new', 'contacted', 'qualified'].includes(lead.status) && (
                      <button
                        onClick={() => handleConvert(lead.id)}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest bg-sky-600 text-white hover:bg-sky-700 transition-colors"
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Convert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 rounded-xl">
            <Lightbulb className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Lead Conversion Tips</h3>
            <p className="text-slate-400 text-sm mb-4">
              Maximize your conversion rates with these proven strategies.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-amber-400" />
                <span><strong>Speed matters:</strong> Contact new leads within 24 hours for 5x higher conversion</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-amber-400" />
                <span><strong>Follow the flow:</strong> New → Contacted → Qualified → Converted</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-amber-400" />
                <span><strong>Track sources:</strong> Identify which channels bring your best leads</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-amber-400" />
                <span><strong>Convert quickly:</strong> When a lead is ready, click Convert to create their client profile</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
