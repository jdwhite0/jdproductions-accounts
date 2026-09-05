import { isInvestHost } from "./invest-host.js";

/**
 * Early Support header chrome.
 * Guest (and unresolved Clerk) sees gold Sign in — same rule as PR #16.
 * Only after Clerk confirms a session: Positions | Sign out.
 */
export function earlySupportNavChrome({ isLoaded, isSignedIn } = {}) {
  const showSignedInChrome = Boolean(isLoaded && isSignedIn);
  return {
    showSignedInChrome,
    showSignIn: !showSignedInChrome,
  };
}

/**
 * After Sign out, stay on Early Support — not ClerkProvider's /auth/login.
 * invest. `/` is the Early Support landing; elsewhere use /early-support.
 */
export function earlySupportAfterSignOutPath(hostname) {
  return isInvestHost(hostname) ? "/" : "/early-support";
}
