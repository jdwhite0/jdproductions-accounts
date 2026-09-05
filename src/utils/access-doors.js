/**
 * Optional ACCESS links for explicit user clicks only (magic-link).
 *
 * JD Productions Accounts hosts its own Clerk SignIn/SignUp on this origin
 * so the SaaS portal (`/dashboard`) gets a first-party session. Same ACCESS
 * pool (`pk_live` / clerk.getaccess.world).
 *
 * Do NOT auto-redirect /auth/login or /auth/register to ACCESS on page
 * load. Session cookies are not shared across accounts.jdproductions.io
 * and getaccess.world — a page-load bounce loops forever.
 *
 * Magic-link completion must happen on getaccess.world (Clerk instance
 * domain). Accounts cannot be a satellite (`reserved_subdomain`).
 */
import { normalizeHostname } from "./invest-host.js";
import { safeNextPath } from "./safe-next.js";

export const ACCESS_ORIGIN = "https://getaccess.world";
export const ACCOUNTS_CANONICAL_ORIGIN = "https://accounts.jdproductions.io";

export const TRUSTED_ACCOUNTS_RETURN_ORIGINS = Object.freeze([
  "https://accounts.jdproductions.io",
  "https://invest.jdproductions.io",
  "https://www.invest.jdproductions.io",
]);

export function accountsReturnOrigin(hostname) {
  const host =
    hostname === undefined
      ? typeof window !== "undefined"
        ? window.location.hostname
        : ""
      : hostname;
  const origin = `https://${normalizeHostname(host)}`;
  return TRUSTED_ACCOUNTS_RETURN_ORIGINS.includes(origin)
    ? origin
    : ACCOUNTS_CANONICAL_ORIGIN;
}

export function accountsReturnUrl(
  nextPath,
  { hostname, fallback = "/dashboard" } = {},
) {
  const path = safeNextPath(nextPath, fallback);
  return `${accountsReturnOrigin(hostname)}${path}`;
}

function accessDoorUrl(pathname, options = {}) {
  const redirectUrl = accountsReturnUrl(options.next, options);
  return `${ACCESS_ORIGIN}${pathname}?redirect_url=${encodeURIComponent(redirectUrl)}`;
}

/** Click-only ACCESS sign-in URL. Never use in a page-load redirect. */
export function accessSignInUrl(options = {}) {
  return accessDoorUrl("/sign-in", options);
}

/** Click-only ACCESS sign-up URL. Never use in a page-load redirect. */
export function accessSignUpUrl(options = {}) {
  return accessDoorUrl("/sign-up", options);
}
