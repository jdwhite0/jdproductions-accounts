const TERMS_VERSION = () => process.env.EARLY_SUPPORT_TERMS_VERSION || 'early_support_v0';

/**
 * Apply a verified Stripe event to the ledger.
 * Call only after signature verification — fail closed: never mark active
 * except from a paid checkout.session.completed or payment_intent.succeeded.
 */
export async function processStripeEvent(event, repo) {
  if (!event?.id || !event?.type) {
    return { outcome: 'ignored', reason: 'malformed_event' };
  }

  const inserted = await repo.tryInsertStripeEvent({
    stripeEventId: event.id,
    type: event.type,
    payload: event
  });
  if (!inserted) {
    return { outcome: 'duplicate_event', stripeEventId: event.id };
  }

  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutSessionCompleted(event, repo);
    case 'payment_intent.succeeded':
      return handlePaymentIntentSucceeded(event, repo);
    case 'payment_intent.payment_failed':
      return handlePaymentIntentFailed(event, repo);
    case 'charge.refunded':
      return handleChargeRefunded(event, repo);
    default:
      return { outcome: 'ignored', type: event.type };
  }
}

async function handleCheckoutSessionCompleted(event, repo) {
  const session = event.data?.object || {};
  const metadata = session.metadata || {};
  if (metadata.instrument_type && metadata.instrument_type !== 'early_support') {
    return { outcome: 'ignored', reason: 'not_early_support' };
  }

  const clerkUserId = metadata.clerk_user_id || session.client_reference_id;
  if (!clerkUserId) {
    return { outcome: 'ignored', reason: 'missing_clerk_user' };
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
    clerkUserId,
    instrumentId: instrument.id,
    amountCents,
    currency: session.currency || 'usd',
    status,
    checkoutSessionId,
    paymentIntentId
  });

  if (paid && previousStatus !== 'active' && position.status === 'active') {
    await repo.appendLedger({
      positionId: position.id,
      entryType: 'payment_succeeded',
      amountCents,
      stripeEventId: event.id,
      metadata: { source: 'checkout.session.completed' }
    });
  }

  return { outcome: paid ? 'activated' : 'pending', positionId: position.id };
}

async function handlePaymentIntentSucceeded(event, repo) {
  const intent = event.data?.object || {};
  const metadata = intent.metadata || {};
  if (metadata.instrument_type && metadata.instrument_type !== 'early_support') {
    return { outcome: 'ignored', reason: 'not_early_support' };
  }

  const paymentIntentId = intent.id;
  const existing = await repo.findPositionByPaymentIntent(paymentIntentId);

  const clerkUserId = metadata.clerk_user_id || existing?.clerk_user_id;
  if (!clerkUserId) {
    return { outcome: 'ignored', reason: 'missing_clerk_user' };
  }

  const instrument = existing
    ? { id: existing.instrument_id }
    : await resolveInstrument(repo, metadata);
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
    instrumentId: instrument.id,
    amountCents,
    currency: intent.currency || existing?.currency || 'usd',
    status: 'active',
    checkoutSessionId: existing?.stripe_checkout_session_id ?? null,
    paymentIntentId
  });

  if (previousStatus !== 'active' && position.status === 'active') {
    await repo.appendLedger({
      positionId: position.id,
      entryType: 'payment_succeeded',
      amountCents,
      stripeEventId: event.id,
      metadata: { source: 'payment_intent.succeeded' }
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

async function resolveInstrument(repo, metadata) {
  if (metadata.instrument_id && repo.getInstrumentById) {
    const byId = await repo.getInstrumentById(metadata.instrument_id);
    if (byId) return byId;
  }
  const termsVersion = metadata.terms_version || TERMS_VERSION();
  return repo.getInstrumentByTermsVersion(termsVersion);
}

function idOf(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.id || null;
}
