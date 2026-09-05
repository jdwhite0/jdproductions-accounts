import assert from "node:assert/strict";
import test from "node:test";

import { ACCOUNTS_CANONICAL_ORIGIN } from "../src/utils/access-doors.js";
import {
  SESSION_SHARE_MESSAGE,
  SESSION_SHARE_PATH,
  accountsSessionShareUrl,
  isSessionShareParentOrigin,
  parseSessionShareMessage,
  parseSessionShareParent,
  shouldRestoreInvestSession,
} from "../src/utils/session-share.js";

test("only invest hosts may receive a session-share ticket", () => {
  assert.equal(
    isSessionShareParentOrigin("https://invest.jdproductions.io"),
    true,
  );
  assert.equal(
    isSessionShareParentOrigin("https://www.invest.jdproductions.io"),
    true,
  );
  assert.equal(
    isSessionShareParentOrigin("https://accounts.jdproductions.io"),
    false,
  );
  assert.equal(isSessionShareParentOrigin("https://getaccess.world"), false);
  assert.equal(parseSessionShareParent("https://evil.example"), null);
  assert.equal(
    parseSessionShareParent("https://invest.jdproductions.io/early-support"),
    "https://invest.jdproductions.io",
  );
});

test("session-share URL stays on accounts origin and names the invest parent", () => {
  const href = accountsSessionShareUrl({
    parentOrigin: "https://invest.jdproductions.io",
  });
  const url = new URL(href);
  assert.equal(url.origin, ACCOUNTS_CANONICAL_ORIGIN);
  assert.equal(url.pathname, SESSION_SHARE_PATH);
  assert.equal(url.searchParams.get("parent"), "https://invest.jdproductions.io");
  assert.equal(url.searchParams.get("ticket"), null);

  const logout = accountsSessionShareUrl({
    parentOrigin: "https://invest.jdproductions.io",
    intent: "signout",
  });
  assert.match(logout, /intent=signout/);

  const ignored = accountsSessionShareUrl({
    parentOrigin: "https://evil.example",
  });
  assert.equal(new URL(ignored).searchParams.get("parent"), null);
});

test("session-share messages require accounts origin and never accept a foreign type", () => {
  assert.equal(
    parseSessionShareMessage(
      { type: SESSION_SHARE_MESSAGE, ticket: "tk_live" },
      ACCOUNTS_CANONICAL_ORIGIN,
    ).kind,
    "ticket",
  );
  assert.equal(
    parseSessionShareMessage(
      { type: SESSION_SHARE_MESSAGE, signedIn: false },
      ACCOUNTS_CANONICAL_ORIGIN,
    ).kind,
    "unsigned",
  );
  assert.equal(
    parseSessionShareMessage(
      { type: SESSION_SHARE_MESSAGE, signedOut: true },
      ACCOUNTS_CANONICAL_ORIGIN,
    ).kind,
    "signed-out",
  );
  assert.equal(
    parseSessionShareMessage(
      { type: SESSION_SHARE_MESSAGE, ticket: "tk_live" },
      "https://getaccess.world",
    ),
    null,
  );
  assert.equal(
    parseSessionShareMessage(
      { type: "jdp_auth", ticket: "tk_live" },
      ACCOUNTS_CANONICAL_ORIGIN,
    ),
    null,
  );
});

test("invest restores from accounts only when signed out on an invest host", () => {
  assert.equal(
    shouldRestoreInvestSession({
      hostname: "invest.jdproductions.io",
      pathname: "/",
      isLoaded: true,
      isSignedIn: false,
    }),
    true,
  );
  assert.equal(
    shouldRestoreInvestSession({
      hostname: "accounts.jdproductions.io",
      pathname: "/early-support",
      isLoaded: true,
      isSignedIn: false,
    }),
    false,
  );
  assert.equal(
    shouldRestoreInvestSession({
      hostname: "invest.jdproductions.io",
      pathname: "/",
      isLoaded: true,
      isSignedIn: true,
    }),
    false,
  );
  assert.equal(
    shouldRestoreInvestSession({
      hostname: "invest.jdproductions.io",
      pathname: SESSION_SHARE_PATH,
      isLoaded: true,
      isSignedIn: false,
    }),
    false,
  );
  assert.equal(
    shouldRestoreInvestSession({
      hostname: "invest.jdproductions.io",
      pathname: "/",
      isLoaded: true,
      isSignedIn: false,
      skipped: true,
    }),
    false,
  );
});
