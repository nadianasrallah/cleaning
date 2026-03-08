import { useState, useEffect } from 'react'
import { Lock, ArrowRight } from 'lucide-react'

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD || 'test1234'
const STORAGE_KEY = 'site_authenticated'

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authenticated = sessionStorage.getItem(STORAGE_KEY)
    if (authenticated === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      setIsAuthenticated(true)
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-teal-600 rounded-full"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;700;800&display=swap');`}
      </style>
      
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl border-t-4 border-teal-600 p-8">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-teal-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-teal-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-2 tracking-tight">
            Site Access Required
          </h1>
          <p className="text-slate-500 text-center mb-8 text-sm">
            This site is currently in preview mode. Please enter the access password to continue.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter access password"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-teal-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-teal-700 transition-colors"
            >
              Enter Site
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
        
        <p className="text-center mt-6 text-xs text-slate-400">
          Contact the site administrator if you need access.
        </p>
      </div>
    </div>
  )
}
