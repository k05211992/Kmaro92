-- =============================================================================
-- BizClass Alerts — initial schema
-- Apply via Supabase SQL editor OR: npx prisma migrate dev --name init
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE alert_status      AS ENUM ('active', 'paused', 'archived');
CREATE TYPE trip_type         AS ENUM ('one_way', 'round_trip');
CREATE TYPE notif_frequency   AS ENUM ('instant', 'daily_digest');
CREATE TYPE notif_channel     AS ENUM ('telegram', 'email');
CREATE TYPE notif_reason      AS ENUM ('below_threshold', 'price_drop');
CREATE TYPE notif_status      AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE search_run_status AS ENUM ('ok', 'empty', 'error');

-- =============================================================================
-- TABLE: users
-- Extends Supabase auth.users (same PK UUID).
-- Prisma and server-side code use service_role and bypass RLS.
-- =============================================================================

CREATE TABLE users (
  id                       UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                    TEXT        NOT NULL UNIQUE,
  telegram_chat_id         BIGINT,
  telegram_username        TEXT,
  -- Short-lived token the user sends to the bot to complete linking.
  telegram_link_token      TEXT,
  telegram_link_expires_at TIMESTAMPTZ,
  telegram_connected_at    TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_telegram_chat_id    ON users (telegram_chat_id)    WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX idx_users_telegram_link_token ON users (telegram_link_token) WHERE telegram_link_token IS NOT NULL;

-- =============================================================================
-- TABLE: alerts
-- =============================================================================

CREATE TABLE alerts (
  id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status               alert_status    NOT NULL DEFAULT 'active',

  -- Route
  origin               VARCHAR(10)     NOT NULL,   -- IATA code, e.g. SVO
  destination          VARCHAR(10)     NOT NULL,   -- IATA code, e.g. JFK

  -- Dates
  trip_type            trip_type       NOT NULL,
  depart_date_from     DATE            NOT NULL,
  depart_date_to       DATE,                       -- NULL = exact date
  return_date_from     DATE,                       -- NULL for one_way
  return_date_to       DATE,

  -- Price criteria
  cabin_class          VARCHAR(20)     NOT NULL DEFAULT 'business',
  max_price            NUMERIC(10,2)   NOT NULL    CHECK (max_price > 0),
  currency             CHAR(3)         NOT NULL,   -- EUR | USD

  -- Filters
  max_stops            SMALLINT        NOT NULL DEFAULT 1 CHECK (max_stops BETWEEN 0 AND 2),
  max_duration_minutes INT                         CHECK (max_duration_minutes > 0),
  nearby_airports      BOOLEAN         NOT NULL DEFAULT false,

  -- Notification settings
  notif_frequency      notif_frequency NOT NULL DEFAULT 'instant',

  -- Tracking
  last_checked_at      TIMESTAMPTZ,
  best_price_seen      NUMERIC(10,2),

  created_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),

  -- Destination must differ from origin
  CONSTRAINT chk_origin_ne_destination CHECK (origin <> destination),
  -- Return dates only valid for round_trip
  CONSTRAINT chk_return_requires_round_trip
    CHECK (return_date_from IS NULL OR trip_type = 'round_trip')
);

CREATE INDEX idx_alerts_user_status     ON alerts (user_id, status);
CREATE INDEX idx_alerts_last_checked_at ON alerts (last_checked_at NULLS FIRST);

-- =============================================================================
-- TABLE: search_runs
-- One row per cron execution for a single alert.
-- Allows debugging and auditing of what the cron actually did.
-- =============================================================================

CREATE TABLE search_runs (
  id                 UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id           UUID              NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  provider           VARCHAR(50)       NOT NULL,   -- 'mock' | 'amadeus' | 'duffel'
  run_at             TIMESTAMPTZ       NOT NULL DEFAULT now(),
  duration_ms        INT,                          -- wall-clock time of the provider call
  raw_results_count  INT               NOT NULL DEFAULT 0,   -- total from provider
  filtered_count     INT               NOT NULL DEFAULT 0,   -- after applying alert filters
  worthy_count       INT               NOT NULL DEFAULT 0,   -- passed worthyToNotify()
  status             search_run_status NOT NULL DEFAULT 'ok',
  error_message      TEXT
);

-- Primary access pattern: "recent runs for this alert"
CREATE INDEX idx_search_runs_alert_run_at ON search_runs (alert_id, run_at DESC);

-- =============================================================================
-- TABLE: flight_offers
-- =============================================================================

CREATE TABLE flight_offers (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id         UUID          NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  search_run_id    UUID          REFERENCES search_runs(id) ON DELETE SET NULL,
  provider         VARCHAR(50)   NOT NULL,

  -- Itinerary
  origin           VARCHAR(10)   NOT NULL,
  destination      VARCHAR(10)   NOT NULL,
  depart_at        TIMESTAMPTZ   NOT NULL,
  arrive_at        TIMESTAMPTZ   NOT NULL,
  return_depart_at TIMESTAMPTZ,
  return_arrive_at TIMESTAMPTZ,

  -- Pricing
  price            NUMERIC(10,2) NOT NULL,
  currency         CHAR(3)       NOT NULL,

  -- Flight details
  stops            SMALLINT      NOT NULL,
  duration_minutes INT           NOT NULL,
  is_full_business BOOLEAN       NOT NULL DEFAULT true,
  airline_codes    TEXT[]        NOT NULL DEFAULT '{}',

  -- Booking
  deep_link        TEXT          NOT NULL,
  raw_data         JSONB         NOT NULL DEFAULT '{}',

  -- Deduplication: SHA-256(alertId|origin|dest|departAt[min]|price|currency|stops|cabin)
  hash_for_dedup   VARCHAR(64)   NOT NULL UNIQUE,

  found_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_flight_offers_alert_id     ON flight_offers (alert_id, found_at DESC);
CREATE INDEX idx_flight_offers_search_run   ON flight_offers (search_run_id);
-- Partial index — the unique constraint covers all rows, but we also
-- want a fast lookup to check "have we seen this hash" on insert.
CREATE INDEX idx_flight_offers_hash_dedup   ON flight_offers (hash_for_dedup);

-- =============================================================================
-- TABLE: notifications
-- Audit log of every attempt to notify a user.
-- =============================================================================

CREATE TABLE notifications (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id      UUID          NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  offer_id      UUID          NOT NULL REFERENCES flight_offers(id) ON DELETE CASCADE,
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel       notif_channel NOT NULL,
  reason        notif_reason  NOT NULL,
  ai_insight    TEXT,
  status        notif_status  NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- "Show me recent notifications for this alert" — the main list query
CREATE INDEX idx_notifications_alert_sent_at ON notifications (alert_id, sent_at DESC NULLS LAST);
-- "Has this offer already been sent?" — dedup check before sending
CREATE INDEX idx_notifications_offer_channel ON notifications (offer_id, channel)
  WHERE status = 'sent';

-- =============================================================================
-- TRIGGERS: updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Note: Prisma connects via the service_role key (in DATABASE_URL) which
-- bypasses RLS entirely. RLS protects the anon/authenticated REST API and
-- the Supabase client used in Server Components.
-- =============================================================================

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_offers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────────────────────

-- SELECT / UPDATE own row
CREATE POLICY users_select_self ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update_self ON users FOR UPDATE USING (id = auth.uid());

-- Server-side upsert (service_role bypasses RLS, but belt-and-suspenders):
CREATE POLICY users_insert_self ON users FOR INSERT WITH CHECK (id = auth.uid());

-- ── alerts ────────────────────────────────────────────────────────────────────

CREATE POLICY alerts_select_owner ON alerts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY alerts_insert_owner ON alerts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY alerts_update_owner ON alerts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY alerts_delete_owner ON alerts FOR DELETE USING (user_id = auth.uid());

-- ── search_runs ───────────────────────────────────────────────────────────────
-- Read-only for users; writes only from service_role (cron).

CREATE POLICY search_runs_select_owner ON search_runs FOR SELECT
  USING (alert_id IN (SELECT id FROM alerts WHERE user_id = auth.uid()));

-- ── flight_offers ─────────────────────────────────────────────────────────────

CREATE POLICY offers_select_owner ON flight_offers FOR SELECT
  USING (alert_id IN (SELECT id FROM alerts WHERE user_id = auth.uid()));

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE POLICY notifs_select_owner ON notifications FOR SELECT USING (user_id = auth.uid());

-- =============================================================================
-- HELPER VIEW: alert_summary
-- Convenient read-only view for the dashboard — joins the last run and
-- best price without extra client-side queries.
-- =============================================================================

CREATE VIEW alert_summary AS
SELECT
  a.*,
  (
    SELECT count(*)
    FROM flight_offers fo
    WHERE fo.alert_id = a.id
  )                                       AS total_offers_found,
  (
    SELECT run_at
    FROM search_runs sr
    WHERE sr.alert_id = a.id
    ORDER BY sr.run_at DESC
    LIMIT 1
  )                                       AS last_run_at,
  (
    SELECT status
    FROM search_runs sr
    WHERE sr.alert_id = a.id
    ORDER BY sr.run_at DESC
    LIMIT 1
  )                                       AS last_run_status
FROM alerts a;

-- Grant select on view to authenticated role
GRANT SELECT ON alert_summary TO authenticated;
