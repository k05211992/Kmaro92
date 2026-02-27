export interface FlightSearchCriteria {
  origin: string
  destination: string
  tripType: 'one_way' | 'round_trip'
  departDateFrom: string // YYYY-MM-DD
  departDateTo: string | null
  returnDateFrom: string | null
  returnDateTo: string | null
  cabinClass: 'business'
  maxStops: number
  maxDurationMinutes: number | null
  nearbyAirports: boolean
  currency: string
}

// Raw shape is provider-specific — we keep it open
export type RawFlightResult = Record<string, unknown>

export interface NormalizedFlightOffer {
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
  /** false = at least one segment is NOT business class */
  isFullBusiness: boolean
  airlineCodes: string[]
  rawData: Record<string, unknown>
}

export interface FlightProvider {
  readonly name: string
  searchFlights(criteria: FlightSearchCriteria): Promise<RawFlightResult[]>
  normalizeResults(raw: RawFlightResult[]): NormalizedFlightOffer[]
  buildDeepLink(offer: NormalizedFlightOffer, criteria: FlightSearchCriteria): string
}
