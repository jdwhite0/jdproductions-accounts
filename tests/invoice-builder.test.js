import assert from 'node:assert/strict';
import test from 'node:test';
import { buildItemizedInvoice } from '../lib/early-support/invoice.js';
import { TIERS, includedInvoiceLines, CHECKOUT_PRODUCT_DESCRIPTION } from '../lib/early-support/copy.js';

const TIERS_UNDER_TEST = [
  ...Object.values(TIERS).map((t) => ({ ...t })),
  { key: 'custom', label: 'Custom', amountCents: 33300 }
];

for (const tier of TIERS_UNDER_TEST) {
  test(`itemized invoice builder for ${tier.label} includes charge + $0 included lines`, () => {
    const built = buildItemizedInvoice({
      tier: tier.key,
      amountCents: tier.amountCents,
      termsUrl: 'https://accounts.jdproductions.io/early-support/terms',
      privacyUrl: 'https://accounts.jdproductions.io/early-support/privacy'
    });

    assert.equal(built.productName, `Early Support — ${tier.label}`);
    assert.equal(built.productDescription, CHECKOUT_PRODUCT_DESCRIPTION);
    assert.equal(built.lines.length, 1 + includedInvoiceLines().length);
    assert.equal(built.lines[0].amountCents, tier.amountCents);
    assert.match(built.lines[0].description, new RegExp(`Early Support — ${tier.label}`));
    assert.ok(built.lines.slice(1).every((line) => line.amountCents === 0));
    assert.ok(built.lines.some((line) => /Ledger record/.test(line.description)));
    assert.ok(built.lines.some((line) => /Stripe payment receipt/.test(line.description)));
    assert.ok(built.lines.some((line) => /early_support_v0/.test(line.description)));
    assert.ok(built.lines.some((line) => /Priority consideration/.test(line.description)));
    assert.match(built.notes, /JD Productions Inc/);
    assert.match(built.notes, /voluntary support to JD Productions Inc/);
    assert.match(built.notes, /not a charitable donation or 501\(c\)\(3\) contribution/);
    assert.doesNotMatch(built.notes, /equity round|ROI|angel/i);
    assert.doesNotMatch(built.productDescription, /Voluntary Early Support payment/);
    assert.match(built.productDescription, /^Voluntary Early Support to JD Productions Inc\./);
    assert.match(built.footer, /EARLY SUPPORT TERMS NOTICE/);
    assert.match(built.footer, /By continuing you accept/);
    assert.doesNotMatch(built.footer, /By paying you accept/);
    assert.match(built.footer, /early-support\/terms/);
    assert.match(built.footer, /early-support\/privacy/);
    assert.equal(built.metadata.instrument_type, 'early_support');
    assert.equal(built.metadata.terms_version, 'early_support_v0');
  });
}

test('invoice send is skipped when an invoice id is already stored', async () => {
  const { sendItemizedInvoice } = await import('../lib/early-support/invoice.js');
  const result = await sendItemizedInvoice({
    stripe: {
      invoices: { create: async () => assert.fail('should not create') }
    },
    repo: {},
    position: { id: 'pos_1', stripe_invoice_id: 'in_existing' },
    customerId: 'cus_1',
    amountCents: 25000,
    tier: 'standard'
  });
  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'already_invoiced');
});
