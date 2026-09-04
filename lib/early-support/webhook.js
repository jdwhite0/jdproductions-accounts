import Stripe from 'stripe';

/**
 * Verify Stripe-Signature, then process. Invalid signatures never touch the ledger.
 */
export async function handleStripeWebhookRequest({
  rawBody,
  signature,
  webhookSecret,
  processEvent,
  constructEvent
}) {
  if (!webhookSecret) {
    return { status: 503, body: { error: 'webhook_not_configured' } };
  }
  if (!signature) {
    return { status: 400, body: { error: 'missing_signature' } };
  }

  const verify =
    constructEvent ||
    ((body, sig, secret) => {
      const stripe = new Stripe('sk_test_signature_verify_only');
      return stripe.webhooks.constructEvent(body, sig, secret);
    });

  let event;
  try {
    event = verify(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('stripe webhook signature rejected', err?.message);
    return { status: 400, body: { error: 'invalid_signature' } };
  }

  try {
    const result = await processEvent(event);
    return { status: 200, body: { received: true, ...summarize(result) } };
  } catch (err) {
    console.error('stripe webhook processing failed', err);
    return { status: 500, body: { error: 'processing_failed' } };
  }
}

function summarize(result) {
  if (!result || typeof result !== 'object') return {};
  return {
    outcome: result.outcome,
    positionId: result.positionId
  };
}
