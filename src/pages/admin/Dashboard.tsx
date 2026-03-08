import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  MessageSquare, 
  ArrowRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  UserPlus,
  Sparkles,
  Target,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Star,
  ChevronRight,
  Bell
} from 'lucide-react'
import { format, subDays, startOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function Dashboard() {
  const { user, company, branding } = useAuth()
  const [stats, setStats] = useState({
    todayBookings: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    newLeads: 0,
    weeklyBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    conversionRate: 0,
  })
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [bookingsByDay, setBookingsByDay] = useState<any[]>([])
  const [serviceBreakdown, setServiceBreakdown] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const [bookingsRes, leadsRes, clientsRes, servicesRes] = await Promise.all([
        api.get<{ bookings: any[] }>('/bookings'),
        api.get<{ leads: any[] }>('/leads'),
        api.get<{ clients: any[] }>('/clients'),
        api.get<{ services: any[] }>('/services'),
      ])

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayBookings = bookingsRes.bookings.filter(b => {
        const date = new Date(b.booking.scheduledDate)
        return date >= today && date < tomorrow
      })

      const weekStart = startOfWeek(today)
      const weeklyBookings = bookingsRes.bookings.filter(b => {
        const date = new Date(b.booking.scheduledDate)
        return date >= weekStart && date <= today
      })

      const newLeads = leadsRes.leads.filter(l => l.status === 'new')
      const qualifiedLeads = leadsRes.leads.filter(l => l.status === 'qualified' || l.status === 'converted')
      const conversionRate = leadsRes.leads.length > 0 
        ? Math.round((qualifiedLeads.length / leadsRes.leads.length) * 100) 
        : 0

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const completedBookings = bookingsRes.bookings.filter(b => {
        const date = new Date(b.booking.scheduledDate)
        return date >= monthStart && b.booking.status === 'completed'
      })
      const pendingBookings = bookingsRes.bookings.filter(b => 
        b.booking.status === 'pending' || b.booking.status === 'confirmed'
      )
      const monthlyRevenue = completedBookings.reduce((sum, b) => 
        sum + parseFloat(b.booking.totalPrice || '0'), 0
      )

      setStats({
        todayBookings: todayBookings.length,
        totalClients: clientsRes.clients.length,
        monthlyRevenue,
        newLeads: newLeads.length,
        weeklyBookings: weeklyBookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookings.length,
        conversionRate,
      })

      setUpcomingBookings(
        bookingsRes.bookings
          .filter(b => {
            if (!b.booking?.scheduledDate) return false
            const date = new Date(b.booking.scheduledDate)
            return !isNaN(date.getTime()) && date >= today && b.booking.status !== 'cancelled'
          })
          .sort((a, b) => new Date(a.booking.scheduledDate).getTime() - new Date(b.booking.scheduledDate).getTime())
          .slice(0, 5)
      )

      setRecentLeads(leadsRes.leads.slice(0, 5))

      const last7Days = eachDayOfInterval({
        start: subDays(today, 6),
        end: today
      })

      const revenueByDay = last7Days.map(day => {
        const dayBookings = bookingsRes.bookings.filter(b => {
          const date = new Date(b.booking.scheduledDate)
          return isSameDay(date, day) && b.booking.status === 'completed'
        })
        const revenue = dayBookings.reduce((sum, b) => sum + parseFloat(b.booking.totalPrice || '0'), 0)
        return {
          name: format(day, 'EEE'),
          revenue: revenue,
          bookings: dayBookings.length
        }
      })
      setRevenueData(revenueByDay)

      const bookingsByDayData = last7Days.map(day => {
        const count = bookingsRes.bookings.filter(b => {
          const date = new Date(b.booking.scheduledDate)
          return isSameDay(date, day)
        }).length
        return {
          name: format(day, 'EEE'),
          count,
          isToday: isToday(day)
        }
      })
      setBookingsByDay(bookingsByDayData)

      const serviceMap = new Map()
      bookingsRes.bookings.forEach(b => {
        const serviceName = b.service?.name || 'Other'
        serviceMap.set(serviceName, (serviceMap.get(serviceName) || 0) + 1)
      })
      const serviceData = Array.from(serviceMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, 5)
      setServiceBreakdown(serviceData)

      const activities: any[] = []
      bookingsRes.bookings.slice(0, 3).forEach(b => {
        if (b.booking?.createdAt) {
          activities.push({
            id: `booking-${b.booking.id}`,
            type: 'booking',
            title: `New booking from ${b.clientUser?.firstName || 'Client'}`,
            subtitle: b.service?.name,
            time: b.booking.createdAt,
            icon: Calendar,
            color: 'from-sky-400 to-sky-600',
            bgColor: 'bg-sky-50'
          })
        }
      })
      leadsRes.leads.slice(0, 2).forEach(l => {
        if (l.createdAt) {
          activities.push({
            id: `lead-${l.id}`,
            type: 'lead',
            title: `New lead: ${l.firstName} ${l.lastName}`,
            subtitle: l.source,
            time: l.createdAt,
            icon: UserPlus,
            color: 'from-amber-400 to-amber-600',
            bgColor: 'bg-amber-50'
          })
        }
      })
      clientsRes.clients.slice(0, 2).forEach((c, index) => {
        if (c.user?.createdAt && c.client?.id) {
          activities.push({
            id: `client-${c.client.id}`,
            type: 'client',
            title: `Client registered: ${c.user?.firstName} ${c.user?.lastName}`,
            subtitle: c.user?.email,
            time: c.user?.createdAt,
            icon: Users,
            color: 'from-teal-400 to-teal-600',
            bgColor: 'bg-teal-50'
          })
        }
      })
      const validActivities = activities.filter(a => a.time && !isNaN(new Date(a.time).getTime()))
      validActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivity(validActivities.slice(0, 6))

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const CHART_COLORS = ['#0d9488', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899']

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' }
    if (hour < 17) return { text: 'Good afternoon', emoji: '🌤️' }
    return { text: 'Good evening', emoji: '🌙' }
  }

  const greeting = getGreeting()

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-teal-100 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-teal-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-sky-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium animate-pulse">Loading your dashboard...</p>
          <p className="text-sm text-slate-400 mt-1">Gathering your latest data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-200/30 to-sky-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-elevated-lg animate-fade-in">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-sky-500/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{greeting.emoji}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {greeting.text}, {user?.firstName || 'there'}!
              </h1>
            </div>
            <p className="text-slate-300 text-lg max-w-xl">
              Welcome back to <span className="text-teal-400 font-semibold">{company?.name || 'your dashboard'}</span>. 
              Here's an overview of your business performance today.
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Updated {format(new Date(), 'h:mm a')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/admin/bookings/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4" />
              New Booking
            </Link>
            <Link 
              to="/admin/reports"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all backdrop-blur-sm border border-white/10"
            >
              <BarChart3 className="w-4 h-4" />
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            label: "Today's Bookings", 
            value: stats.todayBookings, 
            icon: Calendar, 
            gradient: 'from-sky-500 to-blue-600',
            lightBg: 'bg-sky-50',
            trend: stats.todayBookings > 0 ? `+${stats.todayBookings}` : '0',
            trendUp: stats.todayBookings > 0,
            description: 'Scheduled for today'
          },
          { 
            label: 'Total Clients', 
            value: stats.totalClients, 
            icon: Users, 
            gradient: 'from-teal-500 to-emerald-600',
            lightBg: 'bg-teal-50',
            trend: '+12%',
            trendUp: true,
            description: 'Active customers'
          },
          { 
            label: 'Monthly Revenue', 
            value: `$${stats.monthlyRevenue.toLocaleString()}`, 
            icon: DollarSign, 
            gradient: 'from-emerald-500 to-green-600',
            lightBg: 'bg-emerald-50',
            trend: '+8.2%',
            trendUp: true,
            description: 'Completed this month'
          },
          { 
            label: 'New Leads', 
            value: stats.newLeads, 
            icon: Target, 
            gradient: 'from-amber-500 to-orange-600',
            lightBg: 'bg-amber-50',
            trend: stats.newLeads > 0 ? `+${stats.newLeads}` : '0',
            trendUp: stats.newLeads > 0,
            description: 'Awaiting follow-up'
          },
        ].map((stat, index) => (
          <div 
            key={stat.label} 
            className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-elevated transition-all duration-300 overflow-hidden opacity-0 animate-fade-in-up border border-slate-100"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            {/* Decorative gradient orb */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500`}></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.trend}
                </div>
              </div>
              
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-extrabold text-slate-900 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1 bg-slate-100/50 rounded-2xl">
        {[
          { label: 'Weekly Bookings', value: stats.weeklyBookings, icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-100' },
          { label: 'Completed', value: stats.completedBookings, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Pending', value: stats.pendingBookings, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-100' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className={`p-2.5 ${stat.bg} rounded-lg`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Revenue Overview</h2>
                <p className="text-sm text-slate-500 mt-0.5">Track your earnings over the last 7 days</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-lg">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"></div>
                  <span className="text-xs font-semibold text-teal-700">Revenue</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.4}/>
                      <stop offset="50%" stopColor="#0d9488" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#14b8a6"/>
                      <stop offset="100%" stopColor="#0ea5e9"/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: 'none', 
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      borderRadius: '12px',
                      padding: '12px 16px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="url(#strokeGradient)" 
                    strokeWidth={3}
                    fill="url(#revenueGradient)" 
                    dot={{ fill: '#0d9488', strokeWidth: 2, stroke: 'white', r: 4 }}
                    activeDot={{ fill: '#0d9488', strokeWidth: 3, stroke: 'white', r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Popular Services</h2>
                <p className="text-sm text-slate-500 mt-0.5">Most booked services</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <PieChartIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-44 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {CHART_COLORS.map((color, index) => (
                      <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={serviceBreakdown.length > 0 ? serviceBreakdown : [{ name: 'No data', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {(serviceBreakdown.length > 0 ? serviceBreakdown : [{ name: 'No data', value: 1 }]).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % CHART_COLORS.length})`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: 'none', 
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      borderRadius: '12px',
                      padding: '8px 12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {serviceBreakdown.slice(0, 4).map((service, index) => (
                <div key={service.name} className="flex items-center gap-3 group">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  ></div>
                  <span className="flex-1 text-sm text-slate-600 truncate group-hover:text-slate-900 transition-colors">{service.name}</span>
                  <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{service.value}</span>
                </div>
              ))}
              {serviceBreakdown.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No service data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity & Bookings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Weekly Activity</h2>
                <p className="text-sm text-slate-500 mt-0.5">Bookings per day this week</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsByDay} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9"/>
                      <stop offset="100%" stopColor="#0284c7"/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'white', 
                      border: 'none', 
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      borderRadius: '12px'
                    }}
                    formatter={(value: number) => [value, 'Bookings']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Recent Activity</h2>
                <p className="text-sm text-slate-500 mt-0.5">Latest updates from your business</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">Live</span>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-900 font-semibold">No recent activity</p>
                <p className="text-sm text-slate-500 mt-1">Activities will appear here as they happen</p>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="p-4 hover:bg-slate-50/50 transition-all flex items-start gap-4 group"
                >
                  {/* Timeline indicator */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activity.color} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <activity.icon className="h-5 w-5 text-white" />
                    </div>
                    {index < recentActivity.length - 1 && (
                      <div className="absolute top-12 left-1/2 w-0.5 h-6 bg-gradient-to-b from-slate-200 to-transparent -translate-x-1/2"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="font-semibold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">{activity.title}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{activity.subtitle}</p>
                  </div>
                  <div className="text-right pt-1">
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      {activity.time ? format(new Date(activity.time), 'MMM d') : 'Just now'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming & Leads Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Upcoming Bookings</h2>
                <p className="text-sm text-slate-500 mt-0.5">Next scheduled cleanings</p>
              </div>
              <Link 
                to="/admin/bookings" 
                className="flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors group"
              >
                View all 
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-teal-500" />
                </div>
                <p className="text-slate-900 font-semibold">No upcoming bookings</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Create your first booking to get started</p>
                <Link 
                  to="/admin/bookings/new" 
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/25"
                >
                  <Calendar className="h-4 w-4" />
                  New Booking
                </Link>
              </div>
            ) : (
              upcomingBookings.map((booking, index) => (
                <Link 
                  key={booking.booking.id} 
                  to={`/admin/bookings/${booking.booking.id}`}
                  className="p-4 hover:bg-slate-50/50 transition-all flex items-center gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-500 uppercase leading-none">
                      {booking.booking.scheduledDate ? format(new Date(booking.booking.scheduledDate), 'MMM') : ''}
                    </span>
                    <span className="text-lg font-extrabold text-slate-700 leading-none">
                      {booking.booking.scheduledDate ? format(new Date(booking.booking.scheduledDate), 'd') : '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {booking.clientUser?.firstName} {booking.clientUser?.lastName}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{booking.service?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-700">
                      {booking.booking.scheduledDate ? format(new Date(booking.booking.scheduledDate), 'h:mm a') : ''}
                    </p>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md ${
                      booking.booking.status === 'confirmed' 
                        ? 'bg-teal-100 text-teal-700'
                        : booking.booking.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {booking.booking.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Recent Leads</h2>
                <p className="text-sm text-slate-500 mt-0.5">New potential customers to follow up</p>
              </div>
              <Link 
                to="/admin/leads" 
                className="flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors group"
              >
                View all 
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLeads.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-amber-500" />
                </div>
                <p className="text-slate-900 font-semibold">No leads yet</p>
                <p className="text-sm text-slate-500 mt-1">Leads will appear here when customers show interest</p>
              </div>
            ) : (
              recentLeads.map((lead, index) => (
                <div key={lead.id} className="p-4 hover:bg-slate-50/50 transition-all flex items-center gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-bold text-white text-sm uppercase shadow-lg shadow-amber-500/25">
                    {lead.firstName?.[0]}{lead.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{lead.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{lead.source}</p>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md ${
                      lead.status === 'new' 
                        ? 'bg-sky-100 text-sky-700'
                        : lead.status === 'qualified'
                        ? 'bg-teal-100 text-teal-700'
                        : lead.status === 'converted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/admin/bookings/new', icon: Calendar, label: 'New Booking', desc: 'Schedule a cleaning', gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/25' },
          { to: '/admin/clients/new', icon: UserPlus, label: 'Add Client', desc: 'Register new customer', gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/25' },
          { to: '/admin/messages', icon: MessageSquare, label: 'Messages', desc: 'View conversations', gradient: 'from-slate-700 to-slate-900', shadow: 'shadow-slate-700/25' },
          { to: '/admin/reports', icon: BarChart3, label: 'Reports', desc: 'View analytics', gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/25' },
        ].map((action, index) => (
          <Link 
            key={action.to}
            to={action.to} 
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.gradient} text-white p-6 transition-all shadow-lg ${action.shadow} hover:shadow-xl hover:-translate-y-1 opacity-0 animate-fade-in-up`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            <div className="relative flex items-start justify-between">
              <div>
                <div className="p-2.5 bg-white/20 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold uppercase tracking-wider text-sm">{action.label}</h3>
                <p className="text-xs text-white/70 mt-1">{action.desc}</p>
              </div>
              <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
