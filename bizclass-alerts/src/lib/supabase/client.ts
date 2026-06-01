import { createBrowserClient } from '@supabase/ssr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDemoClient(): any {
  return {
    auth: {
      signInWithOtp: async () => ({ error: null }),
      signOut: async () => { window.location.href = '/' },
    },
  }
}

export function createSupabaseClient() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return makeDemoClient()

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
