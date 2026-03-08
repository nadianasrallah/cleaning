import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  MessageSquare,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
  Target,
  Phone,
  Tag,
  UserCog,
  ChevronRight,
  BarChart3,
  Search,
  HelpCircle,
  Zap
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, description: 'Overview & analytics' },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar, description: 'Manage appointments' },
  { name: 'Clients', href: '/admin/clients', icon: Users, description: 'Customer database' },
  { name: 'Staff', href: '/admin/staff', icon: UserCog, description: 'Team members' },
  { name: 'Scheduling', href: '/admin/scheduling', icon: Clock, description: 'Availability & shifts' },
  { name: 'Services', href: '/admin/services', icon: Sparkles, description: 'Service offerings' },
  { name: 'Leads', href: '/admin/leads', icon: Target, description: 'Potential customers' },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare, description: 'Conversations' },
  { name: 'SMS', href: '/admin/sms', icon: Phone, description: 'Text notifications' },
  { name: 'Promo Codes', href: '/admin/promo-codes', icon: Tag, description: 'Discounts & offers' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, description: 'Company settings' },
]

export default function AdminLayout() {
  const { user, company, branding, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const primaryColor = branding?.primaryColor || '#0d9488'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-white shadow-2xl animate-slide-in-left">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setSidebarOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent 
              navigation={navigation} 
              currentPath={location.pathname}
              company={company}
              branding={branding}
              primaryColor={primaryColor}
              onLogout={handleLogout}
              user={user}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-xl">
          <SidebarContent 
            navigation={navigation} 
            currentPath={location.pathname}
            company={company}
            branding={branding}
            primaryColor={primaryColor}
            onLogout={handleLogout}
            user={user}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 lg:hidden bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <button className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 block h-2 w-2 bg-teal-500 rounded-full ring-2 ring-white" />
              </button>
              <div 
                className="h-10 w-10 flex items-center justify-center rounded-xl text-white text-sm font-bold shadow-lg"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
              >
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <header className="hidden lg:block sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Search bar */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search bookings, clients, services..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-0 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-200/80 rounded-md text-[10px] font-medium text-slate-500">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Quick action */}
              <Link 
                to="/admin/bookings/new"
                className="hidden xl:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30"
              >
                <Zap className="h-4 w-4" />
                Quick Book
              </Link>

              {/* Help */}
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all">
                <HelpCircle className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 block h-2 w-2 bg-teal-500 rounded-full ring-2 ring-white animate-pulse" />
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-slate-200"></div>

              {/* User menu */}
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs font-medium text-slate-400 capitalize">{user?.role}</p>
                </div>
                <div 
                  className="h-11 w-11 flex items-center justify-center rounded-xl text-white text-sm font-bold shadow-lg ring-2 ring-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                >
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-4 px-8 border-t border-slate-200/80 bg-white/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <p>© {new Date().getFullYear()} {company?.name || 'CleanPro'}. All rights reserved.</p>
            <p>Powered by CleanPro Platform</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: typeof navigation
  currentPath: string
  company: any
  branding: any
  primaryColor: string
  onLogout: () => void
  user: any
}

function SidebarContent({ 
  navigation, 
  currentPath, 
  company, 
  branding,
  primaryColor,
  onLogout,
  user
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo section */}
      <div className="flex items-center h-20 flex-shrink-0 px-6 border-b border-slate-700/50">
        {branding?.logoUrl ? (
          <img src={branding.logoUrl} alt={company?.name} className="h-10" />
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight block leading-none">
                {company?.name || 'CleanPro'}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Admin Portal
              </span>
            </div>
          </div>
        )}
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 text-white text-sm font-bold shadow-md">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-emerald-400/30"></div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Main Menu
        </p>
        {navigation.map((item, index) => {
          const isActive = currentPath === item.href || 
            (item.href !== '/admin' && currentPath.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-white bg-gradient-to-r from-teal-500/20 to-teal-600/10 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-teal-400 to-teal-600"></div>
              )}
              
              {/* Icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                isActive 
                  ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-md shadow-teal-500/30' 
                  : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
              }`}>
                <item.icon className="h-4 w-4" />
              </div>
              
              {/* Label */}
              <span className="flex-1">{item.name}</span>
              
              {/* Arrow for active */}
              {isActive && (
                <ChevronRight className="h-4 w-4 text-teal-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Pro upgrade card */}
      <div className="mx-3 mb-3">
        <div className="relative overflow-hidden p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl text-white">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-sky-400/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pro Tip</span>
            </div>
            <p className="text-sm font-medium text-slate-300 mb-3">
              Respond to leads within 24 hours for best conversion rates.
            </p>
            <Link 
              to="/admin/leads"
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
            >
              View Leads <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Logout */}
      <div className="flex-shrink-0 border-t border-slate-700/50 p-3">
        <button
          onClick={onLogout}
          className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/50 text-slate-400 group-hover:bg-red-500/20 group-hover:text-red-400 transition-all">
            <LogOut className="h-4 w-4" />
          </div>
          Sign out
        </button>
      </div>
    </div>
  )
}
