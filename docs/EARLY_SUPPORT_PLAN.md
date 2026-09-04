# Early Support — plan

**Status:** backend implemented (this PR). Positions / Early Support **UI is
TBD — founder (JD) directs page design** in a later pass. Do not invent a
marketing layout or visual system for these screens.

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

---

## Backend (implemented)

Own Postgres in this project (Vercel Marketplace, Neon, or equivalent —
set `DATABASE_URL` in the Vercel project env UI, not `vercel.json`).
Clerk `user.id` is the account key. No ACCESS schema.

### Schema

See `db/schema.js` and `db/migrations/0000_early_support.sql`.

- `instruments` — `instrument_type` early_support only; `terms_version`;
  `counsel_status` (`unpapered` / `draft` / `executed`)
- `positions` — `clerk_user_id`, `amount_cents`, `currency`, `status`
  (`pending` / `active` / `refunded` / `void`), unique Stripe checkout
  session + payment intent ids, `instrument_id`
- `ledger_entries` — append-only
- `stripe_events` — idempotency key = `stripe_event_id`

Seed (`db/migrations/0001_seed_early_support.sql` / `npm run db:seed`):
one `early_support` instrument, `terms_version = early_support_v0`,
`counsel_status = unpapered`.

### API (`api/` Vercel serverless)

`vercel.json` SPA rewrite excludes `/api/*`.

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/api/stripe/checkout` | Clerk Bearer (`CLERK_SECRET_KEY`) | Creates a Checkout Session with metadata `{ instrument_type: 'early_support', clerk_user_id }`. May write a **pending** position + `intent_created`. Never writes `active`. |
| POST | `/api/stripe/webhook` | Stripe-Signature (`STRIPE_WEBHOOK_SECRET`) | Verify first. Idempotent insert `stripe_events`, then upsert position + ledger. Handles `checkout.session.completed`, `payment_intent.succeeded` / `payment_intent.payment_failed`, `charge.refunded`. |
| GET | `/api/positions` | Clerk Bearer | Current user's positions only. |

**Fail closed:** no `active` position without a verified webhook. Invalid
signatures never touch the ledger. Checkout success in the browser is not
money truth.

Do **not** send early-support events through
`getaccess.world/api/stripe/*`. Existing ACCESS checkout in
`src/hooks/useStripe.js` is legacy member billing — leave it until a
later migration; do not reuse it for this ledger.

### Server-only env (never `VITE_`)

Set in the Vercel project Environment Variables UI (Sensitive):

- `DATABASE_URL`
- `STRIPE_SECRET_KEY` (restricted key preferred)
- `STRIPE_WEBHOOK_SECRET`
- `CLERK_SECRET_KEY` (verify session JWTs; do not rotate the shared pool)
- Optional: `STRIPE_PRICE_ID`, `EARLY_SUPPORT_AMOUNT_CENTS`,
  `EARLY_SUPPORT_MIN_AMOUNT_CENTS`, `EARLY_SUPPORT_MAX_AMOUNT_CENTS`,
  `EARLY_SUPPORT_TERMS_VERSION`, `EARLY_SUPPORT_SUCCESS_URL`,
  `EARLY_SUPPORT_CANCEL_URL`

Clerk publishable key stays `pk_test` mighty-owl for now. Do not migrate
to `pk_live` in this change.

### Run

```bash
# after DATABASE_URL is set
npm run db:migrate   # applies db/migrations/*.sql
npm run db:seed      # idempotent early_support_v0 instrument
npm test             # webhook signature + idempotency + fail-closed
```

Webhook locally (Stripe CLI), after `npx vercel dev` or a preview URL:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# endpoint for production: https://accounts.jdproductions.io/api/stripe/webhook
# events: checkout.session.completed, payment_intent.succeeded,
#         payment_intent.payment_failed, charge.refunded
```

---

## Positions UI — TBD (founder)

Temporary stubs only (plain text: `UI TBD — backend ready`):

- `/positions` — `src/views/stubs/positions.jsx`
- `/admin/positions` — `src/views/stubs/admin-positions.jsx` (RoleGuard)

JD will direct layout, copy, and visual system. Suggested later routes
(do not polish now):

- `/positions` — member list of own `early_support` positions + running
  total (copy: “Early Support”, never “shares”)
- `/account` — link into Positions
- `/admin/positions` — founder-only roster (existing `RoleGuard`)

Do not add ACCESS imports. Do not show token balances (that is `jdp-saas`).

---

## Remaining checklist

- [x] Provision schema + migrations in this repo
- [x] `api/stripe/webhook` + checkout + GET positions
- [x] Fail closed: active only from verified webhook
- [x] Seed `early_support_v0`
- [x] Tests for signature reject + webhook idempotency
- [ ] Provision `DATABASE_URL` + Stripe webhook on the Vercel project (human)
- [ ] Positions UI + founder roster (JD design pass)
- [ ] Counsel review of user-facing copy before any live charge

Connection table stays at 4 rows (AGENTS.md). Stripe/DB remain column 4.

## Out of scope here

ACCESS Gift/subscriptions, JYSON usage tiers, JDP token, equity round
mechanics, a separate capital repo, Clerk pool/key migration, polished
Early Support / Positions page design.
