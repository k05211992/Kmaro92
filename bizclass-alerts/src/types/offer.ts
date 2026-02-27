export interface FlightOffer {
  id: string
  alertId: string
  provider: string
  origin: string
  destination: string
  departAt: string // ISO timestamp
  arriveAt: string
  returnDepartAt: string | null
  returnArriveAt: string | null
  price: number
  currency: string
  stops: number
  durationMinutes: number
  isFullBusiness: boolean
  airlineCodes: string[]
  deepLink: string
  rawData: Record<string, unknown>
  hashForDedup: string
  foundAt: string
}
