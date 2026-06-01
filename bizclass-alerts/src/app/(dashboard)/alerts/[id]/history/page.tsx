import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { OfferCard } from '@/components/offers/OfferCard'
import { PriceDisclaimer } from '@/components/ui/PriceDisclaimer'
import { checkAlertNowAction } from '@/lib/actions/alerts'
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
  price: number
  currency: string
  stops: number
  durationMinutes: number
  isFullBusiness: boolean
  airlineCodes: string        // stored as JSON string in SQLite
  deepLink: string
  rawData: string             // stored as JSON string in SQLite
  hashForDedup: string
  foundAt: Date
}): FlightOffer {
  return {
    ...raw,
    price: raw.price,
    airlineCodes: JSON.parse(raw.airlineCodes) as string[],
    rawData: JSON.parse(raw.rawData) as Record<string, unknown>,
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

  const checkNow = checkAlertNowAction.bind(null, id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← My alerts
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">
            {alert.origin} → {alert.destination} · Offers found
          </h1>
        </div>

        <form action={checkNow}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
          >
            🔄 Check now
          </button>
        </form>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg font-medium text-gray-500">No offers found yet</p>
          <p className="text-sm mt-1 mb-6">
            We haven&apos;t checked this alert yet, or no worthy deals were found.
          </p>
          <form action={checkNow}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
            >
              🔄 Search now
            </button>
          </form>
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
          <div className="mt-6">
            <PriceDisclaimer />
          </div>
        </>
      )}
    </div>
  )
}
