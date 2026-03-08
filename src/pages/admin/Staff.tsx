import { useState, useEffect } from 'react'
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Clock, 
  Mail, 
  Phone,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  User,
  Users,
  DollarSign,
  Calendar,
  Briefcase,
  Award,
  CheckCircle,
  ChevronRight,
  Lightbulb
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface StaffMember {
  staff: {
    id: number
    role: string
    hourlyRate: string
    skills: string[]
    availability: Record<string, { start: string; end: string }>
    isActive: boolean
  }
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
    phone: string
    avatarUrl: string
  }
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
}

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
]

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

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  cleaner: { bg: 'bg-teal-50', text: 'text-teal-700' },
  manager: { bg: 'bg-violet-50', text: 'text-violet-700' },
  admin: { bg: 'bg-amber-50', text: 'text-amber-700' },
}

export default function Staff() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [expandedStaff, setExpandedStaff] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const [newStaffForm, setNewStaffForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'cleaner',
    hourlyRate: ''
  })

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'cleaner',
    hourlyRate: ''
  })

  const [availabilityForm, setAvailabilityForm] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({})

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    try {
      const data = await api.get<{ staff: StaffMember[] }>('/staff')
      setStaffMembers(data.staff || [])
    } catch (error) {
      console.error('Failed to load staff:', error)
      toast.error('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      await api.post('/staff', newStaffForm)
      toast.success('Staff member added successfully')
      setShowAddModal(false)
      setNewStaffForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'cleaner',
        hourlyRate: ''
      })
      loadStaff()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add staff member')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStaff) return
    setSaving(true)

    try {
      await api.put(`/staff/${selectedStaff.staff.id}`, editForm)
      toast.success('Staff member updated successfully')
      setShowEditModal(false)
      loadStaff()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update staff member')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateAvailability(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStaff) return
    setSaving(true)

    try {
      const availability: Record<string, { start: string; end: string }> = {}
      for (const day of DAYS_OF_WEEK) {
        if (availabilityForm[day]?.enabled) {
          availability[day] = {
            start: availabilityForm[day].start,
            end: availabilityForm[day].end
          }
        }
      }

      await api.put(`/staff/${selectedStaff.staff.id}`, { availability })
      toast.success('Availability updated successfully')
      setShowAvailabilityModal(false)
      loadStaff()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update availability')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteStaff(staff: StaffMember) {
    if (!confirm(`Are you sure you want to deactivate ${staff.user.firstName} ${staff.user.lastName}?`)) {
      return
    }

    try {
      await api.delete(`/staff/${staff.staff.id}`)
      toast.success('Staff member deactivated')
      loadStaff()
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate staff member')
    }
  }

  function openEditModal(staff: StaffMember) {
    setSelectedStaff(staff)
    setEditForm({
      firstName: staff.user.firstName || '',
      lastName: staff.user.lastName || '',
      phone: staff.user.phone || '',
      role: staff.staff.role || 'cleaner',
      hourlyRate: staff.staff.hourlyRate || ''
    })
    setShowEditModal(true)
  }

  function openAvailabilityModal(staff: StaffMember) {
    setSelectedStaff(staff)
    const form: Record<string, { enabled: boolean; start: string; end: string }> = {}
    for (const day of DAYS_OF_WEEK) {
      const dayAvail = staff.staff.availability?.[day]
      form[day] = {
        enabled: !!dayAvail,
        start: dayAvail?.start || '09:00',
        end: dayAvail?.end || '17:00'
      }
    }
    setAvailabilityForm(form)
    setShowAvailabilityModal(true)
  }

  const filteredStaff = staffMembers.filter(s => {
    const name = `${s.user.firstName} ${s.user.lastName}`.toLowerCase()
    const email = s.user.email.toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  const activeStaff = filteredStaff.filter(s => s.staff.isActive)
  const inactiveStaff = filteredStaff.filter(s => !s.staff.isActive)

  const stats = {
    total: staffMembers.length,
    active: staffMembers.filter(s => s.staff.isActive).length,
    cleaners: staffMembers.filter(s => s.staff.role === 'cleaner').length,
    avgRate: staffMembers.length > 0 
      ? Math.round(staffMembers.reduce((sum, s) => sum + parseFloat(s.staff.hourlyRate || '0'), 0) / staffMembers.length)
      : 0
  }

  const quickStats = [
    { label: 'Total Staff', value: stats.total, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Cleaners', value: stats.cleaners, icon: Briefcase, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Avg Rate', value: `$${stats.avgRate}/hr`, icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  function getAvailabilitySummary(availability: Record<string, { start: string; end: string }> | null) {
    if (!availability) return 'No availability set'
    const days = Object.keys(availability)
    if (days.length === 0) return 'No availability set'
    if (days.length === 7) return 'All week'
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return 'Weekdays'
    }
    return `${days.length} days`
  }

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-sky-100 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-sky-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading team...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Staff Management</h1>
            </div>
            <p className="text-sky-100 max-w-xl">
              Manage your cleaning team, set their availability, and track hourly rates. 
              The system uses this information for automatic scheduling and cost calculation.
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-sky-700 font-bold text-sm rounded-xl hover:bg-sky-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats.total, icon: Users, gradient: 'from-sky-500 to-blue-600', description: 'Team members' },
          { label: 'Active', value: stats.active, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', description: 'Currently working' },
          { label: 'Cleaners', value: stats.cleaners, icon: Briefcase, gradient: 'from-violet-500 to-purple-600', description: 'Field staff' },
          { label: 'Avg Rate', value: `$${stats.avgRate}/hr`, icon: DollarSign, gradient: 'from-amber-500 to-orange-500', description: 'Hourly average' },
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

      {/* Staff List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {activeStaff.length === 0 && inactiveStaff.length === 0 ? (
            <div className="p-12 sm:p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl mx-auto mb-5 flex items-center justify-center">
                <Users className="h-10 w-10 text-sky-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No staff members yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                Add your first team member to start scheduling jobs and managing availability.
              </p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/25"
              >
                <UserPlus className="h-4 w-4" />
                Add Your First Staff Member
              </button>
            </div>
          ) : (
            <>
              {activeStaff.map((member) => {
                const initials = `${member.user.firstName?.[0] || ''}${member.user.lastName?.[0] || ''}`
                const avatarColor = getAvatarColor(initials)
                const roleBadge = ROLE_BADGES[member.staff.role] || ROLE_BADGES.cleaner

                return (
                  <div key={member.staff.id} className="hover:bg-slate-50 transition-colors">
                    <div 
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedStaff(expandedStaff === member.staff.id ? null : member.staff.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-extrabold text-lg shadow-md`}>
                            {initials || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-slate-900">
                                {member.user.firstName} {member.user.lastName}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${roleBadge.bg} ${roleBadge.text}`}>
                                {member.staff.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center text-sm text-slate-500">
                                <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                {member.user.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="hidden sm:flex items-center gap-4 text-right">
                            <div>
                              <p className="text-xs text-slate-400 uppercase tracking-wider">Schedule</p>
                              <p className="text-sm font-bold text-slate-700">{getAvailabilitySummary(member.staff.availability)}</p>
                            </div>
                            {member.staff.hourlyRate && (
                              <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-sm">
                                ${member.staff.hourlyRate}/hr
                              </div>
                            )}
                          </div>
                          <div className={`p-2 transition-colors ${expandedStaff === member.staff.id ? 'bg-slate-200' : 'bg-slate-100'}`}>
                            {expandedStaff === member.staff.id ? (
                              <ChevronUp className="h-5 w-5 text-slate-600" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedStaff === member.staff.id && (
                      <div className="border-t border-slate-100 px-5 py-5 bg-slate-50">
                        <div className="grid sm:grid-cols-2 gap-4 mb-5">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-4 w-4 text-slate-400" />
                            {member.user.email}
                          </div>
                          {member.user.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="h-4 w-4 text-slate-400" />
                              {member.user.phone}
                            </div>
                          )}
                        </div>

                        {member.staff.availability && Object.keys(member.staff.availability).length > 0 && (
                          <div className="mb-5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Weekly Schedule
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {DAYS_OF_WEEK.map(day => {
                                const dayAvail = member.staff.availability?.[day]
                                return (
                                  <div 
                                    key={day} 
                                    className={`text-xs px-3 py-2 ${
                                      dayAvail ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    <div className="font-bold">{DAY_LABELS[day]}</div>
                                    {dayAvail && (
                                      <div className="text-[10px] mt-0.5">{dayAvail.start}-{dayAvail.end}</div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(member) }}
                            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="h-4 w-4 mr-1.5" />
                            Edit
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openAvailabilityModal(member) }}
                            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                          >
                            <Clock className="h-4 w-4 mr-1.5" />
                            Schedule
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteStaff(member) }}
                            className="inline-flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Deactivate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {inactiveStaff.length > 0 && (
                <div className="p-5 bg-slate-50">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Inactive Staff ({inactiveStaff.length})</h3>
                  <div className="space-y-2">
                    {inactiveStaff.map((member) => (
                      <div key={member.staff.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 opacity-60">
                        <div className="w-10 h-10 bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                          {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{member.user.firstName} {member.user.lastName}</p>
                          <p className="text-sm text-slate-500">{member.user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-500/20 rounded-xl">
            <Lightbulb className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Staff Management Tips</h3>
            <p className="text-slate-400 text-sm mb-4">
              Optimize scheduling and team productivity with these best practices.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-sky-400" />
                <span><strong>Set availability:</strong> Click on a staff member to configure their weekly working hours</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-sky-400" />
                <span><strong>Track labor costs:</strong> Set hourly rates to calculate job profitability</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-sky-400" />
                <span><strong>Auto-scheduling:</strong> The system uses availability to prevent overbooking</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-sky-400" />
                <span><strong>Skills matching:</strong> Add skills to help assign the right staff to each job</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Add Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.firstName}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.lastName}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newStaffForm.password}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                <input
                  type="tel"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Role</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="cleaner">Cleaner</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hourly Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStaffForm.hourlyRate}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, hourlyRate: e.target.value })}
                    placeholder="$0.00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Edit Staff Member</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateStaff} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="cleaner">Cleaner</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hourly Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.hourlyRate}
                    onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-3 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAvailabilityModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Set Availability</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedStaff.user.firstName} {selectedStaff.user.lastName}</p>
              </div>
              <button onClick={() => setShowAvailabilityModal(false)} className="p-2 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateAvailability} className="p-6 space-y-4">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className={`flex items-center gap-4 p-3 ${availabilityForm[day]?.enabled ? 'bg-teal-50' : 'bg-slate-50'} transition-colors`}>
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={availabilityForm[day]?.enabled || false}
                      onChange={(e) => setAvailabilityForm({
                        ...availabilityForm,
                        [day]: { ...availabilityForm[day], enabled: e.target.checked }
                      })}
                      className="w-5 h-5 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-bold text-slate-900 w-24 capitalize">{day}</span>
                  </label>
                  {availabilityForm[day]?.enabled && (
                    <div className="flex items-center gap-2">
                      <select
                        value={availabilityForm[day]?.start || '09:00'}
                        onChange={(e) => setAvailabilityForm({
                          ...availabilityForm,
                          [day]: { ...availabilityForm[day], start: e.target.value }
                        })}
                        className="px-3 py-2 bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-slate-400">to</span>
                      <select
                        value={availabilityForm[day]?.end || '17:00'}
                        onChange={(e) => setAvailabilityForm({
                          ...availabilityForm,
                          [day]: { ...availabilityForm[day], end: e.target.value }
                        })}
                        className="px-3 py-2 bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAvailabilityModal(false)}
                  className="px-5 py-3 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
