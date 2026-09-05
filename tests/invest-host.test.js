import assert from "node:assert/strict";
import test from "node:test";

import {
  isInvestHost,
  investPathDestination,
  normalizeHostname,
  rootIntentForHost,
} from "../src/utils/invest-host.js";

test("invest hosts serve Early Support at /", () => {
  for (const host of [
    "invest.jdproductions.io",
    "www.invest.jdproductions.io",
    "INVEST.jdproductions.io",
    "invest.jdproductions.io.",
    "www.invest.jdproductions.io:443",
  ]) {
    assert.equal(isInvestHost(host), true, host);
    assert.equal(rootIntentForHost(host), "early-support", host);
  }
});

test("accounts and other hosts keep dashboard at /", () => {
  for (const host of [
    "accounts.jdproductions.io",
    "www.accounts.jdproductions.io",
    "jdproductions.io",
    "localhost",
    "127.0.0.1",
    "jdproductions-accounts.vercel.app",
    "",
    undefined,
  ]) {
    assert.equal(isInvestHost(host), false, String(host));
    assert.equal(rootIntentForHost(host), "dashboard", String(host));
  }
});

test("normalizeHostname strips port, case, and trailing dot", () => {
  assert.equal(
    normalizeHostname("WWW.Invest.JDProductions.IO.:443"),
    "www.invest.jdproductions.io",
  );
});

test("/invest is not its own page", () => {
  assert.equal(investPathDestination("invest.jdproductions.io"), "/");
  assert.equal(investPathDestination("www.invest.jdproductions.io"), "/");
  assert.equal(
    investPathDestination("accounts.jdproductions.io"),
    "/early-support",
  );
  assert.equal(investPathDestination("localhost"), "/early-support");
});
