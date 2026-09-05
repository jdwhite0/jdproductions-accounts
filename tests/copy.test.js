import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHECKOUT_PRODUCT_DESCRIPTION,
  CONTINUE_ACCEPTS,
  CUSTOM_TIER,
  IMPORTANT_DISCLOSURE_BODY,
  INVOICE_NOTES,
  LANDING_BODY,
  LANDING_HEADLINE,
  TERMS_VERSION,
  TIERS,
  checkoutProductName,
  invoiceTermsFooter,
  tierLabel
} from '../lib/early-support/copy.js';

const BANNED_OFFER_LANGUAGE = /angel|equity round|\bSAFE\b|ROI\s*%|tax-deductible contribution/i;

test('belief body uses the locked friend/family Early Support wording', () => {
  assert.equal(
    LANDING_BODY,
    'Early Support is how you stand with JD Productions Inc. before the next formal round. Choose an amount first — a login is optional. We record your support on our ledger and email a Stripe receipt plus an itemized invoice either way. Afterward, you can create an account to claim your position here.'
  );
  assert.equal(LANDING_HEADLINE, 'Stand with the studio');
  assert.doesNotMatch(LANDING_BODY, /voluntary payment|Pay first/i);
  assert.doesNotMatch(LANDING_BODY, BANNED_OFFER_LANGUAGE);
});

test('checkout and invoice lead-ins stay warm without charity or equity framing', () => {
  assert.equal(
    CHECKOUT_PRODUCT_DESCRIPTION,
    'Voluntary Early Support to JD Productions Inc. Includes ledger record, email receipt, and itemized invoice. Not equity or a security. Not a guaranteed return. Not a charitable donation. Terms: early_support_v0.'
  );
  assert.match(INVOICE_NOTES, /^Payee: JD Productions Inc\. Early Support is voluntary support to JD Productions Inc\./);
  assert.match(INVOICE_NOTES, /not a charitable donation or 501\(c\)\(3\) contribution/);
  assert.doesNotMatch(CHECKOUT_PRODUCT_DESCRIPTION, /Voluntary Early Support payment/);
  assert.doesNotMatch(INVOICE_NOTES, /voluntary payment/);
  assert.doesNotMatch(CHECKOUT_PRODUCT_DESCRIPTION, BANNED_OFFER_LANGUAGE);
  assert.doesNotMatch(INVOICE_NOTES, BANNED_OFFER_LANGUAGE);
});

test('legal stamp and not-donation disclosure stay firm', () => {
  assert.equal(TERMS_VERSION, 'early_support_v0');
  assert.match(IMPORTANT_DISCLOSURE_BODY, /not a charitable donation/);
  assert.match(IMPORTANT_DISCLOSURE_BODY, /not tax-deductible as a charitable gift/);
  assert.match(IMPORTANT_DISCLOSURE_BODY, /not equity, shares, a SAFE/);
  assert.match(CONTINUE_ACCEPTS, /early_support_v0/);
  const footer = invoiceTermsFooter({
    termsUrl: 'https://accounts.jdproductions.io/early-support/terms',
    privacyUrl: 'https://accounts.jdproductions.io/early-support/privacy'
  });
  assert.match(footer, /By continuing you accept Early Support Terms early_support_v0/);
  assert.match(footer, /not charitable donation/);
  assert.doesNotMatch(footer, /By paying you accept/);
});

test('display labels are Believe / Stand / Build; backend keys stay starter / standard / anchor', () => {
  assert.deepEqual(
    Object.values(TIERS).map((tier) => ({
      key: tier.key,
      label: tier.label,
      amountCents: tier.amountCents,
      hint: tier.hint
    })),
    [
      { key: 'starter', label: 'Believe', amountCents: 10_000, hint: 'A first show of belief' },
      { key: 'standard', label: 'Stand', amountCents: 25_000, hint: 'Stand with the studio' },
      { key: 'anchor', label: 'Build', amountCents: 50_000, hint: 'Help build what’s next' }
    ]
  );
  assert.deepEqual(CUSTOM_TIER, { key: 'custom', label: 'Custom', hint: 'Name what you can' });
  assert.equal(tierLabel('starter'), 'Believe');
  assert.equal(tierLabel('standard'), 'Stand');
  assert.equal(tierLabel('anchor'), 'Build');
  assert.equal(tierLabel('custom'), 'Custom');
  assert.equal(checkoutProductName('Believe'), 'Early Support — Believe');
  assert.equal(checkoutProductName('Stand'), 'Early Support — Stand');
  assert.equal(checkoutProductName('Build'), 'Early Support — Build');
});
