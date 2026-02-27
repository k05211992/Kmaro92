#!/usr/bin/env tsx
/**
 * Telegram bot long-poll runner for local development.
 *
 * - No webhook registration needed — grammY polls Telegram directly.
 * - Handles the same /start flow as the production webhook handler.
 * - Stop with Ctrl+C.
 *
 * Usage:
 *   npm run bot:poll
 *   # or with watch mode (auto-restart on file changes):
 *   npx tsx --env-file=.env.local --watch scripts/run-bot.ts
 *
 * NOTE: If a webhook is currently registered for this bot token, long-polling
 * will not receive updates. Delete the webhook first:
 *   curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
 */
import 'dotenv/config'
import { Bot } from 'grammy'
import { prisma } from '@/lib/db'
import { sendWelcomeMessage } from '@/lib/telegram/notifications'
import { config } from '@/config'

if (!config.telegram.botToken) {
  console.error('[bot:poll] TELEGRAM_BOT_TOKEN is not set in .env.local')
  process.exit(1)
}

const bot = new Bot(config.telegram.botToken)

// ── /start ────────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const token = ctx.match.trim()
  const chatId = ctx.chat.id
  const username = ctx.from?.username ?? null

  if (!token) {
    // /start with no payload — greet or remind how to connect
    const existing = await prisma.user.findFirst({
      where: { telegramChatId: BigInt(chatId) },
    })
    if (existing) {
      await sendWelcomeMessage(chatId, config.app.url)
    } else {
      await ctx.reply(
        'Hi! To connect your account, open your dashboard and click "Connect Telegram".',
      )
    }
    return
  }

  // /start <token> — link account
  const user = await prisma.user.findFirst({
    where: {
      telegramLinkToken: token,
      telegramLinkExpiresAt: { gt: new Date() },
    },
  })

  if (!user) {
    await ctx.reply(
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
})

// ── Error handler ─────────────────────────────────────────────────────────────

bot.catch((err) => {
  console.error('[bot:poll] Unhandled error:', err.message)
})

// ── Start ─────────────────────────────────────────────────────────────────────

console.log('[bot:poll] Starting long-poll mode. Press Ctrl+C to stop.')

void bot.start({
  onStart: (info) => console.log(`[bot:poll] Polling as @${info.username}`),
})

process.once('SIGINT', () => void bot.stop())
process.once('SIGTERM', () => void bot.stop())
