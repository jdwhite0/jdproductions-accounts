# Early Support — plan (stub)

**Status:** design only. Implement in a follow-up PR. Do not ship ledger,
webhooks, or Positions UI in the docs/cleanup change.

**Legal:** public copy says **Early Support**, not equity, shares, stock,
securities, or “investment,” until counsel papers the instrument. Code
uses `instrument_type = 'early_support'`.

**Where:** this repo / this Vercel project (`accounts.jdproductions.io`).
**Not** ACCESS Supabase. **Not** a separate capital repo (deleted).

---

## Goal

Members can hold an **early_support** position on their JD Productions
Accounts profile. Stripe events in **this** app append an append-only
ledger. Founder can see positions without opening ACCESS.

## Proposed schema (sketch)

Own database in this project (Postgres via Vercel Marketplace, Neon, or
equivalent — pick in the implementation PR). Clerk `user.id` is the
account key. No ACCESS schema.

```sql
-- What counsel will eventually paper. Until then this is support capital,
-- not equity.
CREATE TABLE instruments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_type   text NOT NULL CHECK (instrument_type = 'early_support'),
  name              text NOT NULL,
  terms_version     text NOT NULL,
  counsel_status    text NOT NULL DEFAULT 'unpapered'
                    CHECK (counsel_status IN ('unpapered', 'draft', 'executed')),
  created_at        timestamptz NOT NULL DEFAULT now()
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
  stripe_payment_intent_id    text,
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

CREATE TABLE stripe_events (
  stripe_event_id   text PRIMARY KEY,
  type              text NOT NULL,
  processed_at      timestamptz NOT NULL DEFAULT now(),
  payload           jsonb NOT NULL
);
```

## Stripe in this app (not ACCESS)

Add Vercel serverless routes under root `api/` (same pattern as JYSON’s
door). Implementation PR should:

1. `api/stripe/webhook.js` (or `.ts`) — verify `STRIPE_WEBHOOK_SECRET`,
   idempotently insert `stripe_events`, then append `ledger_entries` and
   upsert `positions`. Handle at least
   `checkout.session.completed` and `payment_intent.succeeded` /
   `charge.refunded`.
2. `api/stripe/checkout.js` — authenticated (Clerk) session that creates a
   Checkout Session with metadata
   `{ instrument_type: 'early_support', clerk_user_id }`.
3. Server-only env (never `VITE_`): `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`.
4. SPA catch-all in `vercel.json` currently rewrites `/(.*)` →
   `/index.html`. Confirm Vercel serves `/api/*` functions **before** that
   rewrite; if not, exclude `/api/:path*`.

Do **not** send early-support events through
`getaccess.world/api/stripe/*`. Existing ACCESS checkout in
`src/hooks/useStripe.js` is legacy member billing — leave it until a
later migration; do not reuse it for this ledger.

## Positions UI (accounts)

Follow-up routes under the signed-in shell (names TBD, suggested):

- `/positions` — member list of own `early_support` positions + running
  total (copy: “Early Support”, never “shares”).
- `/account` — link into Positions.
- `/admin/positions` — founder-only roster (existing `RoleGuard`).

Do not add ACCESS imports. Do not show token balances (that is `jdp-saas`).

## Implementation PR checklist (next, not this PR)

- [ ] Provision DB; commit migrations in this repo
- [ ] `api/stripe/webhook` + checkout; webhook registered on **this**
      Stripe endpoint URL
- [ ] Positions UI + founder roster
- [ ] Counsel review of user-facing copy before any live charge
- [ ] Update `AGENTS.md` if the connection table grows (it should not:
      Stripe/DB stay in column 4)

## Out of scope here

ACCESS Gift/subscriptions, JYSON usage tiers, JDP token, equity round
mechanics, a separate capital repo.
