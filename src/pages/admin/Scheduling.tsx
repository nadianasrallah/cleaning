import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { Calendar, Clock, ChevronLeft, ChevronRight, User, Save, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '../../lib/api'

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface StaffMember {
  id: number
  name: string
  email?: string
  phone?: string
  role: string
  skills: string[]
  availability: Record<string, { start: string; end: string }> | null
  isActive: boolean
}

interface StaffAvailability {
  staffId: number
  staffName: string
  date: string
  dayAvailability?: { start: string; end: string }
  slots: TimeSlot[]
}

interface AvailableSlot {
  time: string
  available: boolean
  staffCount: number
}

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
]

export default function Scheduling() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availability, setAvailability] = useState<StaffAvailability[]>([])
  const [timeSlots, setTimeSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingAvailability, setEditingAvailability] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({})

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability()
      fetchTimeSlots()
    }
  }, [selectedDate])

  useEffect(() => {
    if (selectedStaff) {
      const newEditing: Record<string, { start: string; end: string; enabled: boolean }> = {}
      DAYS_OF_WEEK.forEach(day => {
        const dayAvail = selectedStaff.availability?.[day]
        newEditing[day] = {
          start: dayAvail?.start || '09:00',
          end: dayAvail?.end || '17:00',
          enabled: !!dayAvail
        }
      })
      setEditingAvailability(newEditing)
    }
  }, [selectedStaff])

  async function fetchStaff() {
    try {
      const data = await apiRequest('/api/scheduling/staff')
      setStaffMembers(data.staff || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
      toast.error('Failed to load staff')
      setLoading(false)
    }
  }

  async function fetchAvailability() {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const data = await apiRequest(`/api/scheduling/availability?date=${dateStr}`)
      setAvailability(data.availability || [])
    } catch (error) {
      console.error('Failed to fetch availability:', error)
    }
  }

  async function fetchTimeSlots() {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const data = await apiRequest(`/api/scheduling/time-slots?date=${dateStr}`)
      setTimeSlots(data.slots || [])
    } catch (error) {
      console.error('Failed to fetch time slots:', error)
    }
  }

  async function saveAvailability() {
    if (!selectedStaff) return

    setSaving(true)
    try {
      const availabilityToSave: Record<string, { start: string; end: string }> = {}
      Object.entries(editingAvailability).forEach(([day, config]) => {
        if (config.enabled) {
          availabilityToSave[day] = {
            start: config.start,
            end: config.end
          }
        }
      })

      await apiRequest(`/api/scheduling/staff/${selectedStaff.id}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ availability: availabilityToSave })
      })

      toast.success('Availability saved')
      fetchStaff()
      fetchAvailability()
    } catch (error) {
      console.error('Failed to save availability:', error)
      toast.error('Failed to save availability')
    }
    setSaving(false)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-indigo-600 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative flex items-start gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Staff Scheduling</h1>
            <p className="text-white/80 mt-1 text-sm sm:text-base">
              Manage staff availability and view booking slots • {staffMembers.length} team members
            </p>
          </div>
        </div>
      </div>

      {/* Pro Tips Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="relative flex items-start gap-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">Pro Tips</h3>
            <p className="text-slate-300 text-sm">
              Select a staff member to set their working hours. Accurate availability prevents double-booking and ensures customers only see truly available times.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weekly Calendar
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWeekStart(subWeeks(weekStart, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>
                <span className="font-bold text-slate-900">
                  {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                </span>
                <button
                  onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`p-3 text-center transition-all rounded-xl ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg'
                        : isToday
                        ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">{DAY_LABELS[i]}</div>
                    <div className="text-lg font-extrabold mt-1">{format(day, 'd')}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Slots for {format(selectedDate, 'EEEE, MMMM d')}
            </h2>

            {timeSlots.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <Clock className="h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-slate-500 font-medium">No availability data for this date</p>
                <p className="text-slate-400 text-sm mt-1">Set up staff schedules to see available slots</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.map((slot, i) => (
                  <div
                    key={i}
                    className={`p-2 text-center text-sm rounded-lg ${
                      slot.available
                        ? 'bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">{slot.time}</div>
                    {slot.available && (
                      <div className="text-xs">{slot.staffCount} staff</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User className="h-4 w-4" />
              Staff Availability
            </h2>

            <div className="space-y-4">
              {availability.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No staff configured</p>
              ) : (
                availability.map((staffAvail) => (
                  <div key={staffAvail.staffId} className="border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-teal-600" />
                        </div>
                        <span className="font-bold text-slate-900">{staffAvail.staffName}</span>
                      </div>
                      {staffAvail.dayAvailability ? (
                        <span className="text-sm font-bold text-teal-600">
                          {staffAvail.dayAvailability.start} - {staffAvail.dayAvailability.end}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Not available</span>
                      )}
                    </div>

                    {staffAvail.slots.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {staffAvail.slots.slice(0, 12).map((slot, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 text-xs font-bold ${
                              slot.available
                                ? 'bg-teal-50 text-teal-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {format(new Date(slot.start), 'h:mm a')}
                          </span>
                        ))}
                        {staffAvail.slots.length > 12 && (
                          <span className="text-xs text-slate-400 px-2 py-1">
                            +{staffAvail.slots.length - 12} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white shadow-sm p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Staff Members</h2>

            <div className="space-y-2">
              {staffMembers.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No staff members found</p>
              ) : (
                staffMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedStaff(member)}
                    className={`w-full p-4 text-left transition-colors ${
                      selectedStaff?.id === member.id
                        ? 'bg-teal-50 border-l-4 border-teal-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-sm text-slate-500">{member.role || 'Staff'}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedStaff && (
            <div className="bg-white shadow-sm border-t-4 border-teal-600 p-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-6">
                Edit Availability: {selectedStaff.name}
              </h2>

              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-bold text-slate-900 capitalize">{day}</label>
                      <button
                        onClick={() => {
                          setEditingAvailability(prev => ({
                            ...prev,
                            [day]: { ...prev[day], enabled: !prev[day].enabled }
                          }))
                        }}
                        className={`w-12 h-7 transition-colors ${
                          editingAvailability[day]?.enabled
                            ? 'bg-teal-600'
                            : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white shadow transform transition-transform ${
                            editingAvailability[day]?.enabled
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {editingAvailability[day]?.enabled && (
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={editingAvailability[day]?.start || '09:00'}
                          onChange={(e) => {
                            setEditingAvailability(prev => ({
                              ...prev,
                              [day]: { ...prev[day], start: e.target.value }
                            }))
                          }}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-slate-400">to</span>
                        <select
                          value={editingAvailability[day]?.end || '17:00'}
                          onChange={(e) => {
                            setEditingAvailability(prev => ({
                              ...prev,
                              [day]: { ...prev[day], end: e.target.value }
                            }))
                          }}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={saveAvailability}
                disabled={saving}
                className="w-full mt-6 inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
