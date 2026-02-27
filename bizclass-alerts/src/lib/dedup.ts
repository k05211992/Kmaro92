import { createHash } from 'crypto'
import type { NormalizedFlightOffer } from '@/lib/providers/types'

/**
 * Builds a stable deduplication hash for a flight offer.
 *
 * The hash identifies the "same" offer across cron runs so we never
 * send duplicate notifications for the same itinerary.
 *
 * Keyed on:
 *   alertId | origin | destination | departAt (minute precision)
 *   | returnDepartAt (or 'one_way') | price (rounded) | currency
 *   | stops | cabin type
 *
 * We intentionally exclude provider-internal IDs — they can change
 * between API calls for the exact same flight.
 *
 * Stored in DB as column `hash_for_dedup` on flight_offers.
 */
export function buildDedupHash(alertId: string, offer: NormalizedFlightOffer): string {
  const parts = [
    alertId,
    offer.origin,
    offer.destination,
    offer.departAt.slice(0, 16),                       // YYYY-MM-DDTHH:MM
    offer.returnDepartAt?.slice(0, 16) ?? 'one_way',
    Math.round(offer.price).toString(),
    offer.currency,
    offer.stops.toString(),
    offer.isFullBusiness ? 'full' : 'mixed',
  ]

  return createHash('sha256').update(parts.join('|')).digest('hex')
}
