# JD ecosystem — which repo is which

One-pager for humans and LLMs. **This repo is the company accounts + capital
home.** Do not put that work in ACCESS, JYSON, the marketing site, or jdp-saas.

| Surface | GitHub | Live | Role |
|---|---|---|---|
| **JD Productions Accounts (this repo)** | [`jdwhite0/jdproductions-accounts`](https://github.com/jdwhite0/jdproductions-accounts) | [accounts.jdproductions.io](https://accounts.jdproductions.io) · [invest.jdproductions.io](https://invest.jdproductions.io) (Early Support at `/`) | Company accounts gateway + early-support capital. |
| **Marketing site** | [`jdwhite0/jdproductions-website`](https://github.com/jdwhite0/jdproductions-website) | [jdproductions.io](https://jdproductions.io) | Public marketing. Sign In → ACCESS `/sign-in` (same as JYSON). Hidden iframe → this app’s `/auth/bridge`. |
| **ACCESS** | [`jdwhite0/access-app`](https://github.com/jdwhite0/access-app) | [getaccess.world](https://getaccess.world) | Separate platform / workspace product. Owns Clerk **configuration**. Do not import or merge. |
| **JYSON** | [`jdwhite0/jyson`](https://github.com/jdwhite0/jyson) | JYSON deploy (own Vercel project) | Separate chat product. Connects to ACCESS via its own `AGENTS.md` contract. Not this app. |
| **JDP token holder app** | [`jdwhite0/jdp-saas`](https://github.com/jdwhite0/jdp-saas) | JDP holder / wallet app (Privy + Base) | Token holder dashboard. Not company accounts. Not early-support capital. |
| **Capital (deleted)** | ~~jdproductions-capital~~ | — | Seed repo deleted 2026-09-04. Ledger belongs in this accounts repo. |

## Identity

All company + ACCESS + JYSON surfaces that use Clerk share **one Clerk
application / pool**. Sign-in completes on ACCESS (`getaccess.world/sign-in`),
matching JYSON. This repo **consumes** the publishable key and must **not**
embed `<SignIn>` / `<SignUp>`. Clerk cannot register `accounts.jdproductions.io`
as a satellite (`reserved_subdomain`). ACCESS owns dashboard/config. Agents
must not edit Clerk.

The JDP holder app (`jdp-saas`) uses **Privy**, not this Clerk pool.

## How marketing Sign In works

```
jdproductions.io  --iframe-->  accounts.jdproductions.io/auth/bridge
                  --link---->  getaccess.world/sign-in   (same door as JYSON)
```

`/auth/login` is a click-only ACCESS door for leftover links. Do not
auto-redirect to ACCESS on page load (no shared session cookie → infinite
loop). Do not embed Clerk `<SignIn>` on this origin.

Bridge posts `{ type: 'jdp_auth', signedIn, imageUrl, firstName, fullName }`
to allowlisted parent origins. Contract: root `AGENTS.md`.

## Capital

Early-support positions, Stripe webhooks, and the ledger schema live in
**this** project (`api/` + own Postgres; see `docs/EARLY_SUPPORT_PLAN.md`).
Not ACCESS Supabase. Not a separate capital repo (deleted). Positions UI
is reserved for a founder design pass.
