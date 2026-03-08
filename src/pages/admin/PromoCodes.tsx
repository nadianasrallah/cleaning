import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Tag, Plus, Search, Calendar, Percent, DollarSign, Copy, Trash2, Edit2, Check, X, Lightbulb, Users } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface PromoCode {
  id: number
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount: number | null
  maxUses: number | null
  usedCount: number
  validFrom: string | null
  validUntil: string | null
  isActive: boolean
  createdAt: string
}

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderAmount: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    isActive: true
  })

  useEffect(() => {
    loadPromoCodes()
  }, [])

  async function loadPromoCodes() {
    try {
      const data = await api.get<{ promoCodes: PromoCode[] }>('/promo-codes')
      setPromoCodes(data.promoCodes || [])
    } catch (error) {
      console.error('Failed to load promo codes:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null
      }

      if (editingId) {
        await api.put(`/promo-codes/${editingId}`, payload)
        toast.success('Promo code updated')
      } else {
        await api.post('/promo-codes', payload)
        toast.success('Promo code created')
      }

      resetForm()
      loadPromoCodes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save promo code')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: number, isActive: boolean) {
    try {
      await api.put(`/promo-codes/${id}`, { isActive: !isActive })
      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, isActive: !isActive } : p))
      toast.success(isActive ? 'Promo code deactivated' : 'Promo code activated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update promo code')
    }
  }

  async function deletePromoCode(id: number) {
    if (!confirm('Are you sure you want to delete this promo code?')) return

    try {
      await api.delete(`/promo-codes/${id}`)
      setPromoCodes(prev => prev.filter(p => p.id !== id))
      toast.success('Promo code deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete promo code')
    }
  }

  function startEdit(promo: PromoCode) {
    setEditingId(promo.id)
    setFormData({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderAmount: promo.minOrderAmount?.toString() || '',
      maxUses: promo.maxUses?.toString() || '',
      validFrom: promo.validFrom?.split('T')[0] || '',
      validUntil: promo.validUntil?.split('T')[0] || '',
      isActive: promo.isActive
    })
    setShowForm(true)
  }

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: '',
      maxUses: '',
      validFrom: '',
      validUntil: '',
      isActive: true
    })
  }

  const filteredCodes = promoCodes.filter(p => 
    p.code.toLowerCase().includes(search.toLowerCase())
  )

  const activeCodesCount = promoCodes.filter(p => p.isActive).length
  const totalUsage = promoCodes.reduce((sum, p) => sum + p.usedCount, 0)

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
              <Tag className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Promo Codes</h1>
              <p className="text-white/80 mt-1 text-sm sm:text-base">
                Manage discounts and special offers • {promoCodes.length} total codes
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-teal-600 font-bold text-xs uppercase tracking-widest hover:bg-teal-50 transition-colors rounded-lg shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Code
          </button>
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
              Create limited-time offers with expiration dates to drive urgency. Use unique codes for different marketing channels to track performance.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl">
              <Tag className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Codes</p>
              <p className="text-2xl font-extrabold text-slate-900">{activeCodesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-xl">
              <Users className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Usage</p>
              <p className="text-2xl font-extrabold text-slate-900">{totalUsage}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl">
              <Percent className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Codes</p>
              <p className="text-2xl font-extrabold text-slate-900">{promoCodes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50">
            <h2 className="text-lg font-extrabold text-slate-900">
              {editingId ? 'Edit Promo Code' : 'Create New Promo Code'}
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER2025"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Discount Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      formData.discountType === 'percentage'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Percent className="h-4 w-4" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      formData.discountType === 'fixed'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    Fixed Amount
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Discount Value {formData.discountType === 'percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Minimum Order Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  placeholder="Optional"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="Unlimited"
                  min="1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Valid From
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                  <span className="ms-3 text-sm font-bold text-slate-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold text-xs uppercase tracking-widest hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 transition-all rounded-lg shadow-lg"
              >
                {saving ? 'Saving...' : editingId ? 'Update Code' : 'Create Code'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60">
        <div className="p-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search promo codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredCodes.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center">
              <Tag className="h-8 w-8 text-teal-400" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">No promo codes yet</h3>
            <p className="text-slate-500 mb-6">Create your first promo code to offer discounts to customers</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold text-xs uppercase tracking-widest hover:from-teal-600 hover:to-cyan-700 transition-all rounded-lg shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Code
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCodes.map((promo) => (
              <div key={promo.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${promo.isActive ? 'bg-gradient-to-br from-teal-100 to-cyan-100' : 'bg-slate-100'}`}>
                      <Tag className={`h-6 w-6 ${promo.isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold text-slate-900 font-mono">{promo.code}</span>
                        <button
                          onClick={() => copyCode(promo.code)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Copy code"
                        >
                          <Copy className="h-4 w-4 text-slate-400" />
                        </button>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          promo.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          {promo.discountType === 'percentage' ? (
                            <><Percent className="h-4 w-4" /> {promo.discountValue}% off</>
                          ) : (
                            <><DollarSign className="h-4 w-4" /> ${promo.discountValue} off</>
                          )}
                        </span>
                        {promo.maxUses && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {promo.usedCount}/{promo.maxUses} used
                          </span>
                        )}
                        {promo.validUntil && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Expires {format(new Date(promo.validUntil), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(promo.id, promo.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        promo.isActive 
                          ? 'hover:bg-amber-100 text-amber-600' 
                          : 'hover:bg-green-100 text-green-600'
                      }`}
                      title={promo.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {promo.isActive ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => startEdit(promo)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                      title="Edit"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deletePromoCode(promo.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
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
