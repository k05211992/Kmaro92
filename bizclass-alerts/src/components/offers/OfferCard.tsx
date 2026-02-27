import { Badge } from '@/components/ui/Badge'
import type { FlightOffer } from '@/types/offer'

interface OfferCardProps {
  offer: FlightOffer
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OfferCard({ offer }: OfferCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* Route + price */}
        <div>
          <p className="text-base font-semibold text-gray-900">
            {offer.origin} → {offer.destination}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Found {new Date(offer.foundAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-brand-600">
            {Number(offer.price).toFixed(0)} {offer.currency}
          </p>
          <p className="text-xs text-gray-400">per person</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
        <span>📅 {formatDatetime(offer.departAt)}</span>
        <span>⏱ {formatDuration(offer.durationMinutes)}</span>
        <span>🛑 {offer.stops === 0 ? 'Non-stop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}</span>
      </div>

      {offer.returnDepartAt && (
        <p className="mt-1 text-sm text-gray-600">↩️ Return: {formatDatetime(offer.returnDepartAt)}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {offer.isFullBusiness ? (
            <Badge variant="success">🟢 Full Business</Badge>
          ) : (
            <Badge variant="warning">🟡 Mixed Cabin</Badge>
          )}
          {offer.airlineCodes.map((code) => (
            <Badge key={code} variant="default">{code}</Badge>
          ))}
        </div>

        <a
          href={offer.deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          View offer ↗
        </a>
      </div>

      {!offer.isFullBusiness && (
        <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
          ⚠️ Mixed cabin — some flight segments may not be in business class
        </p>
      )}
    </div>
  )
}
