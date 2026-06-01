# BizClass Alerts

A full-stack web app + Telegram bot that watches business class flight prices and notifies you the moment a deal worth booking appears.

Set your route, budget, and travel window → we check prices on a schedule → if a fare drops below your budget or falls significantly, you get a Telegram message with a booking link.

---

## Features

- Magic-link auth via Supabase (no passwords)
- Create / pause / resume / delete flight price alerts
- Per-alert filters: max stops, max duration, nearby airports
- Deduplication: every offer is stored once via SHA-256 hash
- Telegram notifications with inline booking button
- AI-generated deal summary (optional, powered by GPT-4o-mini)
- Mock flight provider out of the box — no API key required to run locally
- Vercel Cron integration for automated price checks
- Offer history page per alert

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, React Server Components) |
| Language | TypeScript 5 strict |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (magic link) |
| Database | Supabase Postgres + Prisma ORM |
| Bot | grammY (Telegram Bot API) |
| AI | OpenAI GPT-4o-mini (optional) |
| Hosting | Vercel (serverless + cron) |

---

## Quick Start (local)

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine)
- A Telegram bot token (optional — you can skip notifications for local dev)

### 1. Clone and install

```bash
git clone <your-repo-url> bizclass-alerts
cd bizclass-alerts
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in at minimum:

```env
# Supabase — required
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=postgresql://...  # Transaction pooler (port 6543)
DIRECT_URL=postgresql://...    # Direct / session pooler (port 5432)

# Keep these as-is for local mock mode — no flight API key needed
USE_MOCK_PROVIDER=true
FLIGHT_PROVIDER=mock

# Telegram — only needed if you want bot notifications
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_BOT_USERNAME=<your-bot-username>
TELEGRAM_WEBHOOK_SECRET=<random-secret>

# Cron auth (any random string works locally)
CRON_SECRET=local-dev-secret
```

### 3. Set up the database

```bash
# Apply schema to your Supabase database
npm run db:push

# (Optional) Generate Prisma client after schema changes
npm run db:generate
```

> **Tip:** You can also run `npm run db:studio` to browse data in Prisma Studio at http://localhost:5555.

### 4. Start the app

```bash
npm run dev
# → http://localhost:3000
```

Log in with your email — Supabase sends a magic link.

### 5. Seed demo data (optional)

After logging in at least once:

```bash
npm run db:seed
# Creates 3 demo alerts and runs a mock cron pass to populate offer history.
# Open http://localhost:3000/dashboard to see the results.
```

To seed for a specific user (by their Supabase UUID):

```bash
SEED_USER_ID=<uuid> npm run db:seed
```

---

## Scripts Reference

| Script | Description |
|---|---|
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run db:push` | Apply Prisma schema to DB (no migration history) |
| `npm run db:migrate` | Create a named migration (generates SQL file) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:studio` | Open Prisma Studio at localhost:5555 |
| `npm run db:seed` | Create demo alerts + run one mock cron pass |
| `npm run cron:run` | Manually trigger one cron pass (check all active alerts) |
| `npm run bot:poll` | Run bot in long-poll mode (for local Telegram testing) |

---

## Environment Variables Reference

See [.env.example](.env.example) for the full list with descriptions.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Server-side key (never expose to client) |
| `DATABASE_URL` | Yes | — | Transaction pooler URL (port 6543) |
| `DIRECT_URL` | Yes | — | Direct connection URL (port 5432, for migrations) |
| `USE_MOCK_PROVIDER` | No | `true` | Feature flag: force mock flight data |
| `FLIGHT_PROVIDER` | No | `mock` | `mock` \| `amadeus` \| `duffel` |
| `TELEGRAM_BOT_TOKEN` | No* | — | Required for notifications |
| `TELEGRAM_BOT_USERNAME` | No* | — | Bot username without @ |
| `TELEGRAM_WEBHOOK_SECRET` | No* | — | Random string for webhook auth |
| `CRON_SECRET` | No* | — | Required for automated cron |
| `PRICE_DROP_PERCENT` | No | `10` | % drop to trigger price_drop alert |
| `MAX_ALERTS_PER_USER` | No | `10` | Alert limit per account |
| `DEFAULT_CURRENCY` | No | `EUR` | `EUR` or `USD` |
| `OPENAI_API_KEY` | No | — | Leave empty to skip AI summaries |

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)

2. **Get credentials:** Dashboard → Project Settings → API
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon (public)` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role (secret)` key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Get database URLs:** Dashboard → Project Settings → Database → Connection string
   - Transaction pooler (port 6543) → `DATABASE_URL`
   - Session pooler or Direct (port 5432) → `DIRECT_URL`

4. **Enable email auth:** Dashboard → Authentication → Providers → Email → enable "Magic Link"

5. **Apply schema:**
   ```bash
   npm run db:push
   ```
   This runs `prisma db push` which creates all tables, indexes, and enums directly.
   For production migrations with history, use `npm run db:migrate` instead.

6. **Optional — apply RLS policies manually:**
   The file [supabase/migrations/20240101000000_init.sql](supabase/migrations/20240101000000_init.sql) contains the full RLS policy SQL. You can run it in the Supabase SQL editor for production hardening.

---

## Telegram Bot Setup

### Create a bot

1. Open Telegram → search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Copy the bot token → `TELEGRAM_BOT_TOKEN`
4. Note the bot username → `TELEGRAM_BOT_USERNAME`
5. Generate a webhook secret: `openssl rand -hex 20` → `TELEGRAM_WEBHOOK_SECRET`

### Local development (long-poll mode)

No HTTPS or webhook registration needed:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run bot:poll
# → [bot:poll] Polling as @yourbotname
```

Then go to **Profile** in the app and click **Connect Telegram** — tap the link to open your bot and send `/start <token>`.

> **Note:** If you previously registered a webhook for this bot, delete it first:
> ```bash
> curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
> ```

### Production (webhook mode)

After deploying to Vercel, register the webhook once:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<your-domain>/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Confirm registration:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## Cron Setup

### Local manual trigger

```bash
npm run cron:run
# Runs checkAlerts() + dispatchPendingNotifications() once.
```

Or via HTTP (when `npm run dev` is running):

```bash
curl -s -H "Authorization: Bearer local-dev-secret" \
     http://localhost:3000/api/cron/check-alerts | jq
```

### Vercel Cron (production)

The schedule is defined in [vercel.json](vercel.json). Add your `CRON_SECRET` to Vercel environment variables — Vercel automatically sets the `Authorization` header on cron requests.

Default schedule: every 30 minutes for `instant` alerts.
For `daily_digest`, a separate pass at `DAILY_DIGEST_HOUR_UTC` (default 08:00 UTC) can be added.

---

## Vercel Deployment

1. **Push to GitHub** and connect the repo in [Vercel Dashboard](https://vercel.com)

2. **Add environment variables** in Vercel → Project → Settings → Environment Variables
   Copy all values from your `.env.local` (except `NEXT_PUBLIC_APP_URL` — set to your actual domain)

3. **Deploy.** First deploy runs `next build` automatically.

4. **Set `NEXT_PUBLIC_APP_URL`** to your production domain:
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

5. **Register Telegram webhook** (see above)

6. **Switch to real flight provider** when ready:
   ```env
   USE_MOCK_PROVIDER=false
   FLIGHT_PROVIDER=amadeus
   AMADEUS_CLIENT_ID=...
   AMADEUS_CLIENT_SECRET=...
   AMADEUS_HOSTNAME=api.amadeus.com  # use test.api.amadeus.com for sandbox
   ```

---

## Continuous Deployment (GitHub Actions)

The repository can automatically deploy to Vercel on every push to `main` by using a simple GitHub Actions workflow. Add a repository secret named `VERCEL_TOKEN` (create one in your Vercel dashboard under **Account Settings → Tokens**).

Create the file `.github/workflows/vercel-deploy.yml` with the contents shown below. The action will log in using the token and run `vercel --prod`.

```yaml
name: Vercel Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: vercel --prod --confirm
```

(You can also run `npm run deploy` locally using the same token environment.)


---

## Email Notifications (Resend)

Email is the fallback channel when a user hasn't connected their Telegram account. The free Resend tier covers 3,000 emails/month.

### 1. Create a Resend account

1. Sign up at [resend.com](https://resend.com)
2. Dashboard → **API Keys** → **Create API Key**
3. Copy the key → `RESEND_API_KEY`

### 2. Configure sender address

- **Testing (no domain needed):** use Resend's shared address `onboarding@resend.dev` — works out of the box but may land in spam.
- **Production:** add and verify your own domain in Resend → **Domains**, then set `EMAIL_FROM`:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=BizClass Alerts <alerts@yourdomain.com>
```

### 3. How it works

- When a worthy offer is found, `checkAlerts` checks whether the user has a Telegram `chat_id`.
  - **Telegram linked** → creates a `channel: telegram` pending notification.
  - **No Telegram** → creates a `channel: email` pending notification.
- At the end of the cron run, both dispatchers run in sequence:
  - `dispatchPendingNotifications()` — sends Telegram messages.
  - `dispatchPendingEmailNotifications()` — sends HTML emails via Resend.
- Each notification row is marked `sent` or `failed` after the attempt.

---

## Amadeus Flight API Setup

The Amadeus Self-Service sandbox is **free** and requires no approval. Production access requires applying for a live key.

### 1. Create an account and app

1. Go to [developers.amadeus.com](https://developers.amadeus.com) → **My Apps** → **Create new app**
2. Select the **Flight Offers Search** API
3. Copy **API Key** → `AMADEUS_CLIENT_ID`
4. Copy **API Secret** → `AMADEUS_CLIENT_SECRET`

### 2. Configure environment

```env
USE_MOCK_PROVIDER=false
FLIGHT_PROVIDER=amadeus
AMADEUS_CLIENT_ID=<your-api-key>
AMADEUS_CLIENT_SECRET=<your-api-secret>
AMADEUS_HOSTNAME=test.api.amadeus.com   # sandbox
# AMADEUS_HOSTNAME=api.amadeus.com      # production (requires live key approval)
```

### 3. How the adapter works

- **OAuth2 token** is fetched on first use and cached in-process until 60 s before expiry (tokens last 30 min).
- **Flight Offers Search** (`GET /v2/shopping/flight-offers`) — always requests `travelClass=BUSINESS`, 1 adult, up to 20 results.
- **Date range alerts**: the adapter searches `departDateFrom`. For multi-date coverage, create separate alerts per departure date or use the mock provider during development.
- **`isFullBusiness`**: set to `false` if any segment's cabin is not `BUSINESS` (mixed-cabin itineraries).
- **Deep links**: Google Flights deep link — works for all carriers without additional API keys.

### 4. Sandbox limitations

- Returns **test data only** — prices and availability are not real.
- Rate limits: 1 req/s, 2 000 req/month on the free tier.
- Switch `AMADEUS_HOSTNAME=api.amadeus.com` + request live key access for production.

---

## Architecture Notes

```
User → [Next.js App Router]
         ├── /dashboard          Server Component, SSR data fetch
         ├── /alerts/new         Server Action → createAlertAction
         ├── /alerts/[id]        Server Action → updateAlertAction
         ├── /alerts/[id]/history  Server Component, offer list
         └── /profile            Server Component + TelegramConnectCard (client)

Vercel Cron → GET /api/cron/check-alerts
  → checkAlerts()          Fetch active alerts, query provider, dedup, save offers
  → dispatchPending()      Send Telegram notifications for pending rows

Telegram → POST /api/telegram/webhook
  → /start <token>         Links Telegram account to user
```

**Deduplication:** Each offer is hashed as `SHA-256(alertId|origin|destination|departAt[:16]|price|currency|stops|cabin)`. Only new hashes are inserted; existing ones are skipped. This prevents duplicate notifications for the same flight across multiple cron runs.

**Feature flag `USE_MOCK_PROVIDER=true`:** Forces the mock provider regardless of `FLIGHT_PROVIDER`. The mock generates 5–10 realistic offers per alert with varied price tiers (50%–180% of base price), so some will always fall below typical budgets, triggering `below_threshold` notifications. Safe default for local development.

---

## V2 Roadmap

### Real Flight Data
- [ ] **Amadeus Self-Service API** integration (in progress — stub exists in `src/lib/providers/amadeus/`)
- [ ] **Duffel API** integration
- [ ] **Kiwi.com Tequila API** — good for multi-city and round-trip routing
- [ ] Route preference caching — skip routes with no inventory for 30+ days

### Monetization
- [ ] **Paid plans** via Stripe — free tier (3 alerts), Pro (unlimited alerts + instant notify), Premium (+ AI summaries)
- [ ] `planTier` column on users table, enforced in Server Actions
- [ ] Stripe webhook → update user tier on payment events
- [ ] Billing portal page

### Notifications
- [x] **Email notifications** via Resend — fallback when Telegram not connected
- [ ] **WhatsApp** via Twilio
- [ ] **Daily digest** — batch all worthy offers found that day into one message
- [ ] Notification preferences per alert (quiet hours, frequency cap)

### Analytics & Ops
- [ ] **PostHog** or Mixpanel for product analytics (alert creation funnel, notification CTR)
- [ ] **Sentry** for error tracking on cron runs and bot handlers
- [ ] Admin dashboard: cron health, active alerts count, notification delivery rate
- [ ] Structured log export to Datadog / Logtail

### Search Intelligence
- [ ] **Price prediction** — flag offers that are historically cheap for the route
- [ ] **Multi-city** alert support
- [ ] **2+ passengers** support (currently priced per person)
- [ ] Flexible date search (±3 days around target)
- [ ] Nearby airport expansion (e.g., LHR + LGW + STN)

### UX
- [ ] Mobile-optimised PWA with push notifications
- [ ] Alert sharing links (share a route watch with a friend)
- [ ] Price history chart per route (recharts)
- [ ] One-click alert creation from Telegram: `/watch SVO-JFK budget:2500`
