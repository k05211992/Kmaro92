import { Resend } from 'resend'
import { config } from '@/config'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!config.resend.apiKey) throw new Error('RESEND_API_KEY is not set.')
    _resend = new Resend(config.resend.apiKey)
  }
  return _resend
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface SendOfferEmailParams {
  to: string
  alert: {
    origin: string
    destination: string
    maxPrice: number
    currency: string
  }
  offer: {
    price: number
    currency: string
    departAt: Date
    arriveAt: Date
    returnDepartAt: Date | null
    stops: number
    durationMinutes: number
    isFullBusiness: boolean
    airlineCodes: string[]
  }
  reason: 'below_threshold' | 'price_drop'
  aiInsight: string | null
  deepLink: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: Date): string {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Subject ──────────────────────────────────────────────────────────────────

function buildSubject(p: SendOfferEmailParams): string {
  const price = `${Math.round(p.offer.price)} ${p.offer.currency}`
  return p.reason === 'below_threshold'
    ? `✈️ Deal found: ${p.alert.origin} → ${p.alert.destination} — ${price}`
    : `📉 Price drop: ${p.alert.origin} → ${p.alert.destination} — ${price}`
}

// ─── HTML template ────────────────────────────────────────────────────────────

function buildHtml(p: SendOfferEmailParams): string {
  const { alert, offer, reason, aiInsight, deepLink } = p

  const reasonText =
    reason === 'below_threshold'
      ? `Price is below your budget of <strong>${Math.round(alert.maxPrice)} ${alert.currency}</strong>`
      : `Significant price drop detected`

  const cabinBadge = offer.isFullBusiness
    ? `<span style="background:#dcfce7;color:#166534;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600">🟢 Full Business</span>`
    : `<span style="background:#fef9c3;color:#854d0e;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600">🟡 Mixed Cabin</span>`

  const mixedWarning = !offer.isFullBusiness
    ? `<p style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:12px;color:#92400e;margin:12px 0 0">
         ⚠️ Mixed cabin — some flight segments may not be in business class.
       </p>`
    : ''

  const returnRow =
    offer.returnDepartAt
      ? `<tr>
           <td style="color:#6b7280;padding:5px 12px 5px 0;font-size:14px;white-space:nowrap">↩️ Return departs</td>
           <td style="font-size:14px;font-weight:500;color:#111827">${fmt(offer.returnDepartAt)}</td>
         </tr>`
      : ''

  const insightBlock = aiInsight
    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin-top:16px">
         <p style="margin:0;font-size:13px;color:#1e40af">🤖 ${aiInsight}</p>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${buildSubject(p)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">

          <!-- Header bar -->
          <tr>
            <td style="background:#1d4ed8;padding:14px 24px">
              <p style="margin:0;font-size:13px;font-weight:600;color:#bfdbfe;letter-spacing:.06em;text-transform:uppercase">BizClass Alerts</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 0">

              <!-- Route + reason -->
              <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#111827">
                ${alert.origin} → ${alert.destination}
              </h1>
              <p style="margin:0 0 20px;font-size:14px;color:#4b5563">${reasonText}</p>

              <!-- Price box -->
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                <p style="margin:0;font-size:34px;font-weight:800;color:#15803d;line-height:1">
                  ${Math.round(offer.price)} ${offer.currency}
                </p>
                <p style="margin:4px 0 0;font-size:12px;color:#6b7280">per person · business class</p>
              </div>

              <!-- Flight details table -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px">
                <tr>
                  <td style="color:#6b7280;padding:5px 12px 5px 0;font-size:14px;white-space:nowrap">📅 Departs</td>
                  <td style="font-size:14px;font-weight:500;color:#111827">${fmt(offer.departAt)}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:5px 12px 5px 0;font-size:14px;white-space:nowrap">⏱ Duration</td>
                  <td style="font-size:14px;font-weight:500;color:#111827">${fmtDuration(offer.durationMinutes)}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:5px 12px 5px 0;font-size:14px;white-space:nowrap">🛑 Stops</td>
                  <td style="font-size:14px;font-weight:500;color:#111827">
                    ${offer.stops === 0 ? 'Non-stop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
                  </td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:5px 12px 5px 0;font-size:14px;white-space:nowrap">✈️ Airlines</td>
                  <td style="font-size:14px;font-weight:500;color:#111827">${offer.airlineCodes.join(', ')}</td>
                </tr>
                ${returnRow}
              </table>

              <!-- Cabin badge -->
              <div style="margin-bottom:4px">${cabinBadge}</div>
              ${mixedWarning}
              ${insightBlock}

              <!-- CTA -->
              <div style="margin-top:24px;margin-bottom:28px">
                <a href="${deepLink}"
                   style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600">
                  Book now ↗
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 28px">
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6">
                ⚠️ Prices shown were found at the time of the search and may have changed.
                Always verify before booking.<br>
                You're receiving this because you set up an alert on BizClass Alerts.
                <a href="${config.app.url}/dashboard" style="color:#6b7280;text-decoration:underline">Manage your alerts</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendOfferEmail(params: SendOfferEmailParams): Promise<void> {
  const { data, error } = await getResend().emails.send({
    from: config.resend.fromAddress,
    to: params.to,
    subject: buildSubject(params),
    html: buildHtml(params),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  if (!data?.id) {
    throw new Error('Resend returned no message ID — email may not have been delivered.')
  }
}
