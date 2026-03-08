import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

interface DateTimeSelectionProps {
  service: any
  onSelect: (date: Date, time: string, frequency: string) => void
  onBack: () => void
}

export function DateTimeSelection({ service, onSelect, onBack }: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [frequency, setFrequency] = useState<string>('one_time')

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time')
      return
    }
    onSelect(new Date(selectedDate), selectedTime, frequency)
  }

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Schedule Your Booking</h2>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">Service</Label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{service.name}</p>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="date" className="text-base mb-3 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Date
            </Label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <Label className="text-base mb-3 block flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Select Time
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  onClick={() => setSelectedTime(time)}
                  className="text-sm"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base mb-3 block">Frequency</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'one_time', label: 'One Time' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'bi_weekly', label: 'Bi-Weekly' },
                { value: 'monthly', label: 'Monthly' }
              ].map(option => (
                <Button
                  key={option.value}
                  variant={frequency === option.value ? 'default' : 'outline'}
                  onClick={() => setFrequency(option.value)}
                  className="text-sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
