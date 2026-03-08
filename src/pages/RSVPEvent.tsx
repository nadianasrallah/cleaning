import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { buildings } from '@/data/buildings'
import { Sparkles, Coffee, Wine, PartyPopper, CheckCircle, Gift, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface EventConfig {
  title: string
  subtitle: string
  icon: typeof Coffee
  bgColor: string
  webhookUrl?: string
  promoCode: string
  promoAmount: string
}

const eventTypes: Record<string, EventConfig> = {
  'coffee': {
    title: 'Free Coffee Event',
    subtitle: 'Join us for complimentary coffee and pastries',
    icon: Coffee,
    bgColor: 'bg-amber-100',
    promoCode: 'COFFEE75',
    promoAmount: '$75'
  },
  'wine': {
    title: 'Wine & Pizza Night',
    subtitle: 'An evening of wine tasting and gourmet pizza',
    icon: Wine,
    bgColor: 'bg-purple-100',
    promoCode: 'WINE75',
    promoAmount: '$75'
  },
  'party': {
    title: 'Building Social',
    subtitle: 'Meet your neighbors and enjoy refreshments',
    icon: PartyPopper,
    bgColor: 'bg-pink-100',
    promoCode: 'PARTY75',
    promoAmount: '$75'
  }
}

export default function RSVPEvent() {
  const { buildingSlug, eventType = 'coffee' } = useParams()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showPromoCode, setShowPromoCode] = useState(false)

  const normalizeSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  const building = buildings.find(b => {
    const normalizedBuildingId = normalizeSlug(b.id)
    const normalizedBuildingName = normalizeSlug(b.name)
    const normalizedSlug = normalizeSlug(buildingSlug || '')
    
    return normalizedBuildingId === normalizedSlug || 
           normalizedBuildingName === normalizedSlug ||
           normalizedBuildingId.includes(normalizedSlug) ||
           normalizedSlug.includes(normalizedBuildingId)
  })
  
  const event = eventTypes[eventType] || eventTypes['coffee']
  const EventIcon = event.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (event.webhookUrl) {
        await fetch(event.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            building: building?.name || buildingSlug,
            eventType,
            timestamp: new Date().toISOString()
          })
        })
      }
      
      setIsSubmitted(true)
      toast.success('RSVP submitted successfully!')
    } catch (error) {
      console.error('Error submitting RSVP:', error)
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (event.webhookUrl) {
        await fetch(event.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            phone,
            building: building?.name || buildingSlug,
            eventType,
            promoCodeSent: true,
            timestamp: new Date().toISOString()
          })
        })
      }
      
      setShowPromoCode(true)
      toast.success('Promo code unlocked!')
    } catch (error) {
      console.error('Error:', error)
      setShowPromoCode(true)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">CleanPro</span>
            </Link>
          </div>
        </header>

        <main className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <Card className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h1>
                <p className="text-gray-600 mb-8">
                  Thanks for RSVPing! We'll see you at the event.
                </p>

                {!showPromoCode ? (
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Gift className="h-6 w-6 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Want {event.promoAmount} OFF?</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter your phone number to receive an exclusive promo code for your first CleanPro booking!
                    </p>
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <input
                        type="tel"
                        placeholder="(555) 555-5555"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button type="submit" className="w-full">
                        Get My Promo Code
                      </Button>
                    </form>
                  </Card>
                ) : (
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 mb-6">
                    <Gift className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Your Promo Code</h3>
                    <div className="bg-white rounded-lg py-3 px-4 mb-3">
                      <span className="text-2xl font-mono font-bold text-green-600 tracking-wider">
                        {event.promoCode}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Use this code for {event.promoAmount} off your first cleaning!
                    </p>
                  </Card>
                )}

                <Link to={building?.bookingUrl || '/findmybuilding'}>
                  <Button variant="outline" className="w-full">
                    Book a Cleaning Now
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">CleanPro</span>
            </Link>
            <Link to="/">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${event.bgColor} mb-6`}>
                <EventIcon className="h-8 w-8 text-gray-700" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-gray-600">{event.subtitle}</p>
              {building && (
                <p className="text-blue-600 font-medium mt-2">at {building.name}</p>
              )}
            </div>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-lg py-6" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'RSVP Now'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By RSVPing, you agree to receive event updates and promotional offers from CleanPro.
                </p>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
