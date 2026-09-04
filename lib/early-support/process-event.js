import { TERMS_VERSION, INSTRUMENT_TYPE } from './copy.js';
import { normalizeEmail } from './email.js';
import { sendItemizedInvoice } from './invoice.js';

/**
 * Apply a verified Stripe event to the ledger.
 * Call only after signature verification — fail closed: never mark active
 * except from a paid checkout.session.completed or payment_intent.succeeded.
 * Guest payments are identified by supporter email; clerk_user_id is optional.
 */
export async function processStripeEvent(event, repo, options = {}) {
  if (!event?.id || !event?.type) {
    return { outcome: 'ignored', reason: 'malformed_event' };
  }

  const inserted = await repo.tryInsertStripeEvent({
    stripeEventId: event.id,
    type: event.type,
    payload: event
  });
  if (!inserted) {
    const invoice = await maybeSendInvoice(event, repo, options);
    return { outcome: 'duplicate_event', stripeEventId: event.id, invoice };
  }

  let result;
  switch (event.type) {
    case 'checkout.session.completed':
      result = await handleCheckoutSessionCompleted(event, repo);
      break;
    case 'payment_intent.succeeded':
      result = await handlePaymentIntentSucceeded(event, repo);
      break;
    case 'payment_intent.payment_failed':
      result = await handlePaymentIntentFailed(event, repo);
      break;
    case 'charge.refunded':
      result = await handleChargeRefunded(event, repo);
      break;
    default:
      result = { outcome: 'ignored', type: event.type };
  }

  if (result?.positionId && (result.outcome === 'activated' || result.outcome === 'pending')) {
    result.invoice = await maybeSendInvoice(event, repo, options, result.positionId);
  }

  return result;
}

async function maybeSendInvoice(event, repo, options, positionId) {
  if (event.type !== 'checkout.session.completed' && event.type !== 'payment_intent.succeeded') {
    return undefined;
  }
  const session = event.type === 'checkout.session.completed' ? event.data?.object || {} : {};
  const intent = event.type === 'payment_intent.succeeded' ? event.data?.object || {} : {};
  const paid = event.type === 'payment_intent.succeeded' || session.payment_status === 'paid';
  if (!paid) return { skipped: true, reason: 'not_paid' };

  let position = null;
  if (positionId && repo.findPositionById) {
    position = await repo.findPositionById(positionId);
  }
  if (!position && session.id && repo.findPositionByCheckoutSession) {
    position = await repo.findPositionByCheckoutSession(session.id);
  }
  const paymentIntentId = idOf(session.payment_intent) || intent.id;
  if (!position && paymentIntentId && repo.findPositionByPaymentIntent) {
    position = await repo.findPositionByPaymentIntent(paymentIntentId);
  }
  if (!position || position.status !== 'active') {
    return { skipped: true, reason: 'no_active_position' };
  }
  if (position.stripe_invoice_id) {
    return { skipped: true, reason: 'already_invoiced', invoiceId: position.stripe_invoice_id };
  }

  const identity = extractIdentity(session.metadata || intent.metadata || {}, session, intent);
  const customerId =
    idOf(session.customer) || position.stripe_customer_id || idOf(intent.customer) || null;
  const send = options.sendInvoice || (options.stripe ? sendItemizedInvoice : null);
  if (!send) return { skipped: true, reason: 'no_invoice_sender' };

  return send({
    stripe: options.stripe,
    repo,
    position,
    customerId,
    email: identity.email || position.supporter_email,
    tier: identity.tier || position.tier,
    amountCents: position.amount_cents,
    currency: position.currency
  });
}

async function handleCheckoutSessionCompleted(event, repo) {
  const session = event.data?.object || {};
  const metadata = session.metadata || {};
  if (metadata.instrument_type && metadata.instrument_type !== INSTRUMENT_TYPE) {
    return { outcome: 'ignored', reason: 'not_early_support' };
  }

  const identity = extractIdentity(metadata, session, {});
  if (!identity.clerkUserId && !identity.email) {
    return { outcome: 'ignored', reason: 'missing_identity' };
  }

  const instrument = await resolveInstrument(repo, metadata);
  if (!instrument) {
    const err = new Error('Early Support instrument is not seeded');
    err.status = 500;
    err.code = 'instrument_missing';
    throw err;
  }

  const amountCents = Number(session.amount_total);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { outcome: 'ignored', reason: 'invalid_amount' };
  }

  const paid = session.payment_status === 'paid';
  const status = paid ? 'active' : 'pending';
  const paymentIntentId = idOf(session.payment_intent);
  const checkoutSessionId = session.id;

  const { position, previousStatus } = await repo.upsertPositionFromPayment({
    clerkUserId: identity.clerkUserId,
    supporterEmail: identity.email,
    instrumentId: instrument.id,
    amountCents,
    currency: session.currency || 'usd',
    status,
    checkoutSessionId,
    paymentIntentId,
    stripeCustomerId: idOf(session.customer),
    tier: identity.tier
  });

  if (paid && previousStatus !== 'active' && position.status === 'active') {
    await repo.appendLedger({
      positionId: position.id,
      entryType: 'payment_succeeded',
      amountCents,
      stripeEventId: event.id,
      metadata: { source: 'checkout.session.completed', email: identity.email, tier: identity.tier }
    });
  }

  return { outcome: paid ? 'activated' : 'pending', positionId: position.id };
}

async function handlePaymentIntentSucceeded(event, repo) {
  const intent = event.data?.object || {};
  const metadata = intent.metadata || {};
  if (metadata.instrument_type && metadata.instrument_type !== INSTRUMENT_TYPE) {
    return { outcome: 'ignored', reason: 'not_early_support' };
  }

  const paymentIntentId = intent.id;
  const existing = await repo.findPositionByPaymentIntent(paymentIntentId);
  const identity = extractIdentity(metadata, {}, intent);

  const clerkUserId = identity.clerkUserId || existing?.clerk_user_id || null;
  const email = identity.email || existing?.supporter_email || null;
  if (!clerkUserId && !email) {
    return { outcome: 'ignored', reason: 'missing_identity' };
  }

  const instrument = existing ? { id: existing.instrument_id } : await resolveInstrument(repo, metadata);
  if (!instrument) {
    const err = new Error('Early Support instrument is not seeded');
    err.status = 500;
    err.code = 'instrument_missing';
    throw err;
  }

  const amountCents = Number(intent.amount_received || intent.amount);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { outcome: 'ignored', reason: 'invalid_amount' };
  }

  const { position, previousStatus } = await repo.upsertPositionFromPayment({
    clerkUserId,
    supporterEmail: email,
    instrumentId: instrument.id,
    amountCents,
    currency: intent.currency || existing?.currency || 'usd',
    status: 'active',
    checkoutSessionId: existing?.stripe_checkout_session_id ?? null,
    paymentIntentId,
    stripeCustomerId: idOf(intent.customer) || existing?.stripe_customer_id,
    tier: identity.tier || existing?.tier
  });

  if (previousStatus !== 'active' && position.status === 'active') {
    await repo.appendLedger({
      positionId: position.id,
      entryType: 'payment_succeeded',
      amountCents,
      stripeEventId: event.id,
      metadata: { source: 'payment_intent.succeeded', email, tier: identity.tier || existing?.tier }
    });
  }

  return { outcome: 'activated', positionId: position.id };
}

async function handlePaymentIntentFailed(event, repo) {
  const intent = event.data?.object || {};
  const existing = await repo.findPositionByPaymentIntent(intent.id);
  if (!existing) {
    return { outcome: 'ignored', reason: 'no_position' };
  }
  if (existing.status === 'active' || existing.status === 'refunded') {
    return { outcome: 'ignored', reason: 'already_final' };
  }
  await repo.markPositionStatus(existing.id, 'void');
  await repo.appendLedger({
    positionId: existing.id,
    entryType: 'payment_failed',
    amountCents: Number(intent.amount) || existing.amount_cents,
    stripeEventId: event.id,
    metadata: { source: 'payment_intent.payment_failed' }
  });
  return { outcome: 'voided', positionId: existing.id };
}

async function handleChargeRefunded(event, repo) {
  const charge = event.data?.object || {};
  const paymentIntentId = idOf(charge.payment_intent);
  const existing = await repo.findPositionByPaymentIntent(paymentIntentId);
  if (!existing) {
    return { outcome: 'ignored', reason: 'no_position' };
  }
  await repo.markPositionStatus(existing.id, 'refunded');
  await repo.appendLedger({
    positionId: existing.id,
    entryType: 'refunded',
    amountCents: Number(charge.amount_refunded) || existing.amount_cents,
    stripeEventId: event.id,
    metadata: { source: 'charge.refunded' }
  });
  return { outcome: 'refunded', positionId: existing.id };
}

export function extractIdentity(metadata = {}, session = {}, intent = {}) {
  const clerkFromMeta = metadata.clerk_user_id || '';
  const clientRef = session.client_reference_id || '';
  const clerkUserId = clerkFromMeta || (typeof clientRef === 'string' && clientRef.startsWith('user_') ? clientRef : '');
  const email = normalizeEmail(
    metadata.email || session.customer_email || session.customer_details?.email || intent.receipt_email || ''
  );
  const tier = metadata.tier || null;
  return {
    clerkUserId: clerkUserId || null,
    email: email || null,
    tier
  };
}

async function resolveInstrument(repo, metadata) {
  if (metadata.instrument_id && repo.getInstrumentById) {
    const byId = await repo.getInstrumentById(metadata.instrument_id);
    if (byId) return byId;
  }
  const termsVersion = metadata.terms_version || process.env.EARLY_SUPPORT_TERMS_VERSION || TERMS_VERSION;
  return repo.getInstrumentByTermsVersion(termsVersion);
}

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.id || null;
}
