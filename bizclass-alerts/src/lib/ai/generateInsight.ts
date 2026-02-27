import OpenAI from 'openai'
import { config } from '@/config'
import type { NormalizedFlightOffer } from '@/lib/providers/types'
import type { NotifyReason } from '@/lib/jobs/worthyToNotify'

interface AlertContext {
  maxPrice: number
  bestPriceSeen: number | null
  origin: string
  destination: string
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * Generates a short factual sentence explaining why this deal is notable.
 * Returns null if OpenAI key is not configured or the call fails.
 * Never invents data — only uses the facts passed to it.
 */
export async function generateInsight(
  offer: NormalizedFlightOffer,
  alert: AlertContext,
  reason: NotifyReason,
): Promise<string | null> {
  if (!config.openai.apiKey) return null

  const client = new OpenAI({ apiKey: config.openai.apiKey })

  const savingsAmount =
    alert.maxPrice > offer.price
      ? `${Math.round(alert.maxPrice - offer.price)} ${offer.currency} below your budget`
      : null

  const dropPercent =
    alert.bestPriceSeen !== null
      ? Math.round(((alert.bestPriceSeen - offer.price) / alert.bestPriceSeen) * 100)
      : null

  const facts = [
    `Route: ${offer.origin} → ${offer.destination}`,
    `Price: ${offer.price} ${offer.currency}`,
    `User's max budget: ${alert.maxPrice} ${offer.currency}`,
    savingsAmount ? `Savings vs budget: ${savingsAmount}` : null,
    alert.bestPriceSeen ? `Previously best seen price: ${alert.bestPriceSeen} ${offer.currency}` : null,
    dropPercent !== null ? `Price drop from best seen: ${dropPercent}%` : null,
    `Stops: ${offer.stops === 0 ? 'non-stop' : offer.stops}`,
    `Duration: ${formatDuration(offer.durationMinutes)}`,
    `Cabin: ${offer.isFullBusiness ? 'Full Business Class' : 'Mixed Cabin (some segments may be economy)'}`,
    `Trigger: ${reason === 'below_threshold' ? 'price is within user budget' : 'significant price drop detected'}`,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = [
    'Based ONLY on the facts below, write ONE short sentence (max 20 words) explaining why this business class flight is a good deal.',
    'Be specific and factual. Do NOT invent data, make predictions, or add opinions.',
    '',
    'Facts:',
    facts,
  ].join('\n')

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 60,
    temperature: 0.2,
  })

  return response.choices[0]?.message?.content?.trim() ?? null
}
