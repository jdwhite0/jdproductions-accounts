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

/** After Sign out, land on Early Support — not ClerkProvider's /auth/login. */
export const EARLY_SUPPORT_AFTER_SIGN_OUT_PATH = "/early-support";
