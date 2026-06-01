#!/usr/bin/env tsx
/**
 * Demo data seed script.
 *
 * Creates 3 sample alerts for an existing user and runs one mock cron pass
 * to populate offer history. Useful for demos and local development.
 *
 * Prerequisites:
 *   1. Database is running and migrations applied (`npm run db:push`)
 *   2. At least one user exists (log in to the app at least once)
 *
 * Usage:
 *   npm run db:seed
 *   # Seed for a specific user:
 *   SEED_USER_ID=<supabase-uuid> npm run db:seed
 */
import 'dotenv/config'
import { prisma } from '@/lib/db'
import { checkAlerts } from '@/lib/jobs/checkAlerts'

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 86_400_000)
}

// ── Demo alert definitions ────────────────────────────────────────────────────

const DEMO_ALERTS = [
  {
    label: 'Moscow → New York (one-way)',
    origin: 'SVO',
    destination: 'JFK',
    tripType: 'one_way' as const,
    departDateFrom: daysFromNow(60),
    departDateTo: daysFromNow(90),
    returnDateFrom: null,
    returnDateTo: null,
    maxPrice: 2500,
    currency: 'EUR',
    maxStops: 1,
    maxDurationMinutes: null,
    nearbyAirports: false,
    notifFrequency: 'instant' as const,
  },
  {
    label: 'St. Petersburg → Dubai (round trip)',
    origin: 'LED',
    destination: 'DXB',
    tripType: 'round_trip' as const,
    departDateFrom: daysFromNow(30),
    departDateTo: daysFromNow(45),
    returnDateFrom: daysFromNow(37),
    returnDateTo: daysFromNow(52),
    maxPrice: 1800,
    currency: 'EUR',
    maxStops: 1,
    maxDurationMinutes: null,
    nearbyAirports: false,
    notifFrequency: 'instant' as const,
  },
  {
    label: 'Moscow → London (non-stop only)',
    origin: 'SVO',
    destination: 'LHR',
    tripType: 'one_way' as const,
    departDateFrom: daysFromNow(14),
    departDateTo: daysFromNow(28),
    returnDateFrom: null,
    returnDateTo: null,
    maxPrice: 1500,
    currency: 'EUR',
    maxStops: 0,
    maxDurationMinutes: 240,
    nearbyAirports: false,
    notifFrequency: 'daily_digest' as const,
  },
] as const

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Resolve user
  const userId = process.env['SEED_USER_ID']
  let user: { id: string; email: string } | null

  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error(
        `User with ID "${userId}" not found in the database.\n` +
          'Make sure they have logged in at least once.',
      )
    }
  } else {
    user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!user) {
      throw new Error(
        'No users found in the database.\n' +
          'Run `npm run dev`, open http://localhost:3000, and log in first.\n' +
          'Then re-run this script.',
      )
    }
  }

  console.log(`\n[seed] Seeding demo data for: ${user.email} (${user.id})\n`)

  // Create alerts (skip duplicates)
  let created = 0
  for (const { label, ...data } of DEMO_ALERTS) {
    const existing = await prisma.alert.findFirst({
      where: { userId: user.id, origin: data.origin, destination: data.destination },
    })

    if (existing) {
      console.log(`  skip   ${label} (already exists)`)
      continue
    }

    await prisma.alert.create({
      data: {
        userId: user.id,
        origin: data.origin,
        destination: data.destination,
        tripType: data.tripType,
        departDateFrom: data.departDateFrom,
        departDateTo: data.departDateTo,
        returnDateFrom: data.returnDateFrom,
        returnDateTo: data.returnDateTo,
        maxPrice: data.maxPrice,
        currency: data.currency,
        maxStops: data.maxStops,
        maxDurationMinutes: data.maxDurationMinutes,
        nearbyAirports: data.nearbyAirports,
        notifFrequency: data.notifFrequency,
      },
    })

    console.log(`  create ${label}`)
    created++
  }

  if (created === 0) {
    console.log('\n[seed] All demo alerts already exist — skipping cron run.')
    return
  }

  // Run mock cron to populate offer history
  console.log(`\n[seed] Created ${created} alert(s). Running mock cron to generate offers...\n`)
  const result = await checkAlerts()

  console.log('\n[seed] Done!')
  console.table({
    'Alerts checked': result.checked,
    'Worthy offers (pending)': result.notified,
    'Duplicate offers skipped': result.skipped,
    'Errors': result.errors,
  })
  console.log('\nOpen http://localhost:3000/dashboard to see the demo data.')
}

main()
  .catch((err: unknown) => {
    console.error('\n[seed] Fatal error:', err instanceof Error ? err.message : err)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
