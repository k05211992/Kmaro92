function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const config = {
  app: {
    url: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    maxAlertsPerUser: parseInt(getEnv('MAX_ALERTS_PER_USER', '10'), 10),
    /** Default currency shown to new users */
    defaultCurrency: getEnv('DEFAULT_CURRENCY', 'EUR') as 'EUR' | 'USD',
  },
  pricing: {
    /**
     * Minimum % price drop vs best-seen price to trigger a price_drop notification.
     * Reads PRICE_DROP_PERCENT first; falls back to PRICE_DROP_THRESHOLD_PERCENT
     * for backwards compatibility.
     */
    priceDropThresholdPercent: parseInt(
      process.env['PRICE_DROP_PERCENT'] ??
        getEnv('PRICE_DROP_THRESHOLD_PERCENT', '10'),
      10,
    ),
  },
  cron: {
    secret: getEnv('CRON_SECRET', ''),
    dailyDigestHourUtc: parseInt(getEnv('DAILY_DIGEST_HOUR_UTC', '8'), 10),
  },
  provider: {
    /**
     * Feature flag — when true the mock provider is always used regardless
     * of the FLIGHT_PROVIDER value. Safe default for local development.
     */
    useMock: getEnv('USE_MOCK_PROVIDER', 'true') === 'true',
    current: getEnv('FLIGHT_PROVIDER', 'mock') as 'mock' | 'amadeus' | 'duffel',
  },
  telegram: {
    botToken: getEnv('TELEGRAM_BOT_TOKEN', ''),
    botUsername: getEnv('TELEGRAM_BOT_USERNAME', ''),
    webhookSecret: getEnv('TELEGRAM_WEBHOOK_SECRET', ''),
  },
  resend: {
    apiKey: getEnv('RESEND_API_KEY', ''),
    /** "Name <address@domain.com>" format. Verify domain in Resend dashboard first. */
    fromAddress: getEnv('EMAIL_FROM', 'BizClass Alerts <onboarding@resend.dev>'),
  },
  amadeus: {
    clientId: getEnv('AMADEUS_CLIENT_ID', ''),
    clientSecret: getEnv('AMADEUS_CLIENT_SECRET', ''),
    /** test.api.amadeus.com for sandbox, api.amadeus.com for production */
    hostname: getEnv('AMADEUS_HOSTNAME', 'test.api.amadeus.com'),
  },
  openai: {
    apiKey: getEnv('OPENAI_API_KEY', ''),
  },
} as const
