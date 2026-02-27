'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Disclaimer } from '@/components/layout/Disclaimer'
import type { ActionResult } from '@/lib/actions/alerts'
import type { Alert } from '@/types/alert'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AlertFormProps {
  /** Server action: createAlertAction or updateAlertAction.bind(null, id) */
  action: (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>
  initial?: Partial<Alert>
  isEdit?: boolean
}

// ─── Submit button — reads pending state from nearest <form> ─────────────────

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending}>
      {isEdit ? 'Save changes' : 'Create alert'}
    </Button>
  )
}

// ─── Field-level error display ────────────────────────────────────────────────

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const messages = errors?.[field]
  if (!messages?.length) return null
  return (
    <ul className="mt-1 space-y-0.5">
      {messages.map((m) => (
        <li key={m} className="text-xs text-red-600">
          {m}
        </li>
      ))}
    </ul>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)

function fieldError(
  state: ActionResult | null,
  field: string,
): string | undefined {
  if (!state || state.success) return undefined
  return state.fieldErrors?.[field]?.[0]
}

// ─── Form ────────────────────────────────────────────────────────────────────

export function AlertForm({ action, initial, isEdit = false }: AlertFormProps) {
  const router = useRouter()
  const [state, formAction] = useFormState(action, null)

  // Trip type is controlled locally so we can conditionally show return date fields
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>(
    initial?.tripType ?? 'one_way',
  )

  const fe = (field: string) => fieldError(state, field)

  return (
    <form action={formAction} className="space-y-6">

      {/* Top-level error (non-field) */}
      {state && !state.success && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span className="mt-0.5 shrink-0">⚠️</span>
          <div>
            <p className="font-medium">{state.error}</p>
            {state.fieldErrors?.['_form']?.map((m) => (
              <p key={m} className="mt-0.5 text-xs">{m}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── Route ──────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Route</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="From"
              name="origin"
              placeholder="SVO"
              defaultValue={initial?.origin ?? ''}
              required
              maxLength={3}
              hint="3-letter airport code"
              error={fe('origin')}
              className="uppercase"
            />
          </div>
          <div>
            <Input
              label="To"
              name="destination"
              placeholder="JFK"
              defaultValue={initial?.destination ?? ''}
              required
              maxLength={3}
              hint="3-letter airport code"
              error={fe('destination')}
              className="uppercase"
            />
          </div>
        </div>

        {/* Hidden field so server action knows the current trip type */}
        <input type="hidden" name="tripType" value={tripType} />

        <div className="flex gap-2 rounded-lg border border-gray-200 p-1 bg-gray-50">
          {(['one_way', 'round_trip'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTripType(t)}
              className={[
                'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                tripType === t
                  ? 'bg-white shadow text-brand-700 border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {t === 'one_way' ? 'One way' : 'Round trip'}
            </button>
          ))}
        </div>
      </section>

      {/* ── Departure dates ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Departure window
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Earliest"
              name="departDateFrom"
              type="date"
              min={today}
              defaultValue={initial?.departDateFrom ?? ''}
              required
              error={fe('departDateFrom')}
            />
          </div>
          <div>
            <Input
              label="Latest (optional)"
              name="departDateTo"
              type="date"
              min={today}
              defaultValue={initial?.departDateTo ?? ''}
              hint="Leave empty for exact date"
              error={fe('departDateTo')}
            />
          </div>
        </div>
      </section>

      {/* ── Return dates (round trip only) ─────────────────────────────────── */}
      {tripType === 'round_trip' && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Return window
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Earliest return"
                name="returnDateFrom"
                type="date"
                min={today}
                defaultValue={initial?.returnDateFrom ?? ''}
                required
                error={fe('returnDateFrom')}
              />
            </div>
            <div>
              <Input
                label="Latest return (optional)"
                name="returnDateTo"
                type="date"
                min={today}
                defaultValue={initial?.returnDateTo ?? ''}
                error={fe('returnDateTo')}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Budget ─────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Budget</h2>
        <p className="text-xs text-gray-500">
          We'll alert you when business class price is at or below this amount.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Max price (per person)"
              name="maxPrice"
              type="number"
              min="1"
              step="1"
              placeholder="2000"
              defaultValue={initial?.maxPrice ?? ''}
              required
              error={fe('maxPrice')}
            />
          </div>
          <div>
            <Select
              label="Currency"
              name="currency"
              defaultValue={initial?.currency ?? 'EUR'}
              options={[
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'USD', label: 'USD ($)' },
              ]}
              required
              error={fe('currency')}
            />
          </div>
        </div>
      </section>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h2>

        <Select
          label="Maximum stops"
          name="maxStops"
          defaultValue={String(initial?.maxStops ?? 1)}
          options={[
            { value: '0', label: 'Non-stop only' },
            { value: '1', label: 'Up to 1 stop (recommended)' },
            { value: '2', label: 'Up to 2 stops' },
          ]}
          required
          error={fe('maxStops')}
        />

        <Input
          label="Max total flight duration"
          name="maxDurationMinutes"
          type="number"
          min="60"
          step="30"
          placeholder="e.g. 720"
          defaultValue={initial?.maxDurationMinutes ?? ''}
          hint="In minutes. E.g. 720 = 12 h. Leave empty to skip."
          error={fe('maxDurationMinutes')}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              name="nearbyAirports"
              defaultChecked={initial?.nearbyAirports ?? false}
              className="peer sr-only"
            />
            <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-brand-600 transition-colors" />
            <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm text-gray-700">Include nearby airports</span>
        </label>
      </section>

      {/* ── Notifications ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Notifications
        </h2>
        <Select
          label="How often to notify"
          name="notifFrequency"
          defaultValue={initial?.notifFrequency ?? 'instant'}
          options={[
            { value: 'instant', label: 'Instantly — as soon as a deal is found' },
            { value: 'daily_digest', label: 'Daily digest (once per day)' },
          ]}
          required
          error={fe('notifFrequency')}
        />
      </section>

      {/* ── Legal ──────────────────────────────────────────────────────────── */}
      <Disclaimer />

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <SubmitButton isEdit={isEdit} />
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
