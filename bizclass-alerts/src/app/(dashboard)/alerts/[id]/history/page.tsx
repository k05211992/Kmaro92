import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { OfferCard } from '@/components/offers/OfferCard'
import type { FlightOffer } from '@/types/offer'

interface PageProps {
  params: Promise<{ id: string }>
}

function toOfferDomain(raw: {
  id: string
  alertId: string
  provider: string
  origin: string
  destination: string
  departAt: Date
  arriveAt: Date
  returnDepartAt: Date | null
  returnArriveAt: Date | null
  price: { toString(): string }
  currency: string
  stops: number
  durationMinutes: number
  isFullBusiness: boolean
  airlineCodes: string[]
  deepLink: string
  rawData: unknown
  hashForDedup: string
  foundAt: Date
}): FlightOffer {
  return {
    ...raw,
    price: parseFloat(raw.price.toString()),
    rawData: raw.rawData as Record<string, unknown>,
    departAt: raw.departAt.toISOString(),
    arriveAt: raw.arriveAt.toISOString(),
    returnDepartAt: raw.returnDepartAt?.toISOString() ?? null,
    returnArriveAt: raw.returnArriveAt?.toISOString() ?? null,
    foundAt: raw.foundAt.toISOString(),
  }
}

export default async function OfferHistoryPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const alert = await prisma.alert.findFirst({ where: { id, userId: user.id } })
  if (!alert) notFound()

  const rawOffers = await prisma.flightOffer.findMany({
    where: { alertId: id },
    orderBy: { foundAt: 'desc' },
    take: 50,
  })

  const offers: FlightOffer[] = rawOffers.map(toOfferDomain)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← My alerts
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">
          {alert.origin} → {alert.destination} · Offers found
        </h1>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg font-medium text-gray-500">No offers found yet</p>
          <p className="text-sm mt-1">
            We haven&apos;t checked this alert yet, or no worthy deals were found.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {offers.length} offer{offers.length !== 1 ? 's' : ''} found
          </p>
          <div className="space-y-4">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
