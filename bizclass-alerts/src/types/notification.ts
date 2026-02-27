export type NotifChannel = 'telegram' | 'email'
export type NotifReason = 'below_threshold' | 'price_drop'
export type NotifStatus = 'pending' | 'sent' | 'failed'

export interface Notification {
  id: string
  alertId: string
  offerId: string
  userId: string
  channel: NotifChannel
  reason: NotifReason
  aiInsight: string | null
  status: NotifStatus
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
}
