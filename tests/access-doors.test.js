import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCESS_ORIGIN,
  ACCOUNTS_CANONICAL_ORIGIN,
  accessSignInUrl,
  accessSignUpUrl,
  accessWaitlistUrl,
  accountsReturnOrigin,
  accountsReturnUrl,
} from "../src/utils/access-doors.js";

test("accounts return origin is canonical except invest hosts", () => {
  assert.equal(accountsReturnOrigin("accounts.jdproductions.io"), ACCOUNTS_CANONICAL_ORIGIN);
  assert.equal(accountsReturnOrigin("localhost"), ACCOUNTS_CANONICAL_ORIGIN);
  assert.equal(
    accountsReturnOrigin("invest.jdproductions.io"),
    "https://invest.jdproductions.io",
  );
  assert.equal(
    accountsReturnOrigin("www.invest.jdproductions.io"),
    "https://www.invest.jdproductions.io",
  );
});

test("click-only ACCESS sign-in is the ACCESS front door, not Accounts", () => {
  assert.equal(accessSignInUrl(), `${ACCESS_ORIGIN}/sign-in`);
  assert.doesNotMatch(accessSignInUrl(), /accounts\.jdproductions\.io/);
  assert.doesNotMatch(accessSignInUrl(), /redirect_url/);
});

test("new accounts go through ACCESS waitlist, not embedded SignUp", () => {
  assert.equal(accessWaitlistUrl(), `${ACCESS_ORIGIN}/`);
  assert.equal(accessSignUpUrl(), accessWaitlistUrl());
});

test("unsafe next falls back instead of open-redirecting", () => {
  assert.equal(
    accountsReturnUrl("https://evil.example/phish"),
    "https://accounts.jdproductions.io/dashboard",
  );
});
