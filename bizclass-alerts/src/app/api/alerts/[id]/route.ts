import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { alertUpdateSchema } from '@/lib/validations/alert'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function getAlertOrFail(id: string, userId: string) {
  const alert = await prisma.alert.findFirst({
    where: { id, userId },
  })
  return alert
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alert = await getAlertOrFail(id, user.id)
  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  return NextResponse.json(alert)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alert = await getAlertOrFail(id, user.id)
  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = alertUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const d = parsed.data

  const updated = await prisma.alert.update({
    where: { id },
    data: {
      ...(d.origin !== undefined && { origin: d.origin }),
      ...(d.destination !== undefined && { destination: d.destination }),
      ...(d.tripType !== undefined && { tripType: d.tripType }),
      ...(d.departDateFrom !== undefined && { departDateFrom: new Date(d.departDateFrom) }),
      ...(d.departDateTo !== undefined && {
        departDateTo: d.departDateTo ? new Date(d.departDateTo) : null,
      }),
      ...(d.returnDateFrom !== undefined && {
        returnDateFrom: d.returnDateFrom ? new Date(d.returnDateFrom) : null,
      }),
      ...(d.returnDateTo !== undefined && {
        returnDateTo: d.returnDateTo ? new Date(d.returnDateTo) : null,
      }),
      ...(d.maxPrice !== undefined && { maxPrice: d.maxPrice }),
      ...(d.currency !== undefined && { currency: d.currency }),
      ...(d.maxStops !== undefined && { maxStops: d.maxStops }),
      ...(d.maxDurationMinutes !== undefined && { maxDurationMinutes: d.maxDurationMinutes }),
      ...(d.nearbyAirports !== undefined && { nearbyAirports: d.nearbyAirports }),
      ...(d.notifFrequency !== undefined && { notifFrequency: d.notifFrequency }),
      ...(d.status !== undefined && { status: d.status }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alert = await getAlertOrFail(id, user.id)
  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  // Soft-delete: archive instead of hard delete to preserve offer history
  await prisma.alert.update({
    where: { id },
    data: { status: 'archived' },
  })

  return new NextResponse(null, { status: 204 })
}
