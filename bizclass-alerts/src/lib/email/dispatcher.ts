import { prisma } from '@/lib/db'
import { sendOfferEmail } from './sendOfferEmail'
import type { DispatchResult } from '@/lib/telegram/dispatcher'

type LogLevel = 'info' | 'warn' | 'error'
function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, event, ...data }
  if (level === 'error') console.error(JSON.stringify(entry))
  else if (level === 'warn') console.warn(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

/**
 * Sends all pending email notifications.
 *
 * Email notifications are created when a worthy offer is found for a user who
 * has no Telegram account linked. Called at the end of each cron run.
 */
export async function dispatchPendingEmailNotifications(): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, skipped: 0 }

  const pending = await prisma.notification.findMany({
    where: { status: 'pending', channel: 'email' },
    include: {
      alert: { include: { user: true } },
      offer: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })

  log('info', 'email_dispatcher.start', { pending: pending.length })

  for (const notif of pending) {
    const ctx = { notifId: notif.id, alertId: notif.alertId }
    const email = notif.alert.user.email

    try {
      await sendOfferEmail({
        to: email,
        alert: {
          origin: notif.alert.origin,
          destination: notif.alert.destination,
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
          airlineCodes: JSON.parse(notif.offer.airlineCodes) as string[],
        },
        reason: notif.reason as 'below_threshold' | 'price_drop',
        aiInsight: notif.aiInsight,
        deepLink: notif.offer.deepLink,
      })

      await prisma.notification.update({
        where: { id: notif.id },
        data: { status: 'sent', sentAt: new Date() },
      })

      log('info', 'email_dispatcher.sent', { ...ctx, to: email })
      result.sent++
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      log('error', 'email_dispatcher.send_failed', { ...ctx, to: email, error: errorMessage })

      await prisma.notification
        .update({
          where: { id: notif.id },
          data: { status: 'failed', errorMessage },
        })
        .catch(() => undefined)

      result.failed++
    }
  }

  log('info', 'email_dispatcher.done', { ...result })
  return result
}
