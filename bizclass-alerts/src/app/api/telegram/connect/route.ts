import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'
import { config } from '@/config'

// Generates a short-lived token the user sends to the bot to link their account
export async function POST() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Upsert user record in case it doesn't exist yet
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email! },
  })

  const token = randomBytes(12).toString('hex') // 24 hex chars
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramLinkToken: token,
      telegramLinkExpiresAt: expiresAt,
    },
  })

  // The user sends `/start <token>` to the bot
  const botUsername = config.telegram.botUsername || 'yourbot'

  return NextResponse.json({
    token,
    expiresAt: expiresAt.toISOString(),
    deepLink: `https://t.me/${botUsername}?start=${token}`,
    instruction: `Open the link above or send /start ${token} to @${botUsername}`,
  })
}
