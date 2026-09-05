/**
 * Early Support header chrome.
 * Guest (and unresolved Clerk) sees gold Sign in — same rule as PR #16.
 * Only after Clerk confirms a session: avatar | Sign out.
 * While invest is restoring a session from accounts., show neither.
 */
export function earlySupportNavChrome({
  isLoaded,
  isSignedIn,
  restorePending,
} = {}) {
  const showSignedInChrome = Boolean(isLoaded && isSignedIn);
  return {
    showSignedInChrome,
    showSignIn: !showSignedInChrome && !restorePending,
  };
}

/** After Sign out, land on Early Support — not ClerkProvider's /auth/login. */
export const EARLY_SUPPORT_AFTER_SIGN_OUT_PATH = "/early-support";
