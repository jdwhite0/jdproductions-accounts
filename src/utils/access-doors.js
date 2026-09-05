/**
 * ACCESS is the auth door. Magic-link completion must happen on
 * getaccess.world (Clerk instance domain). Accounts cannot be a satellite.
 *
 * After ACCESS session, return via allowlisted post-auth redirect_url
 * (Accounts / Invest origins). That allowlist lives in ACCESS
 * `safePostAuthRedirect` — not in clerkSafeRedirectUrl / magic-link rules.
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

/** Exact Early Support Sign-in door (default next=/positions). */
export function accessSignInUrl(options = {}) {
  return accessDoorUrl("/sign-in", options);
}

export function accessSignUpUrl(options = {}) {
  return accessDoorUrl("/sign-up", options);
}
