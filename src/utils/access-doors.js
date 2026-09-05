/**
 * Optional ACCESS links for explicit user clicks only (magic-link / Google).
 *
 * Clerk cannot register accounts.jdproductions.io as a satellite
 * (`reserved_subdomain`). Google OAuth and magic-link complete on
 * getaccess.world. ACCESS then mints a one-time Clerk ticket and returns
 * the browser to `/auth/ticket` so this origin gets a first-party session.
 *
 * Do NOT auto-redirect `/auth/login` or `/auth/register` to ACCESS on page
 * load. Session cookies are not shared — a page-load bounce loops forever.
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
