/**
 * ACCESS is the only production Clerk door for this app, matching JYSON.
 *
 * Clerk cannot register accounts.jdproductions.io as a satellite
 * (reserved_subdomain). Magic-link completion belongs on getaccess.world.
 * Embedding <SignIn> here starts a second Clerk widget on the wrong host
 * and loops with ACCESS / the Account Portal.
 *
 * Do NOT auto-redirect /auth/login or /auth/register to ACCESS on page
 * load. Session cookies are not shared across accounts.jdproductions.io
 * and getaccess.world — a page-load bounce loops forever.
 *
 * Do NOT pass https://accounts.jdproductions.io/... as Clerk redirect_url.
 * ACCESS only honors same-app paths; absolute Accounts URLs are stripped,
 * and Clerk-level allowed-origin bounces were the loop.
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

/** Click-only ACCESS sign-in. Never use in a page-load redirect. */
export function accessSignInUrl() {
  return `${ACCESS_ORIGIN}/sign-in`;
}

/** New people — ACCESS waitlist (no open self-serve sign-up on this origin). */
export function accessWaitlistUrl() {
  return `${ACCESS_ORIGIN}/`;
}

/** @deprecated Use accessWaitlistUrl — ACCESS sign-up is invite-gated. */
export function accessSignUpUrl() {
  return accessWaitlistUrl();
}
