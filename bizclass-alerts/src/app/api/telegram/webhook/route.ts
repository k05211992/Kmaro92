import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBot } from '@/lib/telegram/bot'
import { sendWelcomeMessage } from '@/lib/telegram/notifications'
import { config } from '@/config'

/**
 * Telegram sends all bot updates to this endpoint.
 *
 * Register webhook (run once, after deploying to production):
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -d "url=https://<your-domain>/api/telegram/webhook" \
 *     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
 *
 * For local development use long-polling instead:
 *   npm run bot:poll
 */
export async function POST(request: NextRequest) {
  // Verify the request comes from Telegram using the shared secret
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (config.telegram.webhookSecret && secret !== config.telegram.webhookSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const message = update.message
  if (!message?.text || !message.chat?.id) {
    return NextResponse.json({ ok: true }) // ignore non-text updates
  }

  const text = message.text.trim()
  const chatId = message.chat.id
  const username = message.from?.username ?? null

  // /start <token> — link Telegram account
  if (text.startsWith('/start ')) {
    const token = text.slice('/start '.length).trim()
    await handleLinkAccount(chatId, username, token)
    return NextResponse.json({ ok: true })
  }

  // /start without token — already linked or just greeting
  if (text === '/start') {
    const existing = await prisma.user.findFirst({ where: { telegramChatId: BigInt(chatId) } })
    if (existing) {
      await sendWelcomeMessage(chatId, config.app.url)
    } else {
      await getBot().api.sendMessage(
        chatId,
        'Hi! To connect your account, go to your dashboard and click "Connect Telegram".',
      )
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}

async function handleLinkAccount(
  chatId: number,
  username: string | null,
  token: string,
): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      telegramLinkToken: token,
      telegramLinkExpiresAt: { gt: new Date() },
    },
  })

  if (!user) {
    await getBot().api.sendMessage(
      chatId,
      '❌ This link has expired or is invalid. Please generate a new one from your dashboard.',
    )
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: BigInt(chatId),
      telegramUsername: username,
      telegramConnectedAt: new Date(),
      telegramLinkToken: null,
      telegramLinkExpiresAt: null,
    },
  })

  await sendWelcomeMessage(chatId, config.app.url)
}

// Minimal Telegram Update type — only fields we use
interface TelegramUpdate {
  message?: {
    text?: string
    chat?: { id: number }
    from?: { username?: string }
  }
}
