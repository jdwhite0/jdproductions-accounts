# Early Support — plan

**Status:** guest checkout + ledger + itemized invoice + title-band UI
(this PR). Official wording: [EARLY_SUPPORT_OFFICIAL_COPY_v0.md](./EARLY_SUPPORT_OFFICIAL_COPY_v0.md).

**Legal:** public copy says **Early Support**, not equity, shares, stock,
securities, angel, or “investment,” until counsel papers the instrument. Code
uses `instrument_type = 'early_support'` and stamps `early_support_v0`.

**Where:** this repo / this Vercel project (`accounts.jdproductions.io`).
**Not** ACCESS Supabase. **Not** a separate capital repo (deleted).

---

## Goal

Anyone can make an **Early Support** payment (**pay first, account optional**).
Stripe Checkout collects the payment (guest email on Stripe). A verified
webhook on **this** app is money truth: it activates the position, appends the
ledger, and sends an itemized Stripe Invoice. Checkout also emails a receipt.
After pay, the supporter may create a Clerk login and **claim** guest
positions that match a verified email.

---

## Flow

1. Belief page `/early-support` (also `/invest` → same). Amount picker
   (Starter $100, Standard $250, Anchor $500, Custom). Email required.
   Continue accepts Terms + Privacy (`early_support_v0`).
2. `POST /api/stripe/checkout` — **unauthenticated guest OK**. Signed-in
   requests may send a Clerk Bearer and pre-fill `clerk_user_id`. Metadata
   always includes `instrument_type=early_support`, `terms_version=early_support_v0`,
   `tier`, `email`, and optional `clerk_user_id`.
3. Stripe Checkout (guest email, `customer_creation=always`, receipt email).
4. Browser success `/early-support/success` — thank-you + receipt/invoice note
   + optional create-login / claim CTA. **Does not activate.**
5. `POST /api/stripe/webhook` — verify signature first. On paid
   `checkout.session.completed` / `payment_intent.succeeded`: upsert position
   (`pending` → `active` only when paid), ledger `payment_succeeded`, then
   create/finalize/send an itemized invoice (`paid_out_of_band` so Checkout is
   not charged twice). Idempotent (`stripe_events` + `stripe_invoice_id`).
6. Optional: Clerk register/login → `POST /api/positions/claim` matches
   verified email to guest `supporter_email`. `GET /api/positions` is
   fail-closed without Clerk.

---

## Backend

Own Postgres in this project (Vercel Marketplace, Neon, or equivalent —
set `DATABASE_URL` in the Vercel project env UI, not `vercel.json`).
Guest identity is `supporter_email`. Clerk `user.id` is optional until claim.
No ACCESS schema.

### Schema

See `db/schema.js` and `db/migrations/0000_early_support.sql` +
`0002_guest_early_support.sql`.

- `instruments` — `instrument_type` early_support only; `terms_version`;
  `counsel_status` (`unpapered` / `draft` / `executed`)
- `positions` — nullable `clerk_user_id`, `supporter_email`, `tier`,
  `amount_cents`, `status` (`pending` / `active` / `refunded` / `void`),
  Stripe checkout / payment / customer / invoice ids
- `ledger_entries` — append-only
- `stripe_events` — idempotency key = `stripe_event_id`

Seed: one `early_support` instrument, `terms_version = early_support_v0`,
`counsel_status = unpapered`.

### API (`api/` Vercel serverless)

`vercel.json` SPA rewrite excludes `/api/*`.

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/api/stripe/checkout` | Optional Clerk Bearer | Guest: validated email + amount/tier. Signed-in: may pre-fill `clerk_user_id`. Writes **pending** + `intent_created` only. Never writes `active`. |
| POST | `/api/stripe/webhook` | Stripe-Signature (`STRIPE_WEBHOOK_SECRET`) | Verify first. Idempotent insert `stripe_events`, then upsert position + ledger. On paid success, itemized invoice create/finalize/send. Handles `checkout.session.completed`, `payment_intent.succeeded` / `payment_failed`, `charge.refunded`. |
| GET | `/api/positions` | Clerk Bearer **required** (fail closed) | Current user's positions + derived activity. |
| POST | `/api/positions/claim` | Clerk Bearer **required** | Attach guest positions whose `supporter_email` matches a **verified** Clerk email. |

**Fail closed:** no `active` position without a verified webhook. Invalid
signatures never touch the ledger. Checkout success in the browser is not
money truth. Events with neither email nor `clerk_user_id` are ignored.

Do **not** send early-support events through
`getaccess.world/api/stripe/*`. Existing ACCESS checkout in
`src/hooks/useStripe.js` is legacy member billing — leave it; do not reuse
it for this ledger.

### Server-only env (never `VITE_`)

Set in the Vercel project Environment Variables UI (Sensitive):

- `DATABASE_URL`
- `STRIPE_SECRET_KEY` (restricted key preferred)
- `STRIPE_WEBHOOK_SECRET`
- `CLERK_SECRET_KEY` (verify session JWTs; do not rotate the shared pool)
- Optional: `EARLY_SUPPORT_MIN_AMOUNT_CENTS`, `EARLY_SUPPORT_MAX_AMOUNT_CENTS`,
  `EARLY_SUPPORT_AMOUNT_CENTS` (custom fallback),
  `EARLY_SUPPORT_TERMS_VERSION`, `ACCOUNTS_APP_URL`,
  `EARLY_SUPPORT_SUCCESS_URL`, `EARLY_SUPPORT_CANCEL_URL`,
  `EARLY_SUPPORT_TERMS_URL`, `EARLY_SUPPORT_PRIVACY_URL`,
  `EARLY_SUPPORT_SUPPORT_EMAIL`

Clerk publishable key stays `pk_test` mighty-owl for now. Do not migrate
to `pk_live` in this change.

### Run

```bash
# after DATABASE_URL is set
npm run db:migrate   # applies db/migrations/*.sql
npm run db:seed      # idempotent early_support_v0 instrument
npm test             # signature, idempotency, guest metadata, claim, invoices, fail-closed
```

Webhook locally (Stripe CLI), after `npx vercel dev` or a preview URL:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# endpoint for production: https://accounts.jdproductions.io/api/stripe/webhook
# events: checkout.session.completed, payment_intent.succeeded,
#         payment_intent.payment_failed, charge.refunded
```

Do not invent live Stripe charges in CI. Invoice helpers are unit-tested
with builders + skipped-send cases.

---

## UI (title-band galaxy)

Visual lock: **Solution B title-band** — vivid Hubble NGC 1300 strip behind
the headline only, solid edges (no milky feather mask), light/white type on
the dark band, gold eyebrow. Same `galaxy-band.jpg` with a slow Ken Burns
drift plus a quiet starfield / soft comets (static if
`prefers-reduced-motion`). Rest of UI is clean white. Nav uses the exact
jdproductions.io lockup (`nav-full.png` → scrolled `nav-jd-gold.png`).
Fonts: Inter for UI and the title-band H1 (weight 800, tracking ~-0.036em).
Do not use Instrument Serif on the Early Support headline. Brand hex: navy
`#002244`, gold `#FFC20E` (hairline/mark only), ink `#0A0A0C`, secondary
`#51545C`, bg `#FFFFFF`, soft `#F7F7F8`. Solid readable cards — not milky
glass.

| Route | Who | What |
|---|---|---|
| `/early-support` | public | Belief + amount picker + guest checkout |
| `/invest` | public | Redirect to `/early-support` |
| `/early-support/success` | public | Thank you; receipt/invoice note; claim CTA |
| `/early-support/terms` | public | Terms `early_support_v0` |
| `/early-support/privacy` | public | Early Support privacy addendum |
| `/positions` | signed-in | Positions from API (empty / pending / active) |
| `/admin/positions` | founder | Stub roster (unchanged) |

---

## Remaining checklist

- [x] Schema + migrations (including guest email / nullable clerk id)
- [x] Guest + signed-in checkout
- [x] Webhook fail closed; active only from verified paid events
- [x] Itemized invoice helpers for all tiers
- [x] Claim by verified email
- [x] Title-band belief / success / terms / privacy / positions UI
- [x] Tests: guest metadata, claim matching, invoice lines, fail-closed auth
- [ ] Provision `DATABASE_URL` + Stripe webhook + invoice-capable restricted
      key on the Vercel project (human)
- [ ] Counsel review of user-facing copy before any live charge

Connection table stays at 4 rows (AGENTS.md). Stripe/DB remain column 4.
No ACCESS Clerk pool / dashboard / redirect changes.

## Out of scope here

ACCESS Gift/subscriptions, JYSON usage tiers, JDP token, equity round
mechanics, a separate capital repo, Clerk pool/key migration.
