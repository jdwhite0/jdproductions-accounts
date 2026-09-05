import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCESS_ORIGIN,
  ACCOUNTS_CANONICAL_ORIGIN,
  accessSignInUrl,
  accessSignUpUrl,
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

test("Early Support Sign in uses ACCESS door with positions return", () => {
  const href = accessSignInUrl({
    next: "/positions",
    hostname: "accounts.jdproductions.io",
  });
  const expectedReturn = "https://accounts.jdproductions.io/positions";
  assert.equal(
    href,
    `${ACCESS_ORIGIN}/sign-in?redirect_url=${encodeURIComponent(expectedReturn)}`,
  );
  assert.equal(accountsReturnUrl("/positions"), expectedReturn);
});

test("login without next returns to Accounts dashboard", () => {
  const href = accessSignInUrl({ hostname: "accounts.jdproductions.io" });
  assert.equal(
    href,
    `${ACCESS_ORIGIN}/sign-in?redirect_url=${encodeURIComponent(
      "https://accounts.jdproductions.io/dashboard",
    )}`,
  );
});

test("register preserves next on ACCESS sign-up door", () => {
  const href = accessSignUpUrl({
    next: "/early-support",
    hostname: "accounts.jdproductions.io",
  });
  assert.equal(
    href,
    `${ACCESS_ORIGIN}/sign-up?redirect_url=${encodeURIComponent(
      "https://accounts.jdproductions.io/early-support",
    )}`,
  );
});

test("unsafe next falls back instead of open-redirecting", () => {
  assert.equal(
    accountsReturnUrl("https://evil.example/phish"),
    "https://accounts.jdproductions.io/dashboard",
  );
});
