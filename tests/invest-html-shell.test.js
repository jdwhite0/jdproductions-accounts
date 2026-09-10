import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  ACCOUNTS_HTML_SHELL,
  INVEST_HTML_SHELL,
  htmlShellForHost,
  isStaticAssetPath,
  shouldRewriteToInvestShell,
} from "../lib/invest-html-shell.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("invest hosts use the Early Support HTML shell", () => {
  assert.equal(htmlShellForHost("invest.jdproductions.io"), INVEST_HTML_SHELL);
  assert.equal(
    htmlShellForHost("www.invest.jdproductions.io"),
    INVEST_HTML_SHELL,
  );
  assert.equal(
    htmlShellForHost("accounts.jdproductions.io"),
    ACCOUNTS_HTML_SHELL,
  );
});

test("invest `/` is rewritten to invest.html (filesystem would otherwise serve index.html)", () => {
  assert.equal(
    shouldRewriteToInvestShell({
      hostname: "invest.jdproductions.io",
      pathname: "/",
    }),
    true,
  );
  assert.equal(
    shouldRewriteToInvestShell({
      hostname: "www.invest.jdproductions.io",
      pathname: "/early-support",
    }),
    true,
  );
});

test("accounts hosts and static assets are not rewritten", () => {
  assert.equal(
    shouldRewriteToInvestShell({
      hostname: "accounts.jdproductions.io",
      pathname: "/",
    }),
    false,
  );
  assert.equal(
    shouldRewriteToInvestShell({
      hostname: "invest.jdproductions.io",
      pathname: "/og-early-support.jpg",
    }),
    false,
  );
  assert.equal(
    shouldRewriteToInvestShell({
      hostname: "invest.jdproductions.io",
      pathname: "/api/stripe/checkout",
    }),
    false,
  );
  assert.equal(isStaticAssetPath("/og-early-support.jpg"), true);
  assert.equal(isStaticAssetPath("/"), false);
});

test("invest.html has crawler SEO + OG metadata", () => {
  const html = readFileSync(join(root, "invest.html"), "utf8");
  for (const needle of [
    "<title>Early Support · JD Productions</title>",
    'content="Stand with JD Productions before the next formal round."',
    'rel="canonical" href="https://invest.jdproductions.io/"',
    'property="og:title" content="Early Support · JD Productions"',
    'content="https://invest.jdproductions.io/og-early-support.jpg"',
    'name="twitter:card" content="summary_large_image"',
    'name="robots" content="index, follow"',
    '"@type": "WebPage"',
  ]) {
    assert.match(html, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("index.html keeps Accounts metadata", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  assert.match(html, /JD Productions Accounts/);
  assert.match(html, /og-accounts\.jpg/);
  assert.doesNotMatch(html, /og-early-support\.jpg/);
});
