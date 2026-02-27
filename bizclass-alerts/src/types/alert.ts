export type AlertStatus = 'active' | 'paused' | 'archived'
export type TripType = 'one_way' | 'round_trip'
export type Currency = 'EUR' | 'USD'
export type MaxStops = 0 | 1 | 2
export type NotifFrequency = 'instant' | 'daily_digest'

export interface Alert {
  id: string
  userId: string
  status: AlertStatus
  origin: string
  destination: string
  tripType: TripType
  departDateFrom: string // YYYY-MM-DD
  departDateTo: string | null
  returnDateFrom: string | null
  returnDateTo: string | null
  cabinClass: 'business'
  maxPrice: number
  currency: Currency
  maxStops: MaxStops
  maxDurationMinutes: number | null
  nearbyAirports: boolean
  notifFrequency: NotifFrequency
  lastCheckedAt: string | null
  bestPriceSeen: number | null
  createdAt: string
  updatedAt: string
}

export type AlertCreateInput = Omit<
  Alert,
  'id' | 'userId' | 'status' | 'cabinClass' | 'lastCheckedAt' | 'bestPriceSeen' | 'createdAt' | 'updatedAt'
>

export type AlertUpdateInput = Partial<AlertCreateInput> & { status?: AlertStatus }
