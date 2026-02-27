#!/usr/bin/env tsx
/**
 * Manual cron trigger for local development.
 *
 * Runs the same checkAlerts() job that the Vercel Cron calls in production.
 * Requires a running Postgres database and a valid .env.local file.
 *
 * Usage:
 *   npm run cron:run
 *   # or directly:
 *   npx tsx --env-file=.env.local scripts/run-cron.ts
 *
 * Alternative (when the dev server is already running):
 *   curl -s -H "Authorization: Bearer $CRON_SECRET" \
 *        http://localhost:3000/api/cron/check-alerts | jq
 */
import 'dotenv/config'
import { checkAlerts } from '@/lib/jobs/checkAlerts'

async function main() {
  const start = Date.now()
  console.log(`\n[run-cron] Starting manual cron run at ${new Date().toISOString()}\n`)

  const result = await checkAlerts()

  const elapsed = ((Date.now() - start) / 1000).toFixed(2)
  console.log(`\n[run-cron] Completed in ${elapsed}s`)
  console.table({
    checked:  result.checked,
    worthy:   result.notified,
    skipped:  result.skipped,
    errors:   result.errors,
  })

  process.exit(result.errors > 0 ? 1 : 0)
}

main().catch((err: unknown) => {
  console.error('[run-cron] Fatal:', err)
  process.exit(1)
})
