import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Home, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  Gift
} from 'lucide-react'
import { useState } from 'react'

export default function ClientLayout() {
  const { user, company, branding, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const primaryColor = branding?.primaryColor || '#0d9488'

  const navigation = [
    { name: 'Dashboard', href: '/client', icon: Home },
    { name: 'My Bookings', href: '/client/bookings', icon: Calendar },
    { name: 'Invoices', href: '/client/invoices', icon: FileText },
    { name: 'Messages', href: '/client/messages', icon: MessageSquare },
    { name: 'Refer a Friend', href: '/client/referrals', icon: Gift },
    { name: 'Settings', href: '/client/settings', icon: Settings },
  ]

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function isActive(href: string) {
    if (href === '/client') {
      return location.pathname === '/client'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');`}
      </style>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt={company?.name} className="h-10" />
              ) : (
                <>
                  <div className="p-2" style={{ backgroundColor: primaryColor }}>
                    <Star className="h-5 w-5 text-white fill-white" />
                  </div>
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {company?.name || 'CleanPro'}
                  </span>
                </>
              )}
            </div>

            <nav className="hidden md:flex items-center">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all border-b-2 ${
                    isActive(item.href)
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-9 w-9 flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white shadow-lg">
            <nav className="container mx-auto px-6 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all ${
                    isActive(item.href)
                      ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
