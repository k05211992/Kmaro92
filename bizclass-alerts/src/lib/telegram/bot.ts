import { Bot } from 'grammy'
import { config } from '@/config'

let _bot: Bot | null = null

/**
 * Returns the shared grammY Bot instance.
 *
 * Lazy — only instantiated on first call, so modules can safely import this
 * file at build time even when TELEGRAM_BOT_TOKEN is absent.
 * The error is raised only when the bot is actually used at runtime.
 */
export function getBot(): Bot {
  if (!_bot) {
    const token = config.telegram.botToken
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set. Add it to your .env.local file.')
    }
    _bot = new Bot(token)
  }
  return _bot
}
