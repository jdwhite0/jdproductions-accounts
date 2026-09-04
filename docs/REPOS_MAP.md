# JD ecosystem — which repo is which

One-pager for humans and LLMs. **This repo is the company accounts + capital
home.** Do not put that work in ACCESS, JYSON, the marketing site, or jdp-saas.

| Surface | GitHub | Live | Role |
|---|---|---|---|
| **JD Productions Accounts (this repo)** | [`jdwhite0/jdproductions-saas`](https://github.com/jdwhite0/jdproductions-saas) | [accounts.jdproductions.io](https://accounts.jdproductions.io) | Company accounts gateway + early-support capital. GitHub name is historical (`*-saas`); product name is **Accounts**. |
| **Marketing site** | [`jdwhite0/jdproductions-website`](https://github.com/jdwhite0/jdproductions-website) | [jdproductions.io](https://jdproductions.io) | Public marketing. Sign In → this app’s `/auth/login`. Hidden iframe → this app’s `/auth/bridge`. |
| **ACCESS** | [`jdwhite0/access-app`](https://github.com/jdwhite0/access-app) | [getaccess.world](https://getaccess.world) | Separate platform / workspace product. Owns Clerk **configuration**. Do not import or merge. |
| **JYSON** | [`jdwhite0/jyson`](https://github.com/jdwhite0/jyson) | JYSON deploy (own Vercel project) | Separate chat product. Connects to ACCESS via its own `AGENTS.md` contract. Not this app. |
| **JDP token holder app** | [`jdwhite0/jdp-saas`](https://github.com/jdwhite0/jdp-saas) | JDP holder / wallet app (Privy + Base) | Token holder dashboard. Not company accounts. Not early-support capital. |
| **Capital (abandoned)** | [`jdwhite0/jdproductions-capital`](https://github.com/jdwhite0/jdproductions-capital) | — | Empty seed. **Do not build there.** Ledger belongs here. |

## Identity

All company + ACCESS + JYSON surfaces that use Clerk share **one Clerk
application / pool**. This repo **consumes** the publishable key. ACCESS
owns dashboard/config. Agents must not edit Clerk.

The JDP holder app (`jdp-saas`) uses **Privy**, not this Clerk pool.

## How marketing Sign In works

```
jdproductions.io  --iframe-->  accounts.jdproductions.io/auth/bridge
                  --link---->  accounts.jdproductions.io/auth/login
```

Bridge posts `{ type: 'jdp_auth', signedIn, imageUrl, firstName, fullName }`
to allowlisted parent origins. Contract: root `AGENTS.md`.

## Capital

Early-support positions, Stripe webhooks, and the ledger schema live in
**this** project (see `docs/EARLY_SUPPORT_PLAN.md`). Not ACCESS Supabase.
Not `jdproductions-capital`.
