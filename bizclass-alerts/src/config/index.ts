function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const config = {
  app: {
    url: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    maxAlertsPerUser: parseInt(getEnv('MAX_ALERTS_PER_USER', '10'), 10),
  },
  pricing: {
    // Minimum % drop vs best seen price to trigger a price_drop notification
    priceDropThresholdPercent: parseInt(getEnv('PRICE_DROP_THRESHOLD_PERCENT', '10'), 10),
  },
  cron: {
    secret: getEnv('CRON_SECRET', ''),
    dailyDigestHourUtc: parseInt(getEnv('DAILY_DIGEST_HOUR_UTC', '8'), 10),
  },
  provider: {
    current: getEnv('FLIGHT_PROVIDER', 'mock') as 'mock' | 'amadeus' | 'duffel',
  },
  telegram: {
    botToken: getEnv('TELEGRAM_BOT_TOKEN', ''),
    botUsername: getEnv('TELEGRAM_BOT_USERNAME', ''),
    webhookSecret: getEnv('TELEGRAM_WEBHOOK_SECRET', ''),
  },
  openai: {
    apiKey: getEnv('OPENAI_API_KEY', ''),
  },
} as const
