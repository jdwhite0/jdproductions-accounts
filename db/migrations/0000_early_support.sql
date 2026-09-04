-- Early Support ledger (this project only — not ACCESS Supabase).
-- Public copy: Early Support. Code: instrument_type = 'early_support'.
-- Not equity, shares, or securities until counsel papers the instrument.

CREATE TABLE instruments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_type   text NOT NULL CHECK (instrument_type = 'early_support'),
  name              text NOT NULL,
  terms_version     text NOT NULL,
  counsel_status    text NOT NULL DEFAULT 'unpapered'
                    CHECK (counsel_status IN ('unpapered', 'draft', 'executed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instrument_type, terms_version)
);

CREATE TABLE positions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id         text NOT NULL,
  instrument_id         uuid NOT NULL REFERENCES instruments(id),
  amount_cents          integer NOT NULL CHECK (amount_cents > 0),
  currency              text NOT NULL DEFAULT 'usd',
  status                text NOT NULL
                        CHECK (status IN ('pending', 'active', 'refunded', 'void')),
  stripe_checkout_session_id  text UNIQUE,
  stripe_payment_intent_id    text UNIQUE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX positions_clerk_user_id_idx ON positions (clerk_user_id);

-- Append-only. Never UPDATE/DELETE in app code.
CREATE TABLE ledger_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id       uuid NOT NULL REFERENCES positions(id),
  entry_type        text NOT NULL
                    CHECK (entry_type IN (
                      'intent_created',
                      'payment_succeeded',
                      'payment_failed',
                      'refunded',
                      'adjustment'
                    )),
  amount_cents      integer NOT NULL,
  stripe_event_id   text,
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  metadata          jsonb NOT NULL DEFAULT '{}'
);

CREATE UNIQUE INDEX ledger_entries_stripe_event_id_uidx
  ON ledger_entries (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

CREATE TABLE stripe_events (
  stripe_event_id   text PRIMARY KEY,
  type              text NOT NULL,
  processed_at      timestamptz NOT NULL DEFAULT now(),
  payload           jsonb NOT NULL
);
