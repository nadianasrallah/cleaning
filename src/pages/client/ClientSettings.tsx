import { useState, useEffect } from 'react'
import { 
  User, 
  Bell,
  Lock,
  Save
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function ClientSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const [notifications, setNotifications] = useState({
    emailBookingConfirmation: true,
    emailReminders: true,
    smsReminders: true,
    smsPromotions: false
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
      })
    }
  }, [user])

  async function handleSaveProfile() {
    setLoading(true)
    try {
      await api.put('/client/profile', formData)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveNotifications() {
    setLoading(true)
    try {
      await api.put('/client/notifications', notifications)
      toast.success('Notification preferences saved')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword() {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.put('/client/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })
      toast.success('Password changed successfully')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage your account and preferences</p>
      </div>

      <div className="bg-white shadow-sm p-4 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 bg-teal-100 flex items-center justify-center">
            <User className="h-6 w-6 text-teal-600" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Profile Information</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ZIP</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSaveProfile} 
          disabled={loading} 
          className="inline-flex items-center mt-8 px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Profile
        </button>
      </div>

      <div className="bg-white shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 bg-sky-100 flex items-center justify-center">
            <Bell className="h-6 w-6 text-sky-600" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          {[
            { key: 'emailBookingConfirmation', label: 'Email booking confirmations' },
            { key: 'emailReminders', label: 'Email appointment reminders' },
            { key: 'smsReminders', label: 'SMS appointment reminders' },
            { key: 'smsPromotions', label: 'SMS promotional messages' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-700 font-medium">{item.label}</span>
              <input
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                className="h-5 w-5 text-teal-600 focus:ring-teal-500"
              />
            </label>
          ))}
        </div>

        <button 
          onClick={handleSaveNotifications} 
          disabled={loading} 
          className="inline-flex items-center mt-8 px-6 py-3 bg-teal-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </button>
      </div>

      <div className="bg-white shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 bg-red-100 flex items-center justify-center">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Change Password</h2>
        </div>

        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Password</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <button 
          onClick={handleChangePassword} 
          disabled={loading} 
          className="inline-flex items-center mt-8 px-6 py-3 bg-slate-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-900 disabled:opacity-50 transition-colors"
        >
          <Lock className="h-4 w-4 mr-2" />
          Change Password
        </button>
      </div>
    </div>
  )
}
