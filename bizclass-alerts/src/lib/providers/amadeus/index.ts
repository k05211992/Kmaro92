import type {
  FlightProvider,
  FlightSearchCriteria,
  NormalizedFlightOffer,
  RawFlightResult,
} from '../types'
import { config } from '@/config'

// ─── Token cache ──────────────────────────────────────────────────────────────

interface TokenCache {
  token: string
  expiresAt: number // Unix ms
}

let tokenCache: TokenCache | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  // Reuse cached token until 60 s before expiry
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.token
  }

  const { hostname, clientId, clientSecret } = config.amadeus
  if (!clientId || !clientSecret) {
    throw new Error(
      'Amadeus credentials not set. Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to your environment.',
    )
  }

  const res = await fetch(`https://${hostname}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Amadeus OAuth2 failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = { token: data.access_token, expiresAt: now + data.expires_in * 1_000 }
  return tokenCache.token
}

// ─── Amadeus response types ───────────────────────────────────────────────────

interface AmadeusSegment {
  departure: { iataCode: string; at: string }
  arrival: { iataCode: string; at: string }
  carrierCode: string
  duration: string // ISO 8601: "PT9H30M"
  numberOfStops: number
}

interface AmadeusItinerary {
  duration: string
  segments: AmadeusSegment[]
}

interface AmadeusFareDetail {
  segmentId: string
  cabin: string // "BUSINESS" | "ECONOMY" | "PREMIUM_ECONOMY" | "FIRST"
}

interface AmadeusTravelerPricing {
  fareDetailsBySegment: AmadeusFareDetail[]
}

interface AmadeusOffer {
  id: string
  itineraries: AmadeusItinerary[]
  price: {
    currency: string
    total: string
    grandTotal: string
  }
  validatingAirlineCodes: string[]
  travelerPricings: AmadeusTravelerPricing[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "PT9H30M" → 570 minutes */
function isoDurationToMinutes(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  return parseInt(match[1] ?? '0', 10) * 60 + parseInt(match[2] ?? '0', 10)
}

/** Unique carrier codes across all itineraries */
function extractAirlineCodes(offer: AmadeusOffer): string[] {
  const codes = new Set<string>()
  for (const itin of offer.itineraries) {
    for (const seg of itin.segments) {
      codes.add(seg.carrierCode)
    }
  }
  return [...codes]
}

/** True only when every segment in every itinerary is in BUSINESS cabin */
function checkFullBusiness(offer: AmadeusOffer): boolean {
  for (const tp of offer.travelerPricings) {
    for (const fd of tp.fareDetailsBySegment) {
      if (fd.cabin !== 'BUSINESS') return false
    }
  }
  return true
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AmadeusFlightProvider: FlightProvider = {
  name: 'amadeus',

  async searchFlights(criteria: FlightSearchCriteria): Promise<RawFlightResult[]> {
    const token = await getAccessToken()
    const { hostname } = config.amadeus

    const params = new URLSearchParams({
      originLocationCode: criteria.origin,
      destinationLocationCode: criteria.destination,
      departureDate: criteria.departDateFrom,
      adults: '1',
      travelClass: 'BUSINESS',
      currencyCode: criteria.currency,
      max: '20',
    })

    // If the alert forbids stops, request non-stop only
    if (criteria.maxStops === 0) {
      params.set('nonStop', 'true')
    }

    // Round-trip: pass returnDate
    if (criteria.tripType === 'round_trip' && criteria.returnDateFrom) {
      params.set('returnDate', criteria.returnDateFrom)
    }

    const res = await fetch(
      `https://${hostname}/v2/shopping/flight-offers?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Amadeus Flight Offers Search failed (${res.status}): ${text}`)
    }

    const json = (await res.json()) as { data?: AmadeusOffer[] }
    return (json.data ?? []) as unknown as RawFlightResult[]
  },

  normalizeResults(raw: RawFlightResult[]): NormalizedFlightOffer[] {
    const results: NormalizedFlightOffer[] = []

    for (const r of raw) {
      const offer = r as unknown as AmadeusOffer

      const outbound = offer.itineraries[0]
      if (!outbound?.segments.length) continue

      const firstSeg = outbound.segments[0]!
      const lastSeg = outbound.segments[outbound.segments.length - 1]!

      const durationMinutes = isoDurationToMinutes(outbound.duration)
      const stops = outbound.segments.length - 1

      // Return leg (round-trip)
      let returnDepartAt: string | null = null
      let returnArriveAt: string | null = null
      if (offer.itineraries.length > 1) {
        const inbound = offer.itineraries[1]!
        const retFirst = inbound.segments[0]
        const retLast = inbound.segments[inbound.segments.length - 1]
        if (retFirst && retLast) {
          returnDepartAt = retFirst.departure.at
          returnArriveAt = retLast.arrival.at
        }
      }

      const price = parseFloat(offer.price.grandTotal || offer.price.total)
      if (isNaN(price)) continue

      results.push({
        origin: firstSeg.departure.iataCode,
        destination: lastSeg.arrival.iataCode,
        departAt: firstSeg.departure.at,
        arriveAt: lastSeg.arrival.at,
        returnDepartAt,
        returnArriveAt,
        price,
        currency: offer.price.currency,
        stops,
        durationMinutes,
        isFullBusiness: checkFullBusiness(offer),
        airlineCodes: extractAirlineCodes(offer),
        rawData: r,
      })
    }

    return results
  },

  buildDeepLink(offer: NormalizedFlightOffer, _criteria: FlightSearchCriteria): string {
    // Google Flights deep link — works for all carriers, no API key needed
    const params = new URLSearchParams({
      from: offer.origin,
      to: offer.destination,
      date: offer.departAt.slice(0, 10),
      cabin: 'business',
      adults: '1',
    })
    if (offer.returnDepartAt) {
      params.set('return', offer.returnDepartAt.slice(0, 10))
    }
    return `https://www.google.com/travel/flights?${params.toString()}`
  },
}
