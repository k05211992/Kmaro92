import { prisma } from '@/lib/db'
import { getFlightProvider } from '@/lib/providers/factory'
import { buildDedupHash } from '@/lib/dedup'
import { worthyToNotify } from './worthyToNotify'
import type { FlightSearchCriteria } from '@/lib/providers/types'

// ── Structured JSON logger ────────────────────────────────────────────────────

type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, event, ...data }
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CheckAlertsResult {
  /** Total alerts processed in this run */
  checked: number
  /** Offers deemed worthy (pending notification, not yet sent) */
  notified: number
  /** Alerts that threw an error during processing */
  errors: number
  /** Offers skipped because the dedup hash already existed */
  skipped: number
}

// ── Main job ──────────────────────────────────────────────────────────────────

export async function checkAlerts(): Promise<CheckAlertsResult> {
  const stats: CheckAlertsResult = { checked: 0, notified: 0, errors: 0, skipped: 0 }
  const provider = getFlightProvider()

  log('info', 'cron.start', { provider: provider.name })

  // Oldest-first so every alert eventually gets a turn even if the run is capped
  const alerts = await prisma.alert.findMany({
    where: { status: 'active' },
    include: { user: true },
    orderBy: { lastCheckedAt: { sort: 'asc', nulls: 'first' } },
    take: 50,
  })

  log('info', 'cron.alerts_loaded', { count: alerts.length })

  for (const alert of alerts) {
    stats.checked++
    const ctx = { alertId: alert.id, route: `${alert.origin}-${alert.destination}` }

    // Open a search_run record so we always have an audit trail, even on error
    const searchRun = await prisma.searchRun.create({
      data: { alertId: alert.id, provider: provider.name, status: 'ok' },
    })

    const runStart = Date.now()

    try {
      const criteria: FlightSearchCriteria = {
        origin: alert.origin,
        destination: alert.destination,
        tripType: alert.tripType as 'one_way' | 'round_trip',
        departDateFrom: alert.departDateFrom.toISOString().slice(0, 10),
        departDateTo: alert.departDateTo?.toISOString().slice(0, 10) ?? null,
        returnDateFrom: alert.returnDateFrom?.toISOString().slice(0, 10) ?? null,
        returnDateTo: alert.returnDateTo?.toISOString().slice(0, 10) ?? null,
        cabinClass: 'business',
        maxStops: alert.maxStops,
        maxDurationMinutes: alert.maxDurationMinutes,
        nearbyAirports: alert.nearbyAirports,
        currency: alert.currency,
      }

      const raw = await provider.searchFlights(criteria)
      const offers = provider.normalizeResults(raw)

      // Hard-filter: drop offers that violate the user's constraints
      const filtered = offers.filter((o) => {
        if (o.stops > alert.maxStops) return false
        if (alert.maxDurationMinutes && o.durationMinutes > alert.maxDurationMinutes) return false
        return true
      })

      log('info', 'cron.search_done', {
        ...ctx,
        raw: raw.length,
        afterFilter: filtered.length,
        dropped: raw.length - filtered.length,
      })

      let worthyCount = 0

      for (const offer of filtered) {
        // ── Deduplication ────────────────────────────────────────────────────
        const hashForDedup = buildDedupHash(alert.id, offer)
        const existing = await prisma.flightOffer.findUnique({ where: { hashForDedup } })
        if (existing) {
          log('info', 'cron.offer_dedup_skip', { ...ctx, hash: hashForDedup.slice(0, 12) })
          stats.skipped++
          continue
        }

        // ── Notify decision ──────────────────────────────────────────────────
        const decision = worthyToNotify(offer, {
          maxPrice: Number(alert.maxPrice),
          bestPriceSeen: alert.bestPriceSeen !== null ? Number(alert.bestPriceSeen) : null,
        })

        const deepLink = provider.buildDeepLink(offer, criteria)

        // ── Persist offer (always, for history page) ─────────────────────────
        const savedOffer = await prisma.flightOffer.create({
          data: {
            alertId: alert.id,
            searchRunId: searchRun.id,
            provider: provider.name,
            origin: offer.origin,
            destination: offer.destination,
            departAt: new Date(offer.departAt),
            arriveAt: new Date(offer.arriveAt),
            returnDepartAt: offer.returnDepartAt ? new Date(offer.returnDepartAt) : null,
            returnArriveAt: offer.returnArriveAt ? new Date(offer.returnArriveAt) : null,
            price: offer.price,
            currency: offer.currency,
            stops: offer.stops,
            durationMinutes: offer.durationMinutes,
            isFullBusiness: offer.isFullBusiness,
            airlineCodes: offer.airlineCodes,
            deepLink,
            rawData: offer.rawData,
            hashForDedup,
          },
        })

        // ── Update best price seen ───────────────────────────────────────────
        if (alert.bestPriceSeen === null || offer.price < Number(alert.bestPriceSeen)) {
          await prisma.alert.update({
            where: { id: alert.id },
            data: { bestPriceSeen: offer.price },
          })
          // Keep local reference consistent within this loop iteration
          alert.bestPriceSeen = savedOffer.price
          log('info', 'cron.best_price_updated', {
            ...ctx,
            price: offer.price,
            currency: offer.currency,
          })
        }

        if (!decision.shouldNotify) continue

        // ── Worthy offer found ───────────────────────────────────────────────
        worthyCount++
        log('info', 'cron.worthy_offer', {
          ...ctx,
          offerId: savedOffer.id,
          price: offer.price,
          currency: offer.currency,
          reason: decision.reason,
          stops: offer.stops,
          airlines: offer.airlineCodes.join('+'),
          telegramReady: !!alert.user.telegramChatId,
        })

        // Step 5 — queue as 'pending'; Step 6 will handle actual Telegram dispatch
        await prisma.notification
          .create({
            data: {
              alertId: alert.id,
              offerId: savedOffer.id,
              userId: alert.userId,
              channel: 'telegram',
              reason: decision.reason,
              status: 'pending',
            },
          })
          .catch((err: unknown) =>
            log('warn', 'cron.notification_record_failed', {
              ...ctx,
              offerId: savedOffer.id,
              error: err instanceof Error ? err.message : String(err),
            }),
          )

        stats.notified++
      }

      // ── Close search_run with counters ───────────────────────────────────────
      await prisma.searchRun.update({
        where: { id: searchRun.id },
        data: {
          durationMs: Date.now() - runStart,
          rawResultsCount: raw.length,
          filteredCount: filtered.length,
          worthyCount,
          status: filtered.length === 0 ? 'empty' : 'ok',
        },
      })

      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastCheckedAt: new Date() },
      })

      log('info', 'cron.alert_done', {
        ...ctx,
        durationMs: Date.now() - runStart,
        worthyCount,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      log('error', 'cron.alert_error', { ...ctx, error: errorMessage })

      await prisma.searchRun
        .update({
          where: { id: searchRun.id },
          data: {
            durationMs: Date.now() - runStart,
            status: 'error',
            errorMessage,
          },
        })
        .catch(() => undefined) // don't mask the original error

      stats.errors++
    }
  }

  log('info', 'cron.done', { ...stats })
  return stats
}
