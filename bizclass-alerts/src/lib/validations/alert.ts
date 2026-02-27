import { z, type ZodIssue } from 'zod'

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')

const iataCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Must be a 3-letter IATA code (e.g. JFK, DXB)')

export const alertCreateSchema = z
  .object({
    origin: iataCode,
    destination: iataCode,
    tripType: z.enum(['one_way', 'round_trip']),
    departDateFrom: isoDate,
    departDateTo: isoDate.nullable().optional(),
    returnDateFrom: isoDate.nullable().optional(),
    returnDateTo: isoDate.nullable().optional(),
    maxPrice: z.number().positive('Must be greater than 0'),
    currency: z.enum(['EUR', 'USD']),
    maxStops: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    maxDurationMinutes: z.number().int().positive().nullable().optional(),
    nearbyAirports: z.boolean(),
    notifFrequency: z.enum(['instant', 'daily_digest']),
  })
  .refine((d) => d.origin !== d.destination, {
    message: 'Origin and destination must be different',
    path: ['destination'],
  })
  .refine(
    (d) => {
      if (d.departDateFrom && d.departDateTo) {
        return new Date(d.departDateTo) >= new Date(d.departDateFrom)
      }
      return true
    },
    { message: 'Departure end date must be on or after start date', path: ['departDateTo'] },
  )
  .refine(
    (d) => {
      if (d.tripType === 'round_trip' && !d.returnDateFrom) return false
      return true
    },
    { message: 'Return date is required for round trips', path: ['returnDateFrom'] },
  )
  .refine(
    (d) => {
      if (d.returnDateFrom) {
        const latestDepart = d.departDateTo ?? d.departDateFrom
        return new Date(d.returnDateFrom) >= new Date(latestDepart)
      }
      return true
    },
    { message: 'Return date must be on or after departure date', path: ['returnDateFrom'] },
  )
  .refine(
    (d) => {
      if (d.returnDateFrom && d.returnDateTo) {
        return new Date(d.returnDateTo) >= new Date(d.returnDateFrom)
      }
      return true
    },
    { message: 'Return end date must be on or after return start date', path: ['returnDateTo'] },
  )

export const alertUpdateSchema = alertCreateSchema.partial().extend({
  status: z.enum(['active', 'paused', 'archived']).optional(),
})

export type AlertCreateInput = z.infer<typeof alertCreateSchema>
export type AlertUpdateInput = z.infer<typeof alertUpdateSchema>

/**
 * Converts a Zod issues array into a map of field path → error messages[].
 * Used by Server Actions to return structured field errors to the form.
 *
 * Cross-field refinement errors (e.g. origin !== destination) are keyed by
 * the first element of `issue.path` so they appear under the relevant input.
 */
export function flattenZodErrors(issues: ZodIssue[]): Record<string, string[]> {
  const errors: Record<string, string[]> = {}

  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_form'
    if (!errors[key]) errors[key] = []
    errors[key].push(issue.message)
  }

  return errors
}
