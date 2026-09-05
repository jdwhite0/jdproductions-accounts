import assert from "node:assert/strict";
import test from "node:test";

import {
  EARLY_SUPPORT_AFTER_SIGN_OUT_PATH,
  earlySupportNavChrome,
} from "../src/utils/early-support-nav.js";

test("guest and unresolved Clerk keep gold Sign in", () => {
  for (const auth of [
    {},
    { isLoaded: false, isSignedIn: false },
    { isLoaded: false, isSignedIn: true },
    { isLoaded: false, isSignedIn: undefined },
    { isLoaded: true, isSignedIn: false },
    { isLoaded: true, isSignedIn: undefined },
    { isLoaded: true, isSignedIn: null },
  ]) {
    assert.deepEqual(
      earlySupportNavChrome(auth),
      { showSignedInChrome: false, showSignIn: true },
      JSON.stringify(auth),
    );
  }
});

test("signed-in chrome is Positions | Sign out only after Clerk confirms", () => {
  assert.deepEqual(earlySupportNavChrome({ isLoaded: true, isSignedIn: true }), {
    showSignedInChrome: true,
    showSignIn: false,
  });
});

test("Sign out lands on /early-support, not /auth/login", () => {
  assert.equal(EARLY_SUPPORT_AFTER_SIGN_OUT_PATH, "/early-support");
});
