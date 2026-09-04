const DEFAULT_MIN_CENTS = 1000;
const DEFAULT_MAX_CENTS = 10_000_000;

/**
 * Create a Stripe Checkout Session for Early Support.
 * Never writes status=active — only the verified webhook may activate a position.
 */
export async function createEarlySupportCheckout({ clerkUserId, amountCents: requestedAmount, repo, stripe }) {
  const termsVersion = process.env.EARLY_SUPPORT_TERMS_VERSION || 'early_support_v0';
  const instrument = await repo.getInstrumentByTermsVersion(termsVersion);
  if (!instrument) {
    const err = new Error('Early Support instrument is not seeded');
    err.status = 503;
    err.code = 'instrument_missing';
    throw err;
  }

  const priceId = process.env.STRIPE_PRICE_ID || '';
  const { amountCents, lineItems } = await resolveLineItems({ stripe, priceId, requestedAmount });

  const successUrl =
    process.env.EARLY_SUPPORT_SUCCESS_URL || 'https://accounts.jdproductions.io/positions?checkout=success';
  const cancelUrl =
    process.env.EARLY_SUPPORT_CANCEL_URL || 'https://accounts.jdproductions.io/positions?checkout=cancel';

  const metadata = {
    instrument_type: 'early_support',
    clerk_user_id: clerkUserId,
    instrument_id: instrument.id,
    terms_version: termsVersion
  };

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: clerkUserId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: { metadata },
    line_items: lineItems
  });

  let position = null;
  try {
    position = await repo.createPendingPosition({
      clerkUserId,
      instrumentId: instrument.id,
      amountCents,
      currency: 'usd',
      checkoutSessionId: session.id,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null
    });
    await repo.appendLedger({
      positionId: position.id,
      entryType: 'intent_created',
      amountCents,
      stripeEventId: null,
      metadata: { stripe_checkout_session_id: session.id }
    });
  } catch (err) {
    console.error('pending position write failed; webhook remains source of truth', err);
  }

  return {
    url: session.url,
    checkoutSessionId: session.id,
    positionId: position?.id ?? null,
    status: position?.status ?? 'pending'
  };
}

export async function resolveLineItems({ stripe, priceId, requestedAmount }) {
  if (priceId) {
    const price = await stripe.prices.retrieve(priceId);
    const amountCents = Number(price.unit_amount);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      const err = new Error('STRIPE_PRICE_ID has no unit_amount; set EARLY_SUPPORT_AMOUNT_CENTS');
      err.status = 503;
      err.code = 'price_unusable';
      throw err;
    }
    return {
      amountCents,
      lineItems: [{ price: priceId, quantity: 1 }]
    };
  }

  const amountCents = coerceAmountCents(requestedAmount);
  return {
    amountCents,
    lineItems: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: { name: 'Early Support' }
        }
      }
    ]
  };
}

export function coerceAmountCents(requestedAmount) {
  const min = intEnv('EARLY_SUPPORT_MIN_AMOUNT_CENTS', DEFAULT_MIN_CENTS);
  const max = intEnv('EARLY_SUPPORT_MAX_AMOUNT_CENTS', DEFAULT_MAX_CENTS);
  const fallback = intEnv('EARLY_SUPPORT_AMOUNT_CENTS', min);
  const raw = requestedAmount == null || requestedAmount === '' ? fallback : Number(requestedAmount);
  if (!Number.isInteger(raw) || raw < min || raw > max) {
    const err = new Error(`amount_cents must be an integer between ${min} and ${max}`);
    err.status = 400;
    err.code = 'invalid_amount';
    throw err;
  }
  return raw;
}

function intEnv(name, fallback) {
  if (process.env[name] == null || process.env[name] === '') return fallback;
  const value = Number(process.env[name]);
  return Number.isInteger(value) ? value : fallback;
}
