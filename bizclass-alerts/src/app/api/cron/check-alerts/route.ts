import { NextRequest, NextResponse } from 'next/server'
import { checkAlerts } from '@/lib/jobs/checkAlerts'
import { dispatchPendingNotifications } from '@/lib/telegram/dispatcher'
import { dispatchPendingEmailNotifications } from '@/lib/email/dispatcher'
import { config } from '@/config'

// Vercel Cron calls this endpoint on schedule (see vercel.json).
// Protected by a Bearer token to prevent external triggering.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${config.cron.secret}`

  if (!config.cron.secret || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const alerts = await checkAlerts()
    const telegram = await dispatchPendingNotifications()
    const email = await dispatchPendingEmailNotifications()

    return NextResponse.json({ ok: true, alerts, dispatch: { telegram, email } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'cron.fatal', error: message }))
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
