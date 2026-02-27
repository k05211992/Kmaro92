import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { AlertForm } from '@/components/alerts/AlertForm'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { updateAlertAction } from '@/lib/actions/alerts'
import type { Alert } from '@/types/alert'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditAlertPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const raw = await prisma.alert.findFirst({ where: { id, userId: user.id } })
  if (!raw) notFound()

  // Serialize Prisma row to a plain Alert for client component
  const alert: Alert = {
    id: raw.id,
    userId: raw.userId,
    status: raw.status as Alert['status'],
    origin: raw.origin,
    destination: raw.destination,
    tripType: raw.tripType as Alert['tripType'],
    cabinClass: raw.cabinClass as 'business',
    departDateFrom: raw.departDateFrom.toISOString().slice(0, 10),
    departDateTo: raw.departDateTo?.toISOString().slice(0, 10) ?? null,
    returnDateFrom: raw.returnDateFrom?.toISOString().slice(0, 10) ?? null,
    returnDateTo: raw.returnDateTo?.toISOString().slice(0, 10) ?? null,
    maxPrice: Number(raw.maxPrice),
    currency: raw.currency as Alert['currency'],
    maxStops: raw.maxStops as Alert['maxStops'],
    maxDurationMinutes: raw.maxDurationMinutes,
    nearbyAirports: raw.nearbyAirports,
    notifFrequency: raw.notifFrequency as Alert['notifFrequency'],
    lastCheckedAt: raw.lastCheckedAt?.toISOString() ?? null,
    bestPriceSeen: raw.bestPriceSeen !== null ? Number(raw.bestPriceSeen) : null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  }

  // Bind alertId so updateAlertAction matches (prevState, formData) => ActionResult
  const boundUpdateAction = updateAlertAction.bind(null, id)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← My alerts
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">
          Edit alert · {alert.origin} → {alert.destination}
        </h1>
      </div>

      {alert.status === 'paused' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          ⏸ This alert is paused. Save changes to keep it paused, or resume it from the dashboard.
        </div>
      )}

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">Business class · {alert.currency}</p>
        </CardHeader>
        <CardBody>
          <AlertForm action={boundUpdateAction} initial={alert} isEdit />
        </CardBody>
      </Card>
    </div>
  )
}
