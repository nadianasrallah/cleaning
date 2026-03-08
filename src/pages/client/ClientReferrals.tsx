import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import { Gift, Copy, Share2, Users, DollarSign, CheckCircle, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'

interface ReferralData {
  referralCode: string
  referralLink: string
  stats: {
    totalReferred: number
    converted: number
    totalEarned: number
  }
}

export default function ClientReferrals() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadReferralData()
  }, [])

  async function loadReferralData() {
    try {
      const res = await api.get('/referrals/my-code')
      setReferralData(res.data)
    } catch (error) {
      console.error('Failed to load referral data:', error)
      toast.error('Failed to load referral information')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string, type: 'code' | 'link') {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`Referral ${type} copied to clipboard!`)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareLink() {
    if (!referralData) return
    
    const shareData = {
      title: 'Get $10 Off Your First Cleaning!',
      text: `Use my referral code ${referralData.referralCode} to get $10 off your first cleaning service!`,
      url: window.location.origin + referralData.referralLink
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        copyToClipboard(window.location.origin + referralData.referralLink, 'link')
      }
    } else {
      copyToClipboard(window.location.origin + referralData.referralLink, 'link')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  const fullReferralLink = referralData ? window.location.origin + referralData.referralLink : ''

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Refer a Friend</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Share your referral code and earn rewards when friends book</p>
      </div>

      <div className="bg-gradient-to-br from-teal-600 to-sky-600 text-white p-8 shadow-lg">
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 bg-white/20 flex items-center justify-center flex-shrink-0">
            <Gift className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Give $10, Get $10</h2>
            <p className="text-white/80 mb-6">
              Share your referral code with friends. When they book their first cleaning, 
              they get $10 off and you earn $10 credit toward your next service.
            </p>
            
            {referralData && (
              <div className="space-y-4">
                <div className="bg-white/10 p-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
                    Your Referral Code
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-extrabold tracking-wider">{referralData.referralCode}</span>
                    <button
                      onClick={() => copyToClipboard(referralData.referralCode, 'code')}
                      className="p-2 bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-white/10 p-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
                    Your Referral Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={fullReferralLink}
                      className="flex-1 bg-white/10 px-3 py-2 text-sm text-white border border-white/20"
                    />
                    <button
                      onClick={() => copyToClipboard(fullReferralLink, 'link')}
                      className="p-2 bg-white/20 hover:bg-white/30 transition-colors"
                      title="Copy link"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <button
                      onClick={shareLink}
                      className="p-2 bg-white/20 hover:bg-white/30 transition-colors"
                      title="Share"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-sm p-6 border-t-4 border-teal-600">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-teal-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Friends Referred</p>
              <p className="text-2xl font-extrabold text-slate-900">{referralData?.stats.totalReferred || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm p-6 border-t-4 border-sky-600">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-sky-50 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Successful Referrals</p>
              <p className="text-2xl font-extrabold text-slate-900">{referralData?.stats.converted || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm p-6 border-t-4 border-emerald-600">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-50 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Earned</p>
              <p className="text-2xl font-extrabold text-slate-900">${referralData?.stats.totalEarned || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm p-6">
        <h3 className="text-lg font-extrabold text-slate-900 mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="h-12 w-12 bg-teal-100 text-teal-600 mx-auto mb-3 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Share Your Code</h4>
            <p className="text-sm text-slate-500">
              Send your unique referral code or link to friends and family
            </p>
          </div>
          <div className="text-center">
            <div className="h-12 w-12 bg-teal-100 text-teal-600 mx-auto mb-3 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h4 className="font-bold text-slate-900 mb-2">They Book & Save</h4>
            <p className="text-sm text-slate-500">
              When they use your code, they get $10 off their first cleaning
            </p>
          </div>
          <div className="text-center">
            <div className="h-12 w-12 bg-teal-100 text-teal-600 mx-auto mb-3 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h4 className="font-bold text-slate-900 mb-2">You Earn Credit</h4>
            <p className="text-sm text-slate-500">
              After their cleaning is completed, you receive $10 credit
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
