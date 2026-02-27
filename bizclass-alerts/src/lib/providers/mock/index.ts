import type {
  FlightProvider,
  FlightSearchCriteria,
  NormalizedFlightOffer,
  RawFlightResult,
} from '../types'

// Realistic baseline prices per route (EUR, one-way business class)
const BASE_PRICES: Record<string, number> = {
  'SVO-JFK': 2800, 'JFK-SVO': 2800,
  'LED-DXB': 1600, 'DXB-LED': 1600,
  'SVO-DXB': 1400, 'DXB-SVO': 1400,
  'SVO-LHR': 1800, 'LHR-SVO': 1800,
  'SVO-CDG': 1900, 'CDG-SVO': 1900,
  'SVO-FRA': 1700, 'FRA-SVO': 1700,
  'JFK-LHR': 3200, 'LHR-JFK': 3200,
  'DXB-LHR': 2200, 'LHR-DXB': 2200,
  'SVO-IST': 1200, 'IST-SVO': 1200,
  'SVO-BKK': 2400, 'BKK-SVO': 2400,
  'SVO-NRT': 3100, 'NRT-SVO': 3100,
}

const AIRLINES = ['LH', 'BA', 'EK', 'QR', 'SQ', 'AF', 'TK', 'AA', 'SU', 'FZ', 'MS', 'KL', 'OS', 'AY']

// Common hub airports used as layovers for multi-stop itineraries
const HUB_AIRPORTS = ['FRA', 'AMS', 'IST', 'DOH', 'DXB', 'HKG', 'SIN', 'ZRH', 'VIE', 'MUC', 'CDG', 'LHR']

/**
 * Price tier pool — gives a balanced mix of cheap, mid, and premium results
 * so that some offers reliably fall below maxPrice (triggering notifications)
 * while others don't.
 */
const PRICE_TIERS: ReadonlyArray<{ label: string; multiplier: () => number }> = [
  { label: 'flash_sale', multiplier: () => 0.50 + Math.random() * 0.15 }, // 50–65 % of base
  { label: 'budget',     multiplier: () => 0.65 + Math.random() * 0.15 }, // 65–80 %
  { label: 'standard',   multiplier: () => 0.80 + Math.random() * 0.20 }, // 80–100 %
  { label: 'standard',   multiplier: () => 0.85 + Math.random() * 0.20 }, // 85–105 %
  { label: 'standard',   multiplier: () => 0.90 + Math.random() * 0.20 }, // 90–110 %
  { label: 'mid',        multiplier: () => 1.00 + Math.random() * 0.20 }, // 100–120 %
  { label: 'mid',        multiplier: () => 1.05 + Math.random() * 0.20 }, // 105–125 %
  { label: 'premium',    multiplier: () => 1.20 + Math.random() * 0.25 }, // 120–145 %
  { label: 'premium',    multiplier: () => 1.30 + Math.random() * 0.20 }, // 130–150 %
  { label: 'luxury',     multiplier: () => 1.50 + Math.random() * 0.30 }, // 150–180 %
]

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(arr: readonly T[]): T {
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx] as T
}

function addMinutes(isoDate: string, minutes: number): string {
  return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString()
}

function pickDepartureDate(criteria: FlightSearchCriteria): string {
  const from = new Date(criteria.departDateFrom)
  if (!criteria.departDateTo) return criteria.departDateFrom
  const to = new Date(criteria.departDateTo)
  const diffDays = Math.floor((to.getTime() - from.getTime()) / 86_400_000)
  const picked = new Date(from.getTime() + randomBetween(0, diffDays) * 86_400_000)
  return picked.toISOString().slice(0, 10)
}

/** Connecting flights use two carriers; direct flights use one. */
function buildAirlineCodes(stops: number): string[] {
  const primary = randomElement(AIRLINES)
  if (stops === 0) return [primary]
  const secondary = randomElement(AIRLINES.filter((a) => a !== primary))
  return [primary, secondary]
}

export const MockFlightProvider: FlightProvider = {
  name: 'mock',

  async searchFlights(criteria: FlightSearchCriteria): Promise<RawFlightResult[]> {
    // Simulate realistic API latency (60–180 ms)
    await new Promise((r) => setTimeout(r, randomBetween(60, 180)))

    const routeKey = `${criteria.origin}-${criteria.destination}`
    const basePrice = BASE_PRICES[routeKey] ?? randomBetween(1500, 3500)

    const count = randomBetween(5, 10)

    // Shuffle the tier pool and slice to `count` so every run has different variety
    const tiers = [...PRICE_TIERS]
      .sort(() => Math.random() - 0.5)
      .slice(0, count)

    return tiers.map((tier, i) => {
      const departDate = pickDepartureDate(criteria)
      const departHour = String(randomBetween(5, 23)).padStart(2, '0')
      const departMinute = randomElement(['00', '15', '30', '45'] as const)
      const departAt = `${departDate}T${departHour}:${departMinute}:00.000Z`

      // Clamp stops to the user's max preference
      const stops = Math.min(randomBetween(0, 2), criteria.maxStops)

      // Connecting flights take longer — add 90–240 min per layover
      const baseDuration = randomBetween(180, 600)
      const durationMinutes = baseDuration + stops * randomBetween(90, 240)

      const price = Math.round(basePrice * tier.multiplier() * 100) / 100
      const airlineCodes = buildAirlineCodes(stops)

      // Direct flights are almost always full business; connecting may be mixed
      const isFullBusiness = stops === 0 ? Math.random() > 0.08 : Math.random() > 0.35

      // Hub used as layover airport (metadata only, not part of NormalizedFlightOffer)
      const connectionAirport = stops > 0 ? randomElement(HUB_AIRPORTS) : null

      let returnDepartAt: string | null = null
      let returnDurationMinutes: number | null = null
      if (criteria.tripType === 'round_trip' && criteria.returnDateFrom) {
        const retHour = String(randomBetween(5, 23)).padStart(2, '0')
        const retMinute = randomElement(['00', '15', '30', '45'] as const)
        returnDepartAt = `${criteria.returnDateFrom}T${retHour}:${retMinute}:00.000Z`
        returnDurationMinutes = baseDuration + stops * randomBetween(90, 240)
      }

      return {
        id: `mock-${Date.now()}-${i}`,
        origin: criteria.origin,
        destination: criteria.destination,
        departAt,
        durationMinutes,
        stops,
        price,
        currency: criteria.currency,
        airlineCodes,
        isFullBusiness,
        returnDepartAt,
        returnDurationMinutes,
        connectionAirport,
        priceTier: tier.label,
      }
    })
  },

  normalizeResults(raw: RawFlightResult[]): NormalizedFlightOffer[] {
    return raw.map((r) => {
      const departAt = r['departAt'] as string
      const durationMinutes = r['durationMinutes'] as number
      const arriveAt = addMinutes(departAt, durationMinutes)

      let returnDepartAt: string | null = null
      let returnArriveAt: string | null = null
      if (r['returnDepartAt']) {
        returnDepartAt = r['returnDepartAt'] as string
        returnArriveAt = addMinutes(returnDepartAt, r['returnDurationMinutes'] as number)
      }

      return {
        origin: r['origin'] as string,
        destination: r['destination'] as string,
        departAt,
        arriveAt,
        returnDepartAt,
        returnArriveAt,
        price: r['price'] as number,
        currency: r['currency'] as string,
        stops: r['stops'] as number,
        durationMinutes,
        isFullBusiness: r['isFullBusiness'] as boolean,
        airlineCodes: r['airlineCodes'] as string[],
        rawData: r,
      }
    })
  },

  buildDeepLink(offer: NormalizedFlightOffer, criteria: FlightSearchCriteria): string {
    const params = new URLSearchParams({
      from: offer.origin,
      to: offer.destination,
      date: criteria.departDateFrom,
      cabin: 'business',
      adults: '1',
    })
    if (criteria.tripType === 'round_trip' && criteria.returnDateFrom) {
      params.set('return', criteria.returnDateFrom)
    }
    // In production this would be a real booking deep-link (Amadeus, Kiwi, etc.)
    return `https://www.google.com/travel/flights?${params.toString()}`
  },
}
