import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react'

interface CustomerInfoFormProps {
  onSubmit: (info: any) => void
  onBack: () => void
}

export function CustomerInfoForm({ onSubmit, onBack }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Your Information</h2>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="block mb-2">First Name</Label>
              <input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="John"
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName" className="block mb-2">Last Name</Label>
              <input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Doe"
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="block mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="john@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone" className="block mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </Label>
            <input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="(555) 123-4567"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="address" className="block mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="123 Main St, City, State 12345"
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>

          <div>
            <Label htmlFor="notes" className="block mb-2">Additional Notes (Optional)</Label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Any special instructions?"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button type="submit" className="flex-1">
              Continue to Payment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
