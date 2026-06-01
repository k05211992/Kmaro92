interface PriceDisclaimerProps {
  /** compact=true → single grey line; compact=false → amber box with heading */
  compact?: boolean
}

/**
 * Reminds users that prices are point-in-time snapshots and may have changed.
 * Must appear on any page that displays flight prices or booking links.
 */
export function PriceDisclaimer({ compact = false }: PriceDisclaimerProps) {
  if (compact) {
    return (
      <p className="text-xs text-gray-400">
        ⚠️ Prices shown were found at the time of the search and may have changed. Always verify
        before booking.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-800">⚠️ Price disclaimer</p>
      <p className="mt-0.5 text-xs text-amber-700">
        Prices and availability shown are from the time of discovery and may have changed
        significantly. This service is for informational purposes only — always verify current
        prices and seat availability on the airline or booking platform before purchasing.
      </p>
    </div>
  )
}
