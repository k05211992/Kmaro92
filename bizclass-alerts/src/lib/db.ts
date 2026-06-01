import { PrismaClient } from '@prisma/client'

// Prevent multiple instances during Next.js hot-reload in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Demo mode: ensure the demo user exists in SQLite on first import.
// Runs async — errors are suppressed (table may not exist yet during db:push).
if (process.env.USE_DEMO_MODE === 'true') {
  prisma.user
    .upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      create: { id: '00000000-0000-0000-0000-000000000001', email: 'demo@bizclass.app' },
      update: {},
    })
    .catch(() => undefined)
}
