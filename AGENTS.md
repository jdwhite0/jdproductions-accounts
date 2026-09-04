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
| 1 | **Shared Clerk identity** | Same Clerk application / pool as ACCESS, via `VITE_CLERK_PUBLISHABLE_KEY` | consume only | Publishable key is public. Secret key, if ever added, is server-only (`CLERK_SECRET_KEY`, never `VITE_`) |
| 2 | **Marketing iframe bridge** | Hidden iframe on jdproductions.io loads `/auth/bridge`; this app `postMessage`s `{ type: 'jdp_auth', ... }` | this app → marketing parents | No |
| 3 | **Optional outbound links** | Plain URLs to `https://getaccess.world` and `https://jdproductions.io` | this app → those sites | No (public URLs) |
| 4 | **Early-support ledger (future)** | Own DB + Stripe webhooks **in this project** (`api/` Vercel serverless). Not ACCESS Supabase. | this app only | Stripe secret + webhook secret are server-only |

Anything outside these four is **not** an approved connection. Do not add new
coupling without updating this contract in the same commit.

### 2.1 Clerk — consume only, never configure

- Use the env publishable key. Do **not** create/edit Clerk applications,
  instances, redirect URLs, allowed origins, or the shared pool.
- Do **not** open the Clerk dashboard to “fix” auth. If auth is broken, stop
  and ask a human. ACCESS owns Clerk configuration.
- `ClerkProvider` in `src/main.jsx` must keep `signInUrl="/auth/login"`,
  `signUpUrl="/auth/register"`, `afterSignOutUrl="/auth/login"`.
- Live routes that must keep working: `/auth/login`, `/auth/register`,
  `/auth/bridge`.

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

Marketing Sign In buttons point at `/auth/login` on this domain.

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
  - **Secrets (server-only, NO `VITE_`, future `api/` only):**
    `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLERK_SECRET_KEY`,
    database URLs.
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
Live auth is Clerk `<SignIn>` / `<SignUp>` in `src/views/auth/`.

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
  (`dist/`) plus future `api/` serverless routes.
- Local: `npm install` → `npm run start` → http://localhost:5173
- Live: `https://accounts.jdproductions.io` (GitHub repo `jdproductions-accounts`).
- Do not rename the GitHub repository without a documented Vercel reconnect.
- After changing auth or the bridge, verify `/auth/login`, `/auth/register`,
  and `/auth/bridge` still load, and that the marketing iframe still receives
  `jdp_auth`.

---

*If you change the connection contract, update this file in the same commit.*
