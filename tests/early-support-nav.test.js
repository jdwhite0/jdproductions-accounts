import assert from "node:assert/strict";
import test from "node:test";

import {
  earlySupportAfterSignOutPath,
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

test("Sign out lands on Early Support, not /auth/login", () => {
  assert.equal(
    earlySupportAfterSignOutPath("accounts.jdproductions.io"),
    "/early-support",
  );
  assert.equal(
    earlySupportAfterSignOutPath("localhost"),
    "/early-support",
  );
  assert.equal(earlySupportAfterSignOutPath("invest.jdproductions.io"), "/");
  assert.equal(
    earlySupportAfterSignOutPath("www.invest.jdproductions.io"),
    "/",
  );
});
