import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { AlertList } from '@/components/alerts/AlertList'
import { Button } from '@/components/ui/Button'
import { config } from '@/config'
import type { Alert } from '@/types/alert'

/**
 * Server Component — fetches data on the server.
 * Revalidated automatically when Server Actions call revalidatePath('/dashboard').
 */
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null // layout redirects; guard is just for TS

  const rawAlerts = await prisma.alert.findMany({
    where: { userId: user.id, status: { not: 'archived' } },
    orderBy: { createdAt: 'desc' },
  })

  // Serialize Prisma Decimal fields to plain numbers for client components
  const alerts: Alert[] = rawAlerts.map((a) => ({
    id: a.id,
    userId: a.userId,
    status: a.status as Alert['status'],
    origin: a.origin,
    destination: a.destination,
    tripType: a.tripType as Alert['tripType'],
    cabinClass: a.cabinClass as 'business',
    departDateFrom: a.departDateFrom.toISOString().slice(0, 10),
    departDateTo: a.departDateTo?.toISOString().slice(0, 10) ?? null,
    returnDateFrom: a.returnDateFrom?.toISOString().slice(0, 10) ?? null,
    returnDateTo: a.returnDateTo?.toISOString().slice(0, 10) ?? null,
    maxPrice: Number(a.maxPrice),
    currency: a.currency as Alert['currency'],
    maxStops: a.maxStops as Alert['maxStops'],
    maxDurationMinutes: a.maxDurationMinutes,
    nearbyAirports: a.nearbyAirports,
    notifFrequency: a.notifFrequency as Alert['notifFrequency'],
    lastCheckedAt: a.lastCheckedAt?.toISOString() ?? null,
    bestPriceSeen: a.bestPriceSeen !== null ? Number(a.bestPriceSeen) : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  const atLimit = alerts.length >= config.app.maxAlertsPerUser

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {alerts.length} of {config.app.maxAlertsPerUser} used
          </p>
        </div>

        {atLimit ? (
          <div className="text-right">
            <span className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700 font-medium">
              Limit reached ({config.app.maxAlertsPerUser}/{config.app.maxAlertsPerUser})
            </span>
            <p className="mt-0.5 text-xs text-gray-400">Pause or delete an alert to add more</p>
          </div>
        ) : (
          <Link href="/alerts/new">
            <Button size="sm">+ New alert</Button>
          </Link>
        )}
      </div>

      <AlertList alerts={alerts} />
    </div>
  )
}
