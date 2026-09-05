/**
 * Same-site session share: invest.* restores a Clerk session from
 * accounts.jdproductions.io. ACCESS cannot do this in an iframe —
 * Clerk cookies are SameSite=Lax and getaccess.world is cross-site.
 *
 * Ticket never goes in the URL. postMessage target is the validated parent
 * only — do not broadcast.
 */
import { ACCOUNTS_CANONICAL_ORIGIN } from "./access-doors.js";
import { isInvestHost } from "./invest-host.js";

export const SESSION_SHARE_MESSAGE = "jdp_accounts_session";
export const SESSION_SHARE_PATH = "/auth/session-share";
export const SESSION_SHARE_SKIP_KEY = "jdp_invest_session_share_skip";
export const SESSION_SHARE_TIMEOUT_MS = 5000;

export const SESSION_SHARE_PARENT_ORIGINS = Object.freeze([
  "https://invest.jdproductions.io",
  "https://www.invest.jdproductions.io",
]);

export function isSessionShareParentOrigin(origin) {
  return SESSION_SHARE_PARENT_ORIGINS.includes(String(origin || ""));
}

export function accountsSessionShareUrl({
  parentOrigin,
  intent,
  hostname,
} = {}) {
  const parent =
    parentOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const url = new URL(SESSION_SHARE_PATH, ACCOUNTS_CANONICAL_ORIGIN);
  if (isSessionShareParentOrigin(parent)) {
    url.searchParams.set("parent", parent);
  }
  if (intent === "signout") {
    url.searchParams.set("intent", "signout");
  }
  if (hostname) {
    url.searchParams.set("host", hostname);
  }
  return url.toString();
}

export function parseSessionShareParent(value) {
  if (typeof value !== "string") return null;
  try {
    const origin = new URL(value).origin;
    return isSessionShareParentOrigin(origin) ? origin : null;
  } catch {
    return null;
  }
}

export function parseSessionShareMessage(data, origin) {
  if (origin !== ACCOUNTS_CANONICAL_ORIGIN) return null;
  if (!data || data.type !== SESSION_SHARE_MESSAGE) return null;
  const ticket = typeof data.ticket === "string" ? data.ticket.trim() : "";
  if (ticket) return { kind: "ticket", ticket };
  if (data.signedOut === true) return { kind: "signed-out" };
  return { kind: "unsigned" };
}

export function shouldRestoreInvestSession({
  hostname,
  pathname,
  isLoaded,
  isSignedIn,
  skipped,
} = {}) {
  if (!isInvestHost(hostname)) return false;
  const path = String(pathname || "");
  if (
    path === SESSION_SHARE_PATH ||
    path.startsWith("/auth/ticket") ||
    path.startsWith("/auth/bridge")
  ) {
    return false;
  }
  if (!isLoaded || isSignedIn) return false;
  if (skipped) return false;
  return true;
}

export function markSessionShareSkipped() {
  try {
    sessionStorage.setItem(SESSION_SHARE_SKIP_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function isSessionShareSkipped() {
  try {
    return sessionStorage.getItem(SESSION_SHARE_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearSessionShareSkip() {
  try {
    sessionStorage.removeItem(SESSION_SHARE_SKIP_KEY);
  } catch {
    /* private mode */
  }
}
