import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  FileText, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Invoice {
  id: number
  invoiceNumber: string
  amount: string
  totalAmount: string
  status: string
  dueDate: string
  paidAt: string | null
  createdAt: string
  serviceName: string
}

export default function ClientInvoices() {
  const [searchParams] = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [payingInvoice, setPayingInvoice] = useState<number | null>(null)

  useEffect(() => {
    loadInvoices()
    
    const paidId = searchParams.get('paid')
    if (paidId) {
      toast.success('Payment successful! Your invoice has been paid.')
    }
  }, [searchParams])

  async function loadInvoices() {
    try {
      const res = await api.get('/client/invoices')
      setInvoices(res.invoices || [])
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePayNow(invoiceId: number) {
    setPayingInvoice(invoiceId)
    try {
      const res = await api.post('/stripe/create-invoice-payment', { invoiceId })
      if (res.url) {
        window.location.href = res.url
      } else {
        toast.error('Failed to initiate payment')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment')
      setPayingInvoice(null)
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      paid: 'bg-teal-50 text-teal-700',
      pending: 'bg-amber-50 text-amber-700',
      overdue: 'bg-red-50 text-red-700',
    }
    return styles[status] || 'bg-slate-100 text-slate-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Invoices</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">View and pay your invoices</p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white shadow-sm p-16 text-center">
          <div className="h-16 w-16 bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No invoices yet</h3>
          <p className="text-slate-500">Your invoices will appear here after your first booking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-14 w-14 flex items-center justify-center flex-shrink-0 ${
                    invoice.status === 'paid' ? 'bg-teal-100' : 'bg-slate-100'
                  }`}>
                    {invoice.status === 'paid' ? (
                      <CheckCircle className="h-7 w-7 text-teal-600" />
                    ) : invoice.status === 'overdue' ? (
                      <AlertCircle className="h-7 w-7 text-red-500" />
                    ) : (
                      <FileText className="h-7 w-7 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">{invoice.invoiceNumber}</h3>
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{invoice.serviceName}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
                      <span>Issued: {format(new Date(invoice.createdAt), 'MMM d, yyyy')}</span>
                      {invoice.dueDate && (
                        <span>Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                      )}
                      {invoice.paidAt && (
                        <span className="text-teal-600">Paid: {format(new Date(invoice.paidAt), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-extrabold text-slate-900">
                    ${parseFloat(invoice.totalAmount || invoice.amount).toFixed(2)}
                  </span>
                  <button className="inline-flex items-center px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                    <button 
                      onClick={() => handlePayNow(invoice.id)}
                      disabled={payingInvoice === invoice.id}
                      className="inline-flex items-center px-6 py-2 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      {payingInvoice === invoice.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
