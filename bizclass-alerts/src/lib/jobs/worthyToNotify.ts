import { config } from '@/config'
import type { NormalizedFlightOffer } from '@/lib/providers/types'

export type NotifyReason = 'below_threshold' | 'price_drop'

export interface NotifyDecision {
  shouldNotify: true
  reason: NotifyReason
} | {
  shouldNotify: false
}

interface AlertPricingContext {
  maxPrice: number
  bestPriceSeen: number | null
}

/**
 * Determines whether an offer is worth notifying the user about.
 *
 * Rule 1 — below threshold:  price <= alert.maxPrice
 * Rule 2 — price drop:       price dropped >= PRICE_DROP_THRESHOLD_PERCENT vs best seen
 *
 * Both rules can independently trigger. Rule 1 is checked first.
 */
export function worthyToNotify(
  offer: NormalizedFlightOffer,
  alert: AlertPricingContext,
): NotifyDecision {
  if (offer.price <= alert.maxPrice) {
    return { shouldNotify: true, reason: 'below_threshold' }
  }

  if (alert.bestPriceSeen !== null) {
    const dropPercent = ((alert.bestPriceSeen - offer.price) / alert.bestPriceSeen) * 100
    if (dropPercent >= config.pricing.priceDropThresholdPercent) {
      return { shouldNotify: true, reason: 'price_drop' }
    }
  }

  return { shouldNotify: false }
}
