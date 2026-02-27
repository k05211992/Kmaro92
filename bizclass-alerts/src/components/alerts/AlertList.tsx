'use client'

import Link from 'next/link'
import { AlertCard } from './AlertCard'
import { Button } from '@/components/ui/Button'
import type { Alert } from '@/types/alert'

interface AlertListProps {
  alerts: Alert[]
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🔔</div>
        <h2 className="text-lg font-semibold text-gray-700">No alerts yet</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-xs">
          Create your first alert and we'll notify you via Telegram when a great business class
          deal is found.
        </p>
        <Link href="/alerts/new" className="mt-6">
          <Button>Create your first alert</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  )
}
