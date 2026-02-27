'use client'

import Link from 'next/link'
import { useTransition, useState, useOptimistic } from 'react'
import { AlertStatusBadge } from './AlertStatusBadge'
import { Button } from '@/components/ui/Button'
import { patchAlertStatusAction } from '@/lib/actions/alerts'
import type { Alert, AlertStatus } from '@/types/alert'

interface AlertCardProps {
  alert: Alert
}

type LoadingButton = 'toggle' | 'delete' | null

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function AlertCard({ alert }: AlertCardProps) {
  const [, startTransition] = useTransition()
  const [activeButton, setActiveButton] = useState<LoadingButton>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Optimistic status: updates instantly in the UI while the server action runs
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(alert.status)

  function doStatusChange(nextStatus: AlertStatus, button: LoadingButton) {
    setActionError(null)
    setActiveButton(button)
    startTransition(async () => {
      setOptimisticStatus(nextStatus)
      const result = await patchAlertStatusAction(alert.id, nextStatus)
      if (!result.success) {
        setOptimisticStatus(alert.status) // roll back
        setActionError(result.error)
      }
      setActiveButton(null)
    })
  }

  function handleToggle() {
    const next: AlertStatus = optimisticStatus === 'active' ? 'paused' : 'active'
    doStatusChange(next, 'toggle')
  }

  function handleDelete() {
    if (!confirm('Delete this alert? Your offer history will be preserved.')) return
    doStatusChange('archived', 'delete')
  }

  const departRange = alert.departDateTo
    ? `${formatDate(alert.departDateFrom)} – ${formatDate(alert.departDateTo)}`
    : formatDate(alert.departDateFrom)

  const isArchived = optimisticStatus === 'archived'

  return (
    <article
      className={[
        'rounded-xl border bg-white p-4 shadow-sm transition-opacity',
        isArchived ? 'opacity-60' : 'border-gray-200',
        optimisticStatus === 'paused' ? 'border-amber-200 bg-amber-50/30' : '',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {alert.origin} → {alert.destination}
            </h3>
            <AlertStatusBadge status={optimisticStatus} />
            {alert.tripType === 'round_trip' && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Round trip
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">📅 {departRange}</p>

          {alert.returnDateFrom && (
            <p className="text-sm text-gray-500">
              ↩️ Return from {formatDate(alert.returnDateFrom)}
            </p>
          )}
        </div>

        {/* Best price chip */}
        {alert.bestPriceSeen !== null && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-400">Best seen</p>
            <p className="text-base font-bold text-green-700">
              {alert.bestPriceSeen} {alert.currency}
            </p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        <span>💰 Budget: {alert.maxPrice} {alert.currency}</span>
        <span>
          🛑 {alert.maxStops === 0
            ? 'Non-stop only'
            : `Up to ${alert.maxStops} stop${alert.maxStops > 1 ? 's' : ''}`}
        </span>
        {alert.maxDurationMinutes && (
          <span>
            ⏱ Max {Math.floor(alert.maxDurationMinutes / 60)}h
            {alert.maxDurationMinutes % 60 > 0 ? ` ${alert.maxDurationMinutes % 60}m` : ''}
          </span>
        )}
        <span>
          🔔 {alert.notifFrequency === 'instant' ? 'Instant alerts' : 'Daily digest'}
        </span>
      </div>

      {/* Last checked */}
      {alert.lastCheckedAt && (
        <p className="mt-1 text-xs text-gray-400">
          Last checked {new Date(alert.lastCheckedAt).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      {/* Inline error from failed action */}
      {actionError && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          ⚠️ {actionError}
        </p>
      )}

      {/* Action bar */}
      <div className="mt-4 flex items-center gap-2 flex-wrap border-t border-gray-100 pt-3">
        <Link href={`/alerts/${alert.id}/history`}>
          <Button variant="secondary" size="sm">
            View offers
          </Button>
        </Link>

        {!isArchived && (
          <Link href={`/alerts/${alert.id}`}>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </Link>
        )}

        {!isArchived && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            loading={activeButton === 'toggle'}
            disabled={activeButton !== null}
          >
            {optimisticStatus === 'active' ? 'Pause' : 'Resume'}
          </Button>
        )}

        {!isArchived && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            loading={activeButton === 'delete'}
            disabled={activeButton !== null}
            className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Delete
          </Button>
        )}
      </div>
    </article>
  )
}
