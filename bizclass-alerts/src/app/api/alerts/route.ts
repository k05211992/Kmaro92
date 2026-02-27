import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { alertCreateSchema } from '@/lib/validations/alert'
import { config } from '@/config'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: user.id, status: { not: 'archived' } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(alerts)
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeCount = await prisma.alert.count({
    where: { userId: user.id, status: { in: ['active', 'paused'] } },
  })

  if (activeCount >= config.app.maxAlertsPerUser) {
    return NextResponse.json(
      { error: `Maximum of ${config.app.maxAlertsPerUser} active alerts allowed per account` },
      { status: 422 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = alertCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const d = parsed.data

  // Upsert user record (created on first alert)
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email! },
  })

  const alert = await prisma.alert.create({
    data: {
      userId: user.id,
      origin: d.origin,
      destination: d.destination,
      tripType: d.tripType,
      departDateFrom: new Date(d.departDateFrom),
      departDateTo: d.departDateTo ? new Date(d.departDateTo) : null,
      returnDateFrom: d.returnDateFrom ? new Date(d.returnDateFrom) : null,
      returnDateTo: d.returnDateTo ? new Date(d.returnDateTo) : null,
      maxPrice: d.maxPrice,
      currency: d.currency,
      maxStops: d.maxStops,
      maxDurationMinutes: d.maxDurationMinutes ?? null,
      nearbyAirports: d.nearbyAirports,
      notifFrequency: d.notifFrequency,
    },
  })

  return NextResponse.json(alert, { status: 201 })
}
