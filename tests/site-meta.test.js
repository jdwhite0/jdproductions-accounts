import assert from "node:assert/strict";
import test from "node:test";

import { LANDING_HEADLINE, LANDING_SUBHEAD } from "../lib/early-support/copy.js";
import {
  ACCOUNTS_SITE,
  EARLY_SUPPORT_DOCUMENT_TITLE,
  INVEST_SITE,
  documentTitleForHost,
} from "../src/utils/site-meta.js";

test("invest URL card copy matches official Early Support wording", () => {
  assert.equal(INVEST_SITE.title, `${LANDING_HEADLINE} · JD Productions`);
  assert.equal(INVEST_SITE.description, LANDING_SUBHEAD);
  assert.equal(INVEST_SITE.url, "https://invest.jdproductions.io/");
  assert.equal(INVEST_SITE.imagePath, "/og-early-support.jpg");
  assert.equal(EARLY_SUPPORT_DOCUMENT_TITLE, INVEST_SITE.title);
});

test("accounts URL card keeps Accounts branding", () => {
  assert.match(ACCOUNTS_SITE.title, /Accounts/);
  assert.equal(ACCOUNTS_SITE.url, "https://accounts.jdproductions.io/");
  assert.equal(ACCOUNTS_SITE.imagePath, "/og-accounts.jpg");
});

test("documentTitleForHost is host-aware", () => {
  assert.equal(
    documentTitleForHost("invest.jdproductions.io"),
    INVEST_SITE.title,
  );
  assert.equal(
    documentTitleForHost("www.invest.jdproductions.io"),
    INVEST_SITE.title,
  );
  assert.equal(
    documentTitleForHost("accounts.jdproductions.io"),
    ACCOUNTS_SITE.title,
  );
});
