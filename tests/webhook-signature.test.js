import assert from 'node:assert/strict';
import test from 'node:test';
import Stripe from 'stripe';
import { handleStripeWebhookRequest } from '../lib/early-support/webhook.js';

const secret = 'whsec_test_early_support';
const stripe = new Stripe('sk_test_signature_verify_only');

function signed(payload) {
  return stripe.webhooks.generateTestHeaderString({ payload, secret });
}

test('rejects a missing signature without processing', async () => {
  let processed = 0;
  const result = await handleStripeWebhookRequest({
    rawBody: '{}',
    signature: '',
    webhookSecret: secret,
    processEvent: async () => {
      processed += 1;
    }
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'missing_signature');
  assert.equal(processed, 0);
});

test('rejects an invalid signature without processing', async () => {
  let processed = 0;
  const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });
  const result = await handleStripeWebhookRequest({
    rawBody: payload,
    signature: 't=1,v1=deadbeef',
    webhookSecret: secret,
    processEvent: async () => {
      processed += 1;
    }
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'invalid_signature');
  assert.equal(processed, 0);
});

test('accepts a valid Stripe signature and processes the event', async () => {
  const event = { id: 'evt_ok', type: 'checkout.session.completed', data: { object: { id: 'cs_1' } } };
  const payload = JSON.stringify(event);
  let seen = null;
  const result = await handleStripeWebhookRequest({
    rawBody: payload,
    signature: signed(payload),
    webhookSecret: secret,
    processEvent: async (parsed) => {
      seen = parsed;
      return { outcome: 'activated', positionId: 'pos_1' };
    }
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.received, true);
  assert.equal(seen.id, 'evt_ok');
});

test('fail closed when webhook secret is missing', async () => {
  let processed = 0;
  const result = await handleStripeWebhookRequest({
    rawBody: '{}',
    signature: 't=1,v1=abc',
    webhookSecret: '',
    processEvent: async () => {
      processed += 1;
    }
  });
  assert.equal(result.status, 503);
  assert.equal(processed, 0);
});
