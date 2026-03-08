import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Building2, Palette, Globe, Save, Check, AlertCircle, Settings as SettingsIcon, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

export default function Settings() {
  const { company, branding, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [domainStatus, setDomainStatus] = useState<'pending' | 'verified' | 'failed' | null>(null)

  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    timezone: 'America/New_York',
  })

  const [brandingData, setBrandingData] = useState({
    logoUrl: '',
    primaryColor: '#0d9488',
    secondaryColor: '#0284c7',
    accentColor: '#f59e0b',
    fontFamily: 'Manrope',
    customDomain: '',
    metaTitle: '',
    metaDescription: '',
  })

  useEffect(() => {
    if (company) {
      setCompanyData({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        timezone: 'America/New_York',
      })
    }
    if (branding) {
      setBrandingData({
        logoUrl: branding.logoUrl || '',
        primaryColor: branding.primaryColor || '#0d9488',
        secondaryColor: branding.secondaryColor || '#0284c7',
        accentColor: branding.accentColor || '#f59e0b',
        fontFamily: branding.fontFamily || 'Manrope',
        customDomain: branding.customDomain || '',
        metaTitle: branding.metaTitle || '',
        metaDescription: branding.metaDescription || '',
      })
    }
  }, [company, branding])

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/companies/current', companyData)
      toast.success('Company settings saved')
      refreshUser()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/companies/current/branding', brandingData)
      toast.success('Branding settings saved')
      refreshUser()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save branding')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyDomain() {
    if (!brandingData.customDomain) return
    setVerifying(true)
    try {
      const result = await api.post<{ verified: boolean; message: string }>('/companies/current/domain/verify', {})
      if (result.verified) {
        setDomainStatus('verified')
        toast.success('Domain verified successfully!')
      } else {
        setDomainStatus('failed')
        toast.error(result.message || 'Domain verification failed')
      }
    } catch (error: any) {
      setDomainStatus('failed')
      toast.error(error.message || 'Failed to verify domain')
    } finally {
      setVerifying(false)
    }
  }

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'domain', label: 'Custom Domain', icon: Globe },
  ]

  return (
    <div className="space-y-8">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative flex items-start gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <SettingsIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
            <p className="text-white/80 mt-1 text-sm sm:text-base">
              Manage your company settings and branding
            </p>
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
              Complete your company profile for professional invoices. Set brand colors to match your identity. Add a custom domain for the ultimate branded booking experience.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
        <div className="border-b border-slate-100 overflow-x-auto">
          <nav className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600 bg-teal-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-8">
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                  <input
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
                <input
                  type="text"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">City</label>
                  <input
                    type="text"
                    value={companyData.city}
                    onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">State</label>
                  <input
                    type="text"
                    value={companyData.state}
                    onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={companyData.zipCode}
                    onChange={(e) => setCompanyData({ ...companyData, zipCode: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all rounded-lg shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </form>
          )}

          {activeTab === 'branding' && (
            <form onSubmit={handleSaveBranding} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Logo URL</label>
                <input
                  type="url"
                  value={brandingData.logoUrl}
                  onChange={(e) => setBrandingData({ ...brandingData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.primaryColor}
                      onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                      className="h-12 w-12 border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.primaryColor}
                      onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.secondaryColor}
                      onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                      className="h-12 w-12 border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.secondaryColor}
                      onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingData.accentColor}
                      onChange={(e) => setBrandingData({ ...brandingData, accentColor: e.target.value })}
                      className="h-12 w-12 border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingData.accentColor}
                      onChange={(e) => setBrandingData({ ...brandingData, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Font Family</label>
                <select
                  value={brandingData.fontFamily}
                  onChange={(e) => setBrandingData({ ...brandingData, fontFamily: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="Manrope">Manrope</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Branding
              </button>
            </form>
          )}

          {activeTab === 'domain' && (
            <form onSubmit={handleSaveBranding} className="space-y-6 max-w-2xl">
              <div className="bg-sky-50 border-l-4 border-sky-500 p-4">
                <h3 className="font-bold text-sky-900">Custom Domain Setup</h3>
                <p className="text-sm text-sky-700 mt-1">
                  Use your own domain for a fully branded experience. Point your domain's DNS to our servers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Domain</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={brandingData.customDomain}
                    onChange={(e) => setBrandingData({ ...brandingData, customDomain: e.target.value })}
                    placeholder="bookings.yourcompany.com"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyDomain}
                    disabled={verifying || !brandingData.customDomain}
                    className="px-6 py-3 bg-slate-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-900 disabled:opacity-50 transition-colors"
                  >
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Add a CNAME record pointing to cleanpro.app
                </p>
                {domainStatus === 'verified' && (
                  <div className="mt-2 flex items-center text-sm text-teal-600">
                    <Check className="h-4 w-4 mr-1.5" />
                    Domain verified successfully
                  </div>
                )}
                {domainStatus === 'failed' && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    Domain verification failed. Please check your DNS settings.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">SEO Title</label>
                <input
                  type="text"
                  value={brandingData.metaTitle}
                  onChange={(e) => setBrandingData({ ...brandingData, metaTitle: e.target.value })}
                  placeholder="Your Company - Professional Cleaning Services"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">SEO Description</label>
                <textarea
                  value={brandingData.metaDescription}
                  onChange={(e) => setBrandingData({ ...brandingData, metaDescription: e.target.value })}
                  rows={3}
                  placeholder="Book professional cleaning services with ease..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Domain Settings
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
