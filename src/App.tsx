import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import PasswordGate from '@/components/PasswordGate'

import Home from '@/pages/Home'
import FindMyBuilding from '@/pages/FindMyBuilding'
import Booking from '@/pages/Booking'
import RSVPEvent from '@/pages/RSVPEvent'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

import AdminLayout from '@/pages/admin/AdminLayout'
import Dashboard from '@/pages/admin/Dashboard'
import Bookings from '@/pages/admin/Bookings'
import BookingDetail from '@/pages/admin/BookingDetail'
import Clients from '@/pages/admin/Clients'
import ClientDetail from '@/pages/admin/ClientDetail'
import Services from '@/pages/admin/Services'
import Leads from '@/pages/admin/Leads'
import Messages from '@/pages/admin/Messages'
import Settings from '@/pages/admin/Settings'
import SMS from '@/pages/admin/SMS'
import NewClient from '@/pages/admin/NewClient'
import NewBooking from '@/pages/admin/NewBooking'
import Scheduling from '@/pages/admin/Scheduling'
import Staff from '@/pages/admin/Staff'
import PromoCodes from '@/pages/admin/PromoCodes'

import PublicBooking from '@/pages/public/PublicBooking'
import BookingSuccess from '@/pages/public/BookingSuccess'

import ClientLayout from '@/pages/client/ClientLayout'
import ClientDashboard from '@/pages/client/ClientDashboard'
import ClientBookings from '@/pages/client/ClientBookings'
import ClientBookingDetail from '@/pages/client/ClientBookingDetail'
import ClientNewBooking from '@/pages/client/ClientNewBooking'
import ClientInvoices from '@/pages/client/ClientInvoices'
import ClientMessages from '@/pages/client/ClientMessages'
import ClientSettings from '@/pages/client/ClientSettings'
import ClientReferrals from '@/pages/client/ClientReferrals'

const queryClient = new QueryClient()

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'client') {
      return <Navigate to="/client" replace />
    }
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/findmybuilding" element={<FindMyBuilding />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/:buildingSlug-:eventType-rsvp" element={<RSVPEvent />} />
      <Route path="/rsvp/:buildingSlug/:eventType" element={<RSVPEvent />} />
      
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/book/:companySlug" element={<PublicBooking />} />
      <Route path="/book/:companySlug/success" element={<BookingSuccess />} />

      <Route path="/client" element={
        <ProtectedRoute>
          <ClientLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ClientDashboard />} />
        <Route path="bookings" element={<ClientBookings />} />
        <Route path="bookings/new" element={<ClientNewBooking />} />
        <Route path="bookings/:id" element={<ClientBookingDetail />} />
        <Route path="invoices" element={<ClientInvoices />} />
        <Route path="messages" element={<ClientMessages />} />
        <Route path="referrals" element={<ClientReferrals />} />
        <Route path="settings" element={<ClientSettings />} />
      </Route>

      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/new" element={<NewBooking />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/new" element={<NewClient />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="services" element={<Services />} />
        <Route path="leads" element={<Leads />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} />
        <Route path="scheduling" element={<Scheduling />} />
        <Route path="staff" element={<Staff />} />
        <Route path="sms" element={<SMS />} />
        <Route path="promo-codes" element={<PromoCodes />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <PasswordGate>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </PasswordGate>
  )
}
