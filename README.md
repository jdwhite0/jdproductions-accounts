# JD Productions Accounts

Company **accounts gateway** and **early-support capital** home for
[JD Productions Inc.](https://jdproductions.io).

| | |
|---|---|
| **Product** | JD Productions Accounts |
| **GitHub repo** | `jdwhite0/jdproductions-accounts` |
| **Live** | https://accounts.jdproductions.io |
| **Auth** | Clerk (shared pool with ACCESS — **consume keys only**, never edit Clerk) |

This is **not** a generic SaasAble “SaaS Platform” template, **not** ACCESS,
**not** JYSON, **not** the marketing site, and **not** the JDP token holder
app. Read **[AGENTS.md](./AGENTS.md)** before changing anything.

## What lives here

- Member/founder accounts UI on `accounts.jdproductions.io`
- `/auth/login`, `/auth/register`, `/auth/bridge` (marketing Sign In iframe)
- Future early-support ledger + Stripe webhooks + Positions UI — see
  [docs/EARLY_SUPPORT_PLAN.md](./docs/EARLY_SUPPORT_PLAN.md)

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

## Connection contract (summary)

1. Shared Clerk identity with ACCESS — env keys only; never change Clerk apps/redirects/pool.
2. Marketing iframe bridge: website loads `/auth/bridge`; this app posts `jdp_auth`.
3. Optional links out to getaccess.world and jdproductions.io.
4. Early-support DB + Stripe in **this** Vercel project — not ACCESS Supabase.

Full rules: [AGENTS.md](./AGENTS.md).

## Stack

Vite · React 19 · MUI · Clerk · Vercel (`dist/` + future `api/` serverless).

UI kit origin: PhoenixCoded SaasAble (MIT). Live product code is root `src/`.
`admin/` and `uikit/` are unused template copies — see those folders’ READMEs.

## License

Vendor UI kit: MIT (PhoenixCoded). Product code: JD Productions Inc.
