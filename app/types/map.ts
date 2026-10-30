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
