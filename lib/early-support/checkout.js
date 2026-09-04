import { TERMS_VERSION, INSTRUMENT_TYPE, TIERS, checkoutProductName, CHECKOUT_PRODUCT_DESCRIPTION, tierLabel } from './copy.js';
import { requireValidEmail } from './email.js';
import { defaultPublicUrls } from './invoice.js';

const DEFAULT_MIN_CENTS = 1000;
const DEFAULT_MAX_CENTS = 10_000_000;

/**
 * Create a Stripe Checkout Session for Early Support.
 * Guest checkout is allowed (email required). Signed-in checkout may pre-fill clerk_user_id.
 * Never writes status=active — only the verified webhook may activate a position.
 */
export async function createEarlySupportCheckout({
  clerkUserId = null,
  email,
  amountCents: requestedAmount,
  tier: requestedTier,
  acceptedTerms,
  repo,
  stripe
}) {
  const supporterEmail = requireValidEmail(email);
  if (acceptedTerms === false) {
    const err = new Error('Early Support Terms must be accepted');
    err.status = 400;
    err.code = 'terms_not_accepted';
    throw err;
  }

  const termsVersion = process.env.EARLY_SUPPORT_TERMS_VERSION || TERMS_VERSION;
  const instrument = await repo.getInstrumentByTermsVersion(termsVersion);
  if (!instrument) {
    const err = new Error('Early Support instrument is not seeded');
    err.status = 503;
    err.code = 'instrument_missing';
    throw err;
  }

  const { amountCents, tier, label } = resolveTierAndAmount({
    tier: requestedTier,
    amountCents: requestedAmount
  });

  const urls = defaultPublicUrls();
  const metadata = buildCheckoutMetadata({
    clerkUserId,
    email: supporterEmail,
    tier,
    instrumentId: instrument.id,
    termsVersion
  });

  const sessionParams = {
    mode: 'payment',
    customer_email: supporterEmail,
    customer_creation: 'always',
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    metadata,
    payment_intent_data: {
      metadata,
      receipt_email: supporterEmail
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: checkoutProductName(label),
            description: CHECKOUT_PRODUCT_DESCRIPTION
          }
        }
      }
    ]
  };
  if (clerkUserId) {
    sessionParams.client_reference_id = clerkUserId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  let position = null;
  try {
    position = await repo.createPendingPosition({
      clerkUserId: clerkUserId || null,
      supporterEmail,
      instrumentId: instrument.id,
      amountCents,
      currency: 'usd',
      checkoutSessionId: session.id,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
      tier
    });
    await repo.appendLedger({
      positionId: position.id,
      entryType: 'intent_created',
      amountCents,
      stripeEventId: null,
      metadata: {
        stripe_checkout_session_id: session.id,
        terms_version: termsVersion,
        tier,
        email: supporterEmail
      }
    });
  } catch (err) {
    console.error('pending position write failed; webhook remains source of truth', err);
  }

  return {
    url: session.url,
    checkoutSessionId: session.id,
    positionId: position?.id ?? null,
    status: position?.status ?? 'pending',
    tier,
    email: supporterEmail
  };
}

export function buildCheckoutMetadata({ clerkUserId, email, tier, instrumentId, termsVersion }) {
  const metadata = {
    instrument_type: INSTRUMENT_TYPE,
    terms_version: termsVersion || TERMS_VERSION,
    tier: tier || 'custom',
    email
  };
  if (instrumentId) metadata.instrument_id = instrumentId;
  if (clerkUserId) metadata.clerk_user_id = clerkUserId;
  return metadata;
}

export function resolveTierAndAmount({ tier, amountCents }) {
  const key = typeof tier === 'string' ? tier.trim().toLowerCase() : '';
  if (key && TIERS[key]) {
    const cents = TIERS[key].amountCents;
    assertAmountInBounds(cents);
    return { tier: key, amountCents: cents, label: TIERS[key].label };
  }
  const cents = coerceAmountCents(amountCents);
  return { tier: 'custom', amountCents: cents, label: tierLabel('custom') };
}

export function coerceAmountCents(requestedAmount) {
  const raw = requestedAmount == null || requestedAmount === '' ? fallbackAmount() : Number(requestedAmount);
  assertAmountInBounds(raw);
  return raw;
}

function assertAmountInBounds(raw) {
  const min = intEnv('EARLY_SUPPORT_MIN_AMOUNT_CENTS', DEFAULT_MIN_CENTS);
  const max = intEnv('EARLY_SUPPORT_MAX_AMOUNT_CENTS', DEFAULT_MAX_CENTS);
  if (!Number.isInteger(raw) || raw < min || raw > max) {
    const err = new Error(`amount_cents must be an integer between ${min} and ${max}`);
    err.status = 400;
    err.code = 'invalid_amount';
    throw err;
  }
}

function fallbackAmount() {
  const min = intEnv('EARLY_SUPPORT_MIN_AMOUNT_CENTS', DEFAULT_MIN_CENTS);
  return intEnv('EARLY_SUPPORT_AMOUNT_CENTS', min);
}

function intEnv(name, fallback) {
  if (process.env[name] == null || process.env[name] === '') return fallback;
  const value = Number(process.env[name]);
  return Number.isInteger(value) ? value : fallback;
}

/** @deprecated price_data from amount/tier is the product path; kept for tests that import it. */
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
