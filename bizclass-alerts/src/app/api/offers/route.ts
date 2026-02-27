import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alertId = request.nextUrl.searchParams.get('alertId')
  if (!alertId) {
    return NextResponse.json({ error: 'alertId query param is required' }, { status: 400 })
  }

  // Verify the alert belongs to this user
  const alert = await prisma.alert.findFirst({ where: { id: alertId, userId: user.id } })
  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  const offers = await prisma.flightOffer.findMany({
    where: { alertId },
    orderBy: { foundAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(offers)
}
