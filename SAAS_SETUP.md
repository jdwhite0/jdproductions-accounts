# Local setup (JD Productions Accounts)

The filename is historical. GitHub + Vercel project: `jdproductions-accounts`.
This is **not** a generic SaasAble SaaS starter.

**Read [AGENTS.md](./AGENTS.md) first.** Repo map: [docs/REPOS_MAP.md](./docs/REPOS_MAP.md).

## Run

```bash
npm install
cp .env.example .env.local
npm run start
```

App: http://localhost:5173

Live: https://accounts.jdproductions.io

## Auth

Clerk is already wired (`src/main.jsx`, `/auth/login`, `/auth/register`,
`/auth/bridge`). Use the same publishable key ACCESS uses. **Do not**
create Clerk apps, change redirects, or edit the Clerk dashboard.

## Stripe / Early Support

Member billing may still call ACCESS Stripe endpoints (legacy). **Early
Support** ledger + webhooks are implemented in this project (`api/` +
`DATABASE_URL`). Positions UI is a stub (`UI TBD — backend ready`). See
[docs/EARLY_SUPPORT_PLAN.md](./docs/EARLY_SUPPORT_PLAN.md). Do not implement
against ACCESS Supabase.

Set server secrets in the Vercel project env UI, not `vercel.json`:
`DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`CLERK_SECRET_KEY`. Do not flip Clerk to `pk_live` here.

## Deploy

Vercel project for this GitHub repo. Project name is already `jdproductions-accounts` — do not rename casually
without reconnecting the project. Bind nothing to ACCESS’s Vercel project.
