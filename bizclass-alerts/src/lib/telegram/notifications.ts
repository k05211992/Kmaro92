import { getBot } from './bot'
import type { NotifyReason } from '@/lib/jobs/worthyToNotify'

interface AlertSummary {
  origin: string
  destination: string
  tripType: 'one_way' | 'round_trip'
  maxPrice: number
  currency: string
}

interface OfferSummary {
  price: number
  currency: string
  departAt: Date
  arriveAt: Date
  returnDepartAt: Date | null
  stops: number
  durationMinutes: number
  isFullBusiness: boolean
}

export interface SendOfferNotificationParams {
  chatId: number
  alert: AlertSummary
  offer: OfferSummary
  reason: NotifyReason
  aiInsight: string | null
  deepLink: string
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Escapes all MarkdownV2 reserved characters */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
}

export async function sendOfferNotification(params: SendOfferNotificationParams): Promise<void> {
  const { chatId, alert, offer, reason, aiInsight, deepLink } = params

  const reasonLine =
    reason === 'below_threshold'
      ? `✅ *Below your budget* \\(${escapeMarkdown(String(alert.maxPrice))} ${alert.currency}\\)`
      : `📉 *Significant price drop detected*`

  const cabinLine = offer.isFullBusiness
    ? '🟢 *Full Business Class*'
    : '🟡 *Mixed Cabin* \\(some segments may not be business\\)'

  const stopsText =
    offer.stops === 0 ? 'Non\\-stop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`

  const lines = [
    `✈️ *Deal alert\\!*`,
    ``,
    `📍 *Route:* ${escapeMarkdown(alert.origin)} → ${escapeMarkdown(alert.destination)}`,
    `📅 *Depart:* ${escapeMarkdown(formatDate(offer.departAt))}`,
    ...(offer.returnDepartAt
      ? [`↩️ *Return:* ${escapeMarkdown(formatDate(offer.returnDepartAt))}`]
      : []),
    ``,
    `💰 *Price:* ${escapeMarkdown(String(offer.price))} ${escapeMarkdown(offer.currency)}`,
    `🛑 *Stops:* ${stopsText}`,
    `⏱ *Duration:* ${escapeMarkdown(formatDuration(offer.durationMinutes))}`,
    cabinLine,
    ``,
    reasonLine,
    ...(aiInsight ? [`💡 ${escapeMarkdown(aiInsight)}`] : []),
    ``,
    `⚠️ _Prices and availability may change\\. Check before booking\\._`,
  ]

  await getBot().api.sendMessage(chatId, lines.join('\n'), {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [[{ text: '🔗 View offer', url: deepLink }]],
    },
  })
}

export async function sendWelcomeMessage(chatId: number, appUrl: string): Promise<void> {
  const text = [
    `👋 *Welcome to BizClass Alerts\\!*`,
    ``,
    `Your Telegram account is now connected\\.`,
    `You'll receive notifications here when we find great business class deals matching your alerts\\.`,
    ``,
    `[Go to your dashboard](${escapeMarkdown(appUrl)}/dashboard)`,
  ].join('\n')

  await getBot().api.sendMessage(chatId, text, { parse_mode: 'MarkdownV2' })
}
