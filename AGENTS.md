# JD Productions Accounts — Agent Guardrails & Connection Contract

**Read this before changing anything in this repo.** It exists so any AI
collaborator (Claude, ChatGPT, Cursor, etc.) — or human — can work here
without breaking live auth, ACCESS, Clerk, or the marketing-site Sign In
bridge.

GitHub repo name: **`jdproductions-accounts`** (renamed from `jdproductions-saas`).
Vercel project: **`jdproductions-accounts`**. Product name: **JD Productions Accounts**.
Local folder may still be `apps/saas` — that is fine.

Also see `docs/REPOS_MAP.md` and `docs/EARLY_SUPPORT_PLAN.md`.

---

## 1. What this repo IS (and is not)

**This is the ONE company app** for JD Productions Inc.:

- **Accounts gateway** — sign-in / sign-up for the company, live at
  `https://accounts.jdproductions.io` (this Vercel project).
- **Early-support capital** — the ledger, Stripe webhooks, and Positions UI
  for `instrument_type=early_support` belong **here**. The old `jdproductions-capital` seed was **deleted**; do not recreate it.

**This is NOT:**

| Not this | That lives in |
|---|---|
| ACCESS (platform / workspace product) | `jdwhite0/access-app` · getaccess.world |
| JYSON (chat product people talk to) | `jdwhite0/jyson` |
| Marketing site | `jdwhite0/jdproductions-website` · jdproductions.io |
| JDP token holder app | `jdwhite0/jdp-saas` |

They **connect** (see §2). They must **never be merged, cross-imported, or
share a build**. This app must build and deploy with zero dependency on the
ACCESS, JYSON, website, or jdp-saas repos being present.

---

## 2. The connection contract (the ONLY approved couplings)

| # | Connection | Mechanism | Direction | Secret? |
|---|---|---|---|---|
| 1 | **Shared Clerk identity** | Same Clerk application / pool as ACCESS, via `VITE_CLERK_PUBLISHABLE_KEY`. This origin hosts embedded `<SignIn>` / `<SignUp>` so the SaaS portal (`/dashboard`) gets a first-party session. Magic-link completion still belongs on getaccess.world (click-only). Clerk cannot register `accounts.jdproductions.io` as a satellite (`reserved_subdomain`). | consume only | Publishable key is public. Secret key, if ever added, is server-only (`CLERK_SECRET_KEY`, never `VITE_`) |
| 2 | **Marketing iframe bridge** | Hidden iframe on jdproductions.io loads `/auth/bridge`; this app `postMessage`s `{ type: 'jdp_auth', ... }` | this app → marketing parents | No |
| 3 | **ACCESS doors** | Optional click-only URLs to `https://getaccess.world/sign-in` (magic-link) and `https://getaccess.world/` (waitlist). **Never auto-redirect** `/auth/login` on page load (no shared session cookie → infinite loop). | this app → ACCESS | No (public URLs) |
| 4 | **Early-support ledger** | Own Postgres + Stripe webhooks **in this project** (`api/` Vercel serverless). Not ACCESS Supabase. | this app only | Stripe secret + webhook secret + `DATABASE_URL` + `CLERK_SECRET_KEY` are server-only |

Anything outside these four is **not** an approved connection. Do not add new
coupling without updating this contract in the same commit.

### 2.1 Clerk — consume only, never configure

- Use the env publishable key. Do **not** create/edit Clerk applications,
  instances, redirect URLs, allowed origins, or the shared pool.
- Do **not** open the Clerk dashboard to “fix” auth. If auth is broken, stop
  and ask a human. ACCESS owns Clerk configuration.
- `ClerkProvider` in `src/main.jsx` must keep `signInUrl="/auth/login"`,
  `signUpUrl="/auth/register"`, `afterSignOutUrl="/auth/login"`. Do **not**
  set `isSatellite` — Clerk cannot register `accounts.jdproductions.io` as
  a satellite (`reserved_subdomain`); satellite handshake loops forever.
  Do **not** fall back to `pk_test_` / mighty-owl-15.
- Live routes that must keep working: `/auth/login`, `/auth/register`,
  `/auth/bridge`. Login and register embed Clerk widgets (hash routing) on
  this origin, then send authenticated users to `/dashboard` (or `?next=`).
  Bridge payload is unchanged.
- **Never auto-redirect** `/auth/login` or `/auth/register` to
  `getaccess.world` on page load. Clerk session cookies are not shared
  across those domains, so ACCESS returning a signed-out Accounts user
  loops forever. ACCESS magic-link is click-only.

### 2.2 Marketing iframe bridge — do not break

Marketing (`jdproductions-website`) embeds:

```
iframe.src = 'https://accounts.jdproductions.io/auth/bridge'
```

Listener (parent): `e.origin === 'https://accounts.jdproductions.io'` and
`e.data.type === 'jdp_auth'`.

This app (`src/views/auth/bridge.jsx`) posts to allowlisted parents:

- `https://jdproductions.io` / `https://www.jdproductions.io`
- `https://jdwhite.world` / `https://www.jdwhite.world`

Payload shape (do not rename fields without updating the website in the same
change):

```js
// signed in
{ type: 'jdp_auth', signedIn: true, imageUrl, firstName, fullName }
// signed out
{ type: 'jdp_auth', signedIn: false }
```

Marketing Sign In buttons point at this app
(`https://accounts.jdproductions.io/auth/login`). After Clerk auth, users
land on `/dashboard`. The iframe bridge then reports `jdp_auth` to
jdproductions.io.

### 2.3 Transitional ACCESS HTTP calls (legacy — do not grow)

Some screens still `fetch` getaccess.world APIs (billing checkout, member
JYSON proxy, concierge, founder admin). Those calls are **legacy**, not
contract items. Do not add new ACCESS API dependencies. Do not import
`access-app` source. Early-support Stripe/ledger must land in **this** repo
(`api/` + own DB), not ACCESS Supabase.

---

## 3. Secrets & env rules (NON-NEGOTIABLE)

- **`VITE_`-prefixed vars are PUBLIC** — Vite inlines them into the client
  bundle. Never put a secret behind a `VITE_` prefix.
  - Public/OK: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_ACCESS_URL`,
    `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_APP_NAME`.
  - **Secrets (server-only, NO `VITE_`, `api/` + `db/` only):**
    `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLERK_SECRET_KEY`,
    `DATABASE_URL`. Set them in the Vercel project env UI — do not bake
    secrets into `vercel.json`.
- Production uses Vercel-managed env vars. Do not bake local `.env` into a
  deploy.
- Do not rotate, replace, or “upgrade” Clerk keys as part of a docs or
  feature PR.

---

## 4. Hard bans (without explicit human sign-off)

- ❌ Edit Clerk dashboard / apps / redirects / pool / instance settings.
- ❌ Import `access-app` (or any ACCESS) source into this repo.
- ❌ Merge this app into ACCESS, or ACCESS into this app.
- ❌ Treat Early Support copy as equity, shares, securities, or an
  investment offering until counsel papers the instrument.
- ❌ Recreate or build capital/ledger in a separate capital repo (deleted).
- ❌ Delete or “simplify” `/auth/login`, `/auth/register`, `/auth/bridge`,
  `ClerkProvider`, or the `jdp_auth` postMessage contract.
- ❌ Put secrets behind `VITE_`.
- ❌ Use ACCESS Supabase as the early-support ledger.

---

## 5. Template leftovers (SaasAble)

This Vite/React app was bootstrapped from PhoenixCoded **SaasAble**. The
**live app is root `src/`**. These trees are **not** the product:

- `admin/` — unused Next.js + Vite template copies
- `uikit/` — unused React + Tailwind UI kit copies

Do not import them. Do not treat their READMEs as product docs. Do not
delete them in a drive-by cleanup unless a human confirms nothing links
them. They are excluded from the Vercel upload via `.vercelignore`.

Unused Clerk-era leftovers inside `src/` (not wired to live routes):
`src/sections/auth/AuthLogin.jsx`, `AuthRegister.jsx`, `AuthSocial.jsx`.
Live auth is embedded Clerk in `src/views/auth/` (ACCESS pool, this origin).

---

## 6. Brand naming (public vs legal)

- **JD Productions Accounts** — this product (accounts + early-support).
- **JD Productions Inc.** — parent company / legal entity.
- **JDAI** — public/product-facing master brand on consumer surfaces.
- **ACCESS** — separate product; link out, do not absorb.
- **JYSON** — separate product; this repo may *link* to it, not *be* it.
- **Early Support** — support capital instrument. Not equity until counsel
  says the papers say so.

---

## 7. Build & deploy

- Stack: Vite + React 19 + MUI, Clerk for auth, Vercel static output
  (`dist/`) plus `api/` serverless routes (Early Support ledger).
- Local: `npm install` → `npm run start` → http://localhost:5173
- Live: `https://accounts.jdproductions.io` (GitHub repo `jdproductions-accounts`).
- Alias: `https://invest.jdproductions.io` — Host-aware `/` serves Early Support
  (not ProtectedAdmin `/dashboard`). `accounts.` `/` is unchanged. DNS at
  Google Domains still required: `invest` CNAME →
  `ba5acd7daa29209d.vercel-dns-017.com`.
- Do not rename the GitHub repository without a documented Vercel reconnect.
- After changing auth or the bridge, verify `/auth/login` and `/auth/register`
  load **without** bouncing to ACCESS, that the Clerk widget renders, that
  a successful sign-in lands on `/dashboard`, and that ACCESS `/sign-in`
  still renders.

---

## 8. Early Support paths

Backend and title-band UI live in this repo. Official copy:
`docs/EARLY_SUPPORT_OFFICIAL_COPY_v0.md`. Visual lock: title-band galaxy
behind the headline only (same Hubble crop, slow Ken Burns + soft
starfield; static if reduced-motion); bold Inter title (not Instrument
Serif); white cards; brand hex navy `#002244` / gold `#FFC20E`. Flow:
**pay first, account optional**.

| Path | Role |
|---|---|
| `db/schema.js` + `db/migrations/` | Own Postgres schema (`early_support` only; guest email; nullable `clerk_user_id`) |
| `db/migrate.js` / `db/seed.js` | `npm run db:migrate` · `npm run db:seed` |
| `api/stripe/checkout.js` | POST Checkout Session — guest email OK; optional Clerk Bearer |
| `api/stripe/webhook.js` | POST Stripe webhook (signature required; fail closed; itemized invoice) |
| `api/positions.js` | GET current user's positions (Clerk Bearer required) |
| `api/positions/claim.js` | POST claim guest positions by verified email (Clerk Bearer required) |
| `lib/early-support/` | Shared ledger, checkout metadata, invoice builders, claim (unit-tested) |
| `/early-support` | Public belief + checkout |
| `/` on `invest.jdproductions.io` (and `www.invest.`) | Same Early Support landing; do not send to `/dashboard` |
| `/positions` | Signed-in Positions (empty / pending / active) |

Money truth = verified Stripe webhook + this project's DB. Checkout may
write `pending` + `intent_created` only. **Never** mark a position `active`
without a verified webhook. Browser success never activates.

---

*If you change the connection contract, update this file in the same commit.*
