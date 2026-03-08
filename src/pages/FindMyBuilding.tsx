import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { buildings, Building } from '@/data/buildings'
import { Sparkles, Search, MapPin, ArrowRight, ArrowLeft, Building2 } from 'lucide-react'

export default function FindMyBuilding() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const navigate = useNavigate()

  const fuse = useMemo(() => {
    return new Fuse(buildings, {
      keys: ['name', 'address', 'city', 'zipCode'],
      threshold: 0.3,
      includeScore: true
    })
  }, [])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return fuse.search(searchQuery).map(result => result.item)
  }, [searchQuery, fuse])

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building)
  }

  const handleContinue = () => {
    if (selectedBuilding?.bookingUrl) {
      navigate(selectedBuilding.bookingUrl)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
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
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 mb-6">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Find Your Building
              </h1>
              <p className="text-lg text-gray-600">
                Search for your residential building to access exclusive CleanPro services and member rates.
              </p>
            </div>

            <Card className="p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by building name or address..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedBuilding(null)
                  }}
                  className="w-full pl-12 pr-4 py-4 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </Card>

            {searchQuery && searchResults.length > 0 && (
              <div className="space-y-3 mb-6">
                {searchResults.map((building) => (
                  <Card
                    key={building.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedBuilding?.id === building.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleBuildingSelect(building)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{building.name}</h3>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>{building.address}, {building.city}, {building.state} {building.zipCode}</span>
                        </div>
                      </div>
                      {selectedBuilding?.id === building.id && (
                        <div className="text-blue-600 font-medium">Selected</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <Card className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Building2 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Building Not Found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find a building matching "{searchQuery}". 
                  Try a different search or contact us to add your building.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </Card>
            )}

            {!searchQuery && (
              <Card className="p-8 text-center bg-gray-50 border-dashed">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Typing to Search</h3>
                <p className="text-gray-500">
                  Enter your building name or address to find exclusive cleaning services.
                </p>
              </Card>
            )}

            {selectedBuilding && (
              <div className="mt-8">
                <Button
                  size="lg"
                  className="w-full text-lg py-6"
                  onClick={handleContinue}
                >
                  Continue with {selectedBuilding.name}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            <div className="mt-12 text-center">
              <p className="text-gray-500 mb-4">Don't see your building?</p>
              <Button variant="outline">
                Request to Add Your Building
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
