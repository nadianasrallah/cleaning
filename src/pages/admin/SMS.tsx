import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Send,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  Lightbulb
} from 'lucide-react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface SMSLog {
  id: number
  recipientPhone: string
  messageType: string
  content: string
  status: string
  sentAt: string | null
  createdAt: string
  errorMessage: string | null
}

interface SMSStatus {
  configured: boolean
  message: string
}

export default function SMS() {
  const [logs, setLogs] = useState<SMSLog[]>([])
  const [status, setStatus] = useState<SMSStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSendForm, setShowSendForm] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    message: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [logsRes, statusRes] = await Promise.all([
        api.get('/sms/logs'),
        api.get('/sms/status')
      ])
      setLogs(logsRes.logs || [])
      setStatus(statusRes)
    } catch (error) {
      console.error('Failed to load SMS data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendBulkReminders() {
    setSending(true)
    try {
      const res = await api.post('/sms/send-bulk-reminders', {})
      toast.success(res.message || 'Reminders sent')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reminders')
    } finally {
      setSending(false)
    }
  }

  async function handleSendCustom() {
    if (!formData.phone || !formData.message) {
      toast.error('Phone and message are required')
      return
    }
    
    setSending(true)
    try {
      await api.post('/sms/send', {
        recipientPhone: formData.phone,
        content: formData.message,
        messageType: 'custom'
      })
      toast.success('SMS sent successfully')
      setFormData({ phone: '', message: '' })
      setShowSendForm(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send SMS')
    } finally {
      setSending(false)
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-teal-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'mock':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      default:
        return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      sent: 'bg-teal-50 text-teal-700',
      failed: 'bg-red-50 text-red-700',
      mock: 'bg-amber-50 text-amber-700',
      pending: 'bg-slate-100 text-slate-600',
    }
    return styles[status] || 'bg-slate-100 text-slate-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">SMS Notifications</h1>
              <p className="text-white/80 mt-1 text-sm sm:text-base">
                Send SMS notifications and view message history • {logs.length} messages
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setShowSendForm(!showSendForm)}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-bold text-xs uppercase tracking-widest hover:bg-white/30 transition-colors rounded-lg"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Custom
            </button>
            <button 
              onClick={handleSendBulkReminders} 
              disabled={sending}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-teal-600 font-bold text-xs uppercase tracking-widest hover:bg-teal-50 disabled:opacity-50 transition-colors rounded-lg shadow-lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Reminders
            </button>
          </div>
        </div>
      </div>

      {/* Pro Tips Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl"></div>
        <div className="relative flex items-start gap-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">Pro Tips</h3>
            <p className="text-slate-300 text-sm">
              Send appointment reminders 24 hours in advance to reduce no-shows. Use "Send Reminders" to notify all clients with upcoming appointments at once.
            </p>
          </div>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border-l-4 ${status.configured ? 'bg-teal-50 border-teal-500' : 'bg-amber-50 border-amber-500'}`}>
          <div className="flex items-center gap-3">
            {status.configured ? (
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            <span className={`font-medium ${status.configured ? 'text-teal-800' : 'text-amber-800'}`}>
              {status.message}
            </span>
          </div>
        </div>
      )}

      {showSendForm && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50">
            <h2 className="text-lg font-extrabold text-slate-900">Send Custom SMS</h2>
            <button onClick={() => setShowSendForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your message here..."
                rows={3}
                maxLength={1600}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">{formData.message.length}/1600 characters</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleSendCustom} 
                disabled={sending}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold text-xs uppercase tracking-widest hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 transition-all rounded-lg shadow-lg"
              >
                {sending ? 'Sending...' : 'Send SMS'}
              </button>
              <button 
                onClick={() => setShowSendForm(false)}
                className="px-6 py-3 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Message History</h2>
          <button 
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        
        {logs.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No messages sent yet</h3>
            <p className="text-slate-500">Your SMS history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getStatusIcon(log.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center text-sm text-slate-500">
                          <Phone className="h-4 w-4 mr-1.5 text-slate-400" />
                          <span className="font-bold text-slate-900">{log.recipientPhone}</span>
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusBadge(log.status)}`}>
                          {log.status}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {log.messageType}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{log.content}</p>
                      {log.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">Error: {log.errorMessage}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {log.sentAt 
                          ? `Sent: ${format(new Date(log.sentAt), 'MMM d, yyyy h:mm a')}`
                          : `Created: ${format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
