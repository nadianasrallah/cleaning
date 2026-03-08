import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import PageGuide from '@/components/ui/PageGuide'
import { 
  TrendingUp, DollarSign, Calendar, Users, 
  CheckCircle, Clock, BarChart3, PieChart,
  ArrowUp, ArrowDown
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns'

interface ReportData {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    change: number
  }
  bookings: {
    total: number
    completed: number
    pending: number
    cancelled: number
    thisMonth: number
  }
  clients: {
    total: number
    active: number
    new: number
  }
  topServices: Array<{
    name: string
    count: number
    revenue: number
  }>
  dailyRevenue: Array<{
    date: string
    amount: number
  }>
  staffPerformance: Array<{
    name: string
    completed: number
    revenue: number
  }>
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    loadReportData()
  }, [period])

  async function loadReportData() {
    try {
      const res = await api.get<{ report: ReportData }>(`/reports/summary?period=${period}`)
      setData(res.report)
    } catch (error) {
      console.error('Failed to load report data:', error)
      setData({
        revenue: { total: 0, thisMonth: 0, lastMonth: 0, change: 0 },
        bookings: { total: 0, completed: 0, pending: 0, cancelled: 0, thisMonth: 0 },
        clients: { total: 0, active: 0, new: 0 },
        topServices: [],
        dailyRevenue: [],
        staffPerformance: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600"></div>
      </div>
    )
  }

  const revenueChange = data?.revenue.change || 0

  return (
    <div className="space-y-8">
      <PageGuide
        title="Business Analytics"
        description="Track revenue, bookings, and staff performance. Use insights to make data-driven decisions for your cleaning business."
        quickStart="Switch between week, month, and year views to analyze trends. Revenue shows completed bookings only."
        tips={[
          { title: "Revenue Tracking", description: "Monitor your income trends. Compare this month to last month to see if you're growing." },
          { title: "Top Services", description: "See which cleaning services generate the most revenue. Focus marketing on your best sellers." },
          { title: "Staff Performance", description: "Track completed jobs per staff member. Reward top performers and identify training needs." },
          { title: "Client Retention", description: "Active clients and new client counts help you understand customer acquisition and loyalty." }
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Track your business performance</p>
        </div>
        <div className="flex bg-slate-100 w-full sm:w-auto">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                period === p ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-sm p-6 border-t-4 border-teal-600">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-teal-600" />
            <span className={`flex items-center text-sm font-bold ${revenueChange >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
              {revenueChange >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
              {Math.abs(revenueChange).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Total Revenue</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            ${(data?.revenue.thisMonth || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-slate-500 mt-1">vs ${(data?.revenue.lastMonth || 0).toFixed(2)} last period</p>
        </div>

        <div className="bg-white shadow-sm p-6 border-t-4 border-sky-500">
          <Calendar className="h-8 w-8 text-sky-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Bookings</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{data?.bookings.thisMonth || 0}</p>
          <p className="text-sm text-slate-500 mt-1">{data?.bookings.total || 0} total all time</p>
        </div>

        <div className="bg-white shadow-sm p-6 border-t-4 border-violet-500">
          <CheckCircle className="h-8 w-8 text-violet-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Completed</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{data?.bookings.completed || 0}</p>
          <p className="text-sm text-slate-500 mt-1">{data?.bookings.pending || 0} pending</p>
        </div>

        <div className="bg-white shadow-sm p-6 border-t-4 border-amber-500">
          <Users className="h-8 w-8 text-amber-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Clients</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{data?.clients.total || 0}</p>
          <p className="text-sm text-slate-500 mt-1">{data?.clients.new || 0} new this period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-teal-600" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Trend</h2>
            </div>
          </div>
          <div className="p-6">
            {data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
              <div className="h-64 flex items-end justify-between gap-2">
                {data.dailyRevenue.slice(-14).map((day, idx) => {
                  const maxAmount = Math.max(...data.dailyRevenue.map(d => d.amount), 1)
                  const height = (day.amount / maxAmount) * 100
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-teal-500 hover:bg-teal-600 transition-colors rounded-t"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`$${day.amount.toFixed(2)}`}
                      />
                      <span className="text-[10px] text-slate-400 mt-2 rotate-45 origin-left">
                        {format(new Date(day.date), 'MM/dd')}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No revenue data for this period
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-teal-600" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Booking Status</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-teal-50 p-4 rounded">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Completed</p>
                <p className="text-2xl font-extrabold text-teal-700 mt-1">{data?.bookings.completed || 0}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Pending</p>
                <p className="text-2xl font-extrabold text-amber-700 mt-1">{data?.bookings.pending || 0}</p>
              </div>
              <div className="bg-sky-50 p-4 rounded">
                <p className="text-xs font-bold text-sky-600 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-extrabold text-sky-700 mt-1">{data?.bookings.total || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Cancelled</p>
                <p className="text-2xl font-extrabold text-red-700 mt-1">{data?.bookings.cancelled || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Services</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.topServices && data.topServices.length > 0 ? (
              data.topServices.map((service, idx) => (
                <div key={idx} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{service.name}</p>
                      <p className="text-sm text-slate-500">{service.count} bookings</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    ${service.revenue.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400">
                No service data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Staff Performance</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.staffPerformance && data.staffPerformance.length > 0 ? (
              data.staffPerformance.map((member, idx) => (
                <div key={idx} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-100 flex items-center justify-center text-sky-600 font-bold rounded-full">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.completed} jobs completed</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    ${member.revenue.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400">
                No staff data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
