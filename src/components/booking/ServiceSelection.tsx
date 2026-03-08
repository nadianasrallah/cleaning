import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Clock, Bed, Bath } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface ServiceSelectionProps {
  services: any[]
  onSelect: (service: any) => void
  bedrooms: number
  setBedrooms: (n: number) => void
  bathrooms: number
  setBathrooms: (n: number) => void
}

export function ServiceSelection({
  services,
  onSelect,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms
}: ServiceSelectionProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No services available at the moment.</p>
      </div>
    )
  }

  const calculateEstimatedPrice = (basePrice: number) => {
    const bedPrice = (bedrooms - 1) * 10
    const bathPrice = (bathrooms - 1) * 15
    return basePrice + Math.max(0, bedPrice) + Math.max(0, bathPrice)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Property Details</h2>
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-base">Bedrooms</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                >
                  -
                </Button>
                <span className="text-xl font-semibold w-8 text-center">{bedrooms}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBedrooms(Math.min(10, bedrooms + 1))}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-base">Bathrooms</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBathrooms(Math.max(1, bathrooms - 1))}
                >
                  -
                </Button>
                <span className="text-xl font-semibold w-8 text-center">{bathrooms}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBathrooms(Math.min(10, bathrooms + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Select a Service</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card
              key={service.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onSelect(service)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{service.name}</h3>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                  ${calculateEstimatedPrice(service.price)}
                </div>
              </div>

              {service.description && (
                <p className="text-muted-foreground mb-4">{service.description}</p>
              )}

              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{service.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span>{bedrooms} Bed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  <span>{bathrooms} Bath</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
