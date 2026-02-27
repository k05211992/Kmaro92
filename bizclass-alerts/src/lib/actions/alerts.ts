'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { alertCreateSchema, flattenZodErrors } from '@/lib/validations/alert'
import { config } from '@/config'
import type { AlertStatus } from '@/types/alert'

// ─── Return type ─────────────────────────────────────────────────────────────

export type ActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAuthedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Extracts typed fields from FormData for an alert. */
function parseAlertFormData(formData: FormData) {
  return {
    origin: formData.get('origin'),
    destination: formData.get('destination'),
    tripType: formData.get('tripType'),
    departDateFrom: formData.get('departDateFrom'),
    departDateTo: (formData.get('departDateTo') as string) || null,
    returnDateFrom: (formData.get('returnDateFrom') as string) || null,
    returnDateTo: (formData.get('returnDateTo') as string) || null,
    maxPrice: parseFloat(formData.get('maxPrice') as string),
    currency: formData.get('currency'),
    maxStops: parseInt(formData.get('maxStops') as string, 10),
    maxDurationMinutes: formData.get('maxDurationMinutes')
      ? parseInt(formData.get('maxDurationMinutes') as string, 10)
      : null,
    nearbyAirports: formData.get('nearbyAirports') === 'on',
    notifFrequency: formData.get('notifFrequency'),
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Creates a new alert.
 * Signature matches what useFormState expects: (prevState, formData) => Promise<ActionResult>
 */
export async function createAlertAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getAuthedUser()
  if (!user) return { success: false, error: 'You must be signed in' }

  // Enforce per-user limit before doing anything else
  const activeCount = await prisma.alert.count({
    where: { userId: user.id, status: { in: ['active', 'paused'] } },
  })
  if (activeCount >= config.app.maxAlertsPerUser) {
    return {
      success: false,
      error: `You've reached the limit of ${config.app.maxAlertsPerUser} active alerts. Pause or delete an existing one to create a new one.`,
    }
  }

  const raw = parseAlertFormData(formData)
  const parsed = alertCreateSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below',
      fieldErrors: flattenZodErrors(parsed.error.issues),
    }
  }

  const d = parsed.data

  // Ensure user row exists (created on first alert)
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email! },
  })

  await prisma.alert.create({
    data: {
      userId: user.id,
      origin: d.origin,
      destination: d.destination,
      tripType: d.tripType,
      departDateFrom: new Date(d.departDateFrom),
      departDateTo: d.departDateTo ? new Date(d.departDateTo) : null,
      returnDateFrom: d.returnDateFrom ? new Date(d.returnDateFrom) : null,
      returnDateTo: d.returnDateTo ? new Date(d.returnDateTo) : null,
      maxPrice: d.maxPrice,
      currency: d.currency,
      maxStops: d.maxStops,
      maxDurationMinutes: d.maxDurationMinutes ?? null,
      nearbyAirports: d.nearbyAirports,
      notifFrequency: d.notifFrequency,
    },
  })

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

/**
 * Updates an existing alert.
 * alertId is bound at the call site: updateAlertAction.bind(null, id)
 */
export async function updateAlertAction(
  alertId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getAuthedUser()
  if (!user) return { success: false, error: 'You must be signed in' }

  const existing = await prisma.alert.findFirst({
    where: { id: alertId, userId: user.id },
  })
  if (!existing) return { success: false, error: 'Alert not found' }

  const raw = parseAlertFormData(formData)
  const parsed = alertCreateSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below',
      fieldErrors: flattenZodErrors(parsed.error.issues),
    }
  }

  const d = parsed.data

  await prisma.alert.update({
    where: { id: alertId },
    data: {
      origin: d.origin,
      destination: d.destination,
      tripType: d.tripType,
      departDateFrom: new Date(d.departDateFrom),
      departDateTo: d.departDateTo ? new Date(d.departDateTo) : null,
      returnDateFrom: d.returnDateFrom ? new Date(d.returnDateFrom) : null,
      returnDateTo: d.returnDateTo ? new Date(d.returnDateTo) : null,
      maxPrice: d.maxPrice,
      currency: d.currency,
      maxStops: d.maxStops,
      maxDurationMinutes: d.maxDurationMinutes ?? null,
      nearbyAirports: d.nearbyAirports,
      notifFrequency: d.notifFrequency,
    },
  })

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

/**
 * Changes alert status (active → paused, paused → active, any → archived).
 * Called directly from AlertCard with useTransition — no form needed.
 */
export async function patchAlertStatusAction(
  alertId: string,
  status: AlertStatus,
): Promise<ActionResult> {
  const user = await getAuthedUser()
  if (!user) return { success: false, error: 'You must be signed in' }

  const existing = await prisma.alert.findFirst({
    where: { id: alertId, userId: user.id },
  })
  if (!existing) return { success: false, error: 'Alert not found' }

  // Prevent unarchiving — archived is terminal in MVP
  if (existing.status === 'archived') {
    return { success: false, error: 'Archived alerts cannot be modified' }
  }

  await prisma.alert.update({
    where: { id: alertId },
    data: { status },
  })

  revalidatePath('/dashboard')
  return { success: true }
}
