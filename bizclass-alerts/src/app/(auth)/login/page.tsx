'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Demo mode: skip auth and go straight to dashboard
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            ✈️ BizClass Alerts
          </Link>
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
            <p className="text-4xl mb-3">🚀</p>
            <p className="font-semibold text-blue-800 text-lg">Demo mode</p>
            <p className="mt-1 text-sm text-blue-600 mb-5">
              No login required — explore the full app with demo data.
            </p>
            <Button className="w-full" size="lg" onClick={() => router.push('/dashboard')}>
              Enter demo →
            </Button>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createSupabaseClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })

    setLoading(false)
    if (authError) setError(authError.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            ✈️ BizClass Alerts
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Sign in to your account</h1>
          <p className="mt-1 text-sm text-gray-500">
            We&apos;ll send a magic link to your email — no password needed.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
            <p className="text-2xl mb-2">📬</p>
            <p className="font-semibold text-green-800">Check your inbox</p>
            <p className="mt-1 text-sm text-green-700">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <button onClick={() => setSent(false)} className="mt-4 text-sm text-green-600 underline">
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Send magic link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          By signing in you agree to our{' '}
          <Link href="/terms" className="underline">Terms</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
