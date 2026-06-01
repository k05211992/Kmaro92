import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'
const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@bizclass.app',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  role: 'authenticated',
  aud: 'authenticated',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDemoClient(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: DEMO_USER }, error: null }),
      signOut: async () => ({ error: null }),
    },
  }
}

export async function createSupabaseServerClient() {
  if (process.env.USE_DEMO_MODE === 'true') return makeDemoClient()

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Components cannot set cookies — handled by middleware
          }
        },
      },
    },
  )
}
