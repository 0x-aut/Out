export interface MapPoint {
  id: string
  name: string
  category: string
  color: string
  icon?: 'view' | 'cafe' | 'architecture' | 'courtyard'
  x: number
  y: number
  selected?: boolean
}

export interface MapPlace {
  id: string
  placeId?: string | null
  name: string
  category: string | null
  address: string | null
  city: string | null
  country: string | null
  latitude: number
  longitude: number
  imageUrl: string | null
}

export interface UserMapLocation {
  latitude: number
  longitude: number
  accuracy: number
}

export interface MapRouteGeometry {
  type: 'LineString'
  coordinates: [number, number][]
}

export interface WalkingRoute {
  geometry: MapRouteGeometry
  distance: number
  duration: number
}
