import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { TelegramConnectCard } from '@/components/profile/TelegramConnectCard'

/**
 * Server Component — reads Telegram connection state from DB on every request,
 * so the page always shows the real current status after the user links their account.
 */
export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Account</h2>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-600">
            Signed in as <strong>{user.email}</strong>
          </p>
        </CardBody>
      </Card>

      <TelegramConnectCard
        isConnected={!!dbUser?.telegramChatId}
        telegramUsername={dbUser?.telegramUsername ?? null}
      />
    </div>
  )
}
