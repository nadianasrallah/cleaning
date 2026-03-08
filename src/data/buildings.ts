export interface Building {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  bookingUrl?: string
  rsvpUrl?: string
}

export const buildings: Building[] = [
  {
    id: 'buchanan',
    name: 'The Buchanan',
    address: '1800 Market Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    bookingUrl: '/booking?company=buchanan',
    rsvpUrl: '/buchanan-coffee-rsvp'
  },
  {
    id: 'alta-plus',
    name: 'Alta+',
    address: '1550 Mission Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    bookingUrl: '/booking?company=alta-plus',
    rsvpUrl: '/alta-coffee-rsvp'
  },
  {
    id: 'union-channel',
    name: 'Union Channel',
    address: '333 3rd Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94107',
    bookingUrl: '/booking?company=union-channel',
    rsvpUrl: '/unionchannel-coffee-rsvp'
  },
  {
    id: 'the-hayes',
    name: 'The Hayes',
    address: '55 Page Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    bookingUrl: '/booking?company=the-hayes',
    rsvpUrl: '/hayes-coffee-rsvp'
  },
  {
    id: 'parkmerced',
    name: 'Parkmerced',
    address: '3711 19th Avenue',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94132',
    bookingUrl: '/booking?company=parkmerced',
    rsvpUrl: '/parkmerced-coffee-rsvp'
  },
  {
    id: 'avalon-hayes',
    name: 'Avalon Hayes Valley',
    address: '388 Fulton Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    bookingUrl: '/booking?company=avalon-hayes',
    rsvpUrl: '/avalon-coffee-rsvp'
  },
  {
    id: 'nema',
    name: 'NEMA',
    address: '8 10th Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    bookingUrl: '/booking?company=nema',
    rsvpUrl: '/nema-coffee-rsvp'
  },
  {
    id: 'lumina',
    name: 'Lumina',
    address: '201 Folsom Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    bookingUrl: '/booking?company=lumina',
    rsvpUrl: '/lumina-coffee-rsvp'
  }
]

export function searchBuildings(query: string): Building[] {
  if (!query.trim()) return []
  
  const lowerQuery = query.toLowerCase()
  return buildings.filter(building => 
    building.name.toLowerCase().includes(lowerQuery) ||
    building.address.toLowerCase().includes(lowerQuery) ||
    building.city.toLowerCase().includes(lowerQuery) ||
    building.zipCode.includes(query)
  )
}
