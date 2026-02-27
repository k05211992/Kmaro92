import { Badge } from '@/components/ui/Badge'
import type { AlertStatus } from '@/types/alert'

const statusConfig: Record<AlertStatus, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  active: { label: 'Active', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  archived: { label: 'Archived', variant: 'default' },
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const { label, variant } = statusConfig[status]
  return <Badge variant={variant}>{label}</Badge>
}
