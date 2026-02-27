import { prisma } from '@/lib/db'
import { sendOfferNotification } from './notifications'
import type { NotifyReason } from '@/lib/jobs/worthyToNotify'

type LogLevel = 'info' | 'warn' | 'error'
function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, event, ...data }
  if (level === 'error') console.error(JSON.stringify(entry))
  else if (level === 'warn') console.warn(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

export interface DispatchResult {
  sent: number
  failed: number
  skipped: number
}

/**
 * Reads all `pending` Telegram notifications from the DB and attempts to send them.
 *
 * - On success: marks notification as `sent`.
 * - On failure: marks notification as `failed` with the error message.
 * - If the user has no Telegram account linked yet: leaves as `pending`
 *   so it will be retried the next time the cron runs (or when the user links).
 *
 * Called at the end of each cron run so instant alerts go out immediately.
 */
export async function dispatchPendingNotifications(): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, skipped: 0 }

  const pending = await prisma.notification.findMany({
    where: { status: 'pending', channel: 'telegram' },
    include: {
      alert: { include: { user: true } },
      offer: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })

  log('info', 'dispatcher.start', { pending: pending.length })

  for (const notif of pending) {
    const chatId = notif.alert.user.telegramChatId
    const ctx = { notifId: notif.id, alertId: notif.alertId }

    if (!chatId) {
      // User hasn't connected Telegram yet — leave as pending for next run
      log('info', 'dispatcher.no_chat_id', ctx)
      result.skipped++
      continue
    }

    try {
      await sendOfferNotification({
        chatId: Number(chatId),
        alert: {
          origin: notif.alert.origin,
          destination: notif.alert.destination,
          tripType: notif.alert.tripType as 'one_way' | 'round_trip',
          maxPrice: Number(notif.alert.maxPrice),
          currency: notif.alert.currency,
        },
        offer: {
          price: Number(notif.offer.price),
          currency: notif.offer.currency,
          departAt: notif.offer.departAt,
          arriveAt: notif.offer.arriveAt,
          returnDepartAt: notif.offer.returnDepartAt,
          stops: notif.offer.stops,
          durationMinutes: notif.offer.durationMinutes,
          isFullBusiness: notif.offer.isFullBusiness,
        },
        reason: notif.reason as NotifyReason,
        aiInsight: notif.aiInsight,
        deepLink: notif.offer.deepLink,
      })

      await prisma.notification.update({
        where: { id: notif.id },
        data: { status: 'sent', sentAt: new Date() },
      })

      log('info', 'dispatcher.sent', { ...ctx, chatId: String(chatId) })
      result.sent++
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      log('error', 'dispatcher.send_failed', { ...ctx, error: errorMessage })

      await prisma.notification
        .update({
          where: { id: notif.id },
          data: { status: 'failed', errorMessage },
        })
        .catch(() => undefined)

      result.failed++
    }
  }

  log('info', 'dispatcher.done', { ...result })
  return result
}
