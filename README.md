# JD Productions Accounts

Company **accounts gateway** and **early-support capital** home for
[JD Productions Inc.](https://jdproductions.io).

| | |
|---|---|
| **Product** | JD Productions Accounts |
| **GitHub repo** | `jdwhite0/jdproductions-accounts` |
| **Live** | https://accounts.jdproductions.io · https://invest.jdproductions.io (Early Support at `/`) |
| **Auth** | Clerk (shared pool with ACCESS — **consume keys only**, never edit Clerk) |

This is **not** a generic SaasAble “SaaS Platform” template, **not** ACCESS,
**not** JYSON, **not** the marketing site, and **not** the JDP token holder
app. Read **[AGENTS.md](./AGENTS.md)** before changing anything.

## What lives here

- Member/founder accounts UI on `accounts.jdproductions.io`
- `/auth/login`, `/auth/register` (click-only ACCESS doors), `/auth/bridge` (marketing iframe)
- Early-support ledger + Stripe webhooks in **this** project (`api/` + own
  Postgres). Guest pay first, optional Clerk claim. UI: `/early-support`
  and `/positions`. Copy: [docs/EARLY_SUPPORT_OFFICIAL_COPY_v0.md](./docs/EARLY_SUPPORT_OFFICIAL_COPY_v0.md).
  Plan: [docs/EARLY_SUPPORT_PLAN.md](./docs/EARLY_SUPPORT_PLAN.md).

## What does not live here

See [docs/REPOS_MAP.md](./docs/REPOS_MAP.md). ACCESS stays in `access-app`.
JYSON stays in `jyson`. Marketing stays in `jdproductions-website`. JDP
holder app stays in `jdp-saas`. The old `jdproductions-capital` seed was deleted.

## Quick start

```bash
npm install
cp .env.example .env.local   # publishable keys only; never VITE_ secrets
npm run start                # http://localhost:5173
```

Server secrets (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`CLERK_SECRET_KEY`) belong in the **Vercel project Environment Variables**
UI (Sensitive), not `vercel.json`. See `.env.example`.

### Early Support backend

```bash
# Postgres for THIS project (not ACCESS Supabase)
export DATABASE_URL=postgres://...
npm run db:migrate
npm run db:seed
npm test
```

| Method | Path | Auth |
|---|---|---|
| POST | `/api/stripe/checkout` | Optional. Guest: email + amount/tier. Signed-in: Bearer may pre-fill Clerk id. |
| POST | `/api/stripe/webhook` | `Stripe-Signature` (fail closed) |
| GET | `/api/positions` | `Authorization: Bearer <Clerk session token>` (fail closed) |
| POST | `/api/positions/claim` | `Authorization: Bearer <Clerk session token>` (fail closed) |

Local functions + webhook:

```bash
npx vercel dev
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Production webhook URL:
`https://accounts.jdproductions.io/api/stripe/webhook`

Do not change Clerk apps, redirects, or migrate `pk_test` → `pk_live`.

## Connection contract (summary)

1. Shared Clerk identity with ACCESS — env keys only; never change Clerk apps/redirects/pool.
2. Marketing iframe bridge: website loads `/auth/bridge`; this app posts `jdp_auth`.
3. Click-only ACCESS doors (`/sign-in`, waitlist `/`). Do **not**
   auto-redirect `/auth/login` to ACCESS (cross-domain session loop). Do **not**
   embed Clerk `<SignIn>` on this origin.
4. Early-support DB + Stripe in **this** Vercel project — not ACCESS Supabase.

Full rules: [AGENTS.md](./AGENTS.md).

## Stack

Vite · React 19 · MUI · Clerk · Vercel (`dist/` + `api/` serverless).
Drizzle + Postgres for the Early Support ledger.

UI kit origin: PhoenixCoded SaasAble (MIT). Live product code is root `src/`.
`admin/` and `uikit/` are unused template copies — see those folders’ READMEs.

## License

Vendor UI kit: MIT (PhoenixCoded). Product code: JD Productions Inc.
