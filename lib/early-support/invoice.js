import {
  TERMS_VERSION,
  INSTRUMENT_TYPE,
  CHECKOUT_PRODUCT_DESCRIPTION,
  INVOICE_NOTES,
  chargeInvoiceLine,
  checkoutProductName,
  includedInvoiceLines,
  invoiceTermsFooter,
  tierLabel
} from './copy.js';

export function defaultPublicUrls() {
  const origin = process.env.ACCOUNTS_APP_URL || 'https://accounts.jdproductions.io';
  return {
    termsUrl: process.env.EARLY_SUPPORT_TERMS_URL || `${origin}/early-support/terms`,
    privacyUrl: process.env.EARLY_SUPPORT_PRIVACY_URL || `${origin}/early-support/privacy`,
    successUrl:
      process.env.EARLY_SUPPORT_SUCCESS_URL || `${origin}/early-support/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: process.env.EARLY_SUPPORT_CANCEL_URL || `${origin}/early-support`
  };
}

/**
 * Pure builder for the itemized Stripe Invoice (all tiers).
 * Charge line + four $0 included lines + notes + terms footer.
 */
export function buildItemizedInvoice({ tier, amountCents, termsUrl, privacyUrl }) {
  const label = tierLabel(tier);
  const urls = { ...defaultPublicUrls(), ...(termsUrl ? { termsUrl } : {}), ...(privacyUrl ? { privacyUrl } : {}) };
  const charge = chargeInvoiceLine(label, amountCents);
  const included = includedInvoiceLines();
  return {
    productName: checkoutProductName(label),
    productDescription: CHECKOUT_PRODUCT_DESCRIPTION,
    lines: [charge, ...included],
    notes: INVOICE_NOTES,
    footer: invoiceTermsFooter(urls),
    metadata: {
      instrument_type: INSTRUMENT_TYPE,
      terms_version: TERMS_VERSION,
      tier: tier || 'custom'
    }
  };
}

/**
 * Create, finalize (paid out of band — Checkout already collected), and email
 * the itemized invoice. Idempotent on position.stripe_invoice_id.
 * Does not charge again.
 */
export async function sendItemizedInvoice({ stripe, repo, position, customerId, email, tier, amountCents, currency }) {
  if (!position?.id) return { skipped: true, reason: 'no_position' };
  if (position.stripe_invoice_id) {
    return { skipped: true, reason: 'already_invoiced', invoiceId: position.stripe_invoice_id };
  }
  if (!stripe) {
    const err = new Error('Stripe is not configured');
    err.status = 503;
    err.code = 'stripe_not_configured';
    throw err;
  }

  let customer = customerId || position.stripe_customer_id || null;
  if (!customer && email) {
    const created = await stripe.customers.create({
      email,
      metadata: {
        instrument_type: INSTRUMENT_TYPE,
        terms_version: TERMS_VERSION,
        position_id: position.id
      }
    });
    customer = created.id;
    if (repo.setPositionCustomerId) {
      await repo.setPositionCustomerId(position.id, customer);
    }
  }
  if (!customer) {
    const err = new Error('Stripe customer is required to send an invoice');
    err.status = 500;
    err.code = 'invoice_customer_missing';
    throw err;
  }

  const built = buildItemizedInvoice({
    tier: tier || position.tier || 'custom',
    amountCents: amountCents || position.amount_cents
  });

  const idempotencyKey = `early_support_invoice_${position.id}`;
  const invoice = await stripe.invoices.create(
    {
      customer,
      auto_advance: false,
      collection_method: 'send_invoice',
      days_until_due: 30,
      currency: currency || position.currency || 'usd',
      pending_invoice_items_behavior: 'exclude',
      description: built.notes,
      footer: built.footer,
      metadata: {
        ...built.metadata,
        position_id: position.id
      }
    },
    { idempotencyKey }
  );

  for (const [index, line] of built.lines.entries()) {
    await stripe.invoiceItems.create(
      {
        customer,
        invoice: invoice.id,
        currency: currency || position.currency || 'usd',
        amount: line.amountCents,
        description: line.description
      },
      { idempotencyKey: `${idempotencyKey}_line_${index}` }
    );
  }

  await stripe.invoices.finalizeInvoice(invoice.id, { paid_out_of_band: true });
  await stripe.invoices.sendInvoice(invoice.id);

  if (repo.setPositionInvoiceId) {
    await repo.setPositionInvoiceId(position.id, invoice.id);
  }

  return { skipped: false, invoiceId: invoice.id };
}
