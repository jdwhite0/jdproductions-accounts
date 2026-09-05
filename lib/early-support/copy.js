/**
 * Official Early Support copy (early_support_v0).
 * Public wording: Early Support — not equity, shares, SAFE, security,
 * guaranteed return, or charitable donation until counsel papers an instrument.
 * Keep this file free of Node-only APIs so the UI can import it.
 */

export const TERMS_VERSION = 'early_support_v0';
export const INSTRUMENT_TYPE = 'early_support';
export const PAYEE_NAME = 'JD Productions Inc.';

export const TIERS = {
  starter: { key: 'starter', label: 'Believe', amountCents: 10_000, hint: 'A first show of belief' },
  standard: { key: 'standard', label: 'Stand', amountCents: 25_000, hint: 'Stand with the studio' },
  anchor: { key: 'anchor', label: 'Build', amountCents: 50_000, hint: 'Help build what’s next' }
};

export const CUSTOM_TIER = { key: 'custom', label: 'Custom', hint: 'Name what you can' };

export const TIER_KEYS = Object.keys(TIERS);

export const CHECKOUT_PRODUCT_DESCRIPTION =
  'Voluntary Early Support to JD Productions Inc. Includes ledger record, email receipt, and itemized invoice. Not equity or a security. Not a guaranteed return. Not a charitable donation. Terms: early_support_v0.';

export const INVOICE_NOTES =
  'Payee: JD Productions Inc. Early Support is voluntary support to JD Productions Inc. It is not equity or a security, not a guaranteed return, and not a charitable donation or 501(c)(3) contribution. An account is optional — the ledger record, Stripe receipt, and itemized invoice are provided either way. Any later formal instrument is a separate, counsel-prepared step; nothing converts silently. Payments are processed by Stripe; processor fees apply.';

export const PRIORITY_CARD_COPY =
  'Priority in later rounds when counsel papers the instrument.';

export const THANK_YOU_COPY = 'Thank you. Your early support helps build what’s next.';

export const LANDING_HEADLINE = 'Stand with the studio';
export const LANDING_SUBHEAD = 'Stand with JD Productions before the next formal round.';

export const LANDING_BODY =
  'Early Support is how you stand with JD Productions Inc. before the next formal round. Choose an amount first — a login is optional. We record your support on our ledger and email a Stripe receipt plus an itemized invoice either way. Afterward, you can create an account to claim your position here.';

export const WHAT_YOU_RECEIVE = [
  'A ledger record of your Early Support position',
  'A Stripe payment receipt by email',
  'An itemized invoice by email',
  'Acknowledgment of Early Support Terms (early_support_v0)',
  'Priority consideration when a counsel-prepared offering exists (not a guaranteed allocation)'
];

export const IMPORTANT_DISCLOSURE_TITLE = 'Important';
export const IMPORTANT_DISCLOSURE_BODY =
  'Early Support is not equity, shares, a SAFE, or any other security. It is not a guaranteed return. It is not a charitable donation or 501(c)(3) contribution, and it is not tax-deductible as a charitable gift. Tax treatment is between you and your advisor. Any later instrument is a separate step prepared by counsel; nothing converts silently.';

export const STRIPE_FEES_DISCLOSURE =
  'Payments are processed by Stripe. Stripe’s processor fees apply and are not itemized as a separate charge on this invoice.';

export const CONTINUE_ACCEPTS_BEFORE =
  'By continuing you accept the Early Support Terms (';
export const CONTINUE_ACCEPTS_AFTER =
  ') and the Early Support Privacy addendum.';
/** Full sentence for docs/tests; UI links TERMS_VERSION between the parts. */
export const CONTINUE_ACCEPTS = `${CONTINUE_ACCEPTS_BEFORE}${TERMS_VERSION}${CONTINUE_ACCEPTS_AFTER}`;

export function checkoutProductName(tierLabel) {
  return `Early Support — ${tierLabel}`;
}

export function formatUsdFromCents(cents, currency = 'usd') {
  const amount = Number(cents) / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function includedInvoiceLines() {
  return [
    { amountCents: 0, description: 'Ledger record of Early Support position — Included' },
    { amountCents: 0, description: 'Stripe payment receipt by email — Included' },
    { amountCents: 0, description: 'Acknowledgment of Early Support Terms (early_support_v0) — Included' },
    {
      amountCents: 0,
      description:
        'Priority consideration when a counsel-prepared instrument is later offered (not a guaranteed allocation) — Included'
    }
  ];
}

export function chargeInvoiceLine(tierLabel, amountCents) {
  return {
    amountCents,
    description: `Early Support — ${tierLabel} — ${formatUsdFromCents(amountCents)}`
  };
}

export function invoiceTermsFooter({ termsUrl, privacyUrl }) {
  return [
    'EARLY SUPPORT TERMS NOTICE: By continuing you accept Early Support Terms early_support_v0.',
    'Not equity/security, not guaranteed return, not charitable donation.',
    'Included items only those listed. Priority is not guaranteed allocation.',
    `Terms: ${termsUrl}`,
    `Privacy: ${privacyUrl}`
  ].join(' ');
}

export function tierLabel(tierKey) {
  if (tierKey === 'custom') return 'Custom';
  return TIERS[tierKey]?.label || 'Custom';
}
