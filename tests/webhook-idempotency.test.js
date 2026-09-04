import assert from 'node:assert/strict';
import test from 'node:test';
import { processStripeEvent } from '../lib/early-support/process-event.js';
import {
  checkoutCompletedEvent,
  createMemoryRepo,
  paymentIntentSucceededEvent
} from './helpers/memory-repo.js';

test('same checkout.session.completed event is applied once', async () => {
  const repo = createMemoryRepo();
  const event = checkoutCompletedEvent();

  const first = await processStripeEvent(event, repo);
  const second = await processStripeEvent(event, repo);

  assert.equal(first.outcome, 'activated');
  assert.equal(second.outcome, 'duplicate_event');
  assert.equal(repo.positions.length, 1);
  assert.equal(repo.positions[0].status, 'active');
  assert.equal(repo.ledger.filter((row) => row.entry_type === 'payment_succeeded').length, 1);
});

test('checkout.session.completed then payment_intent.succeeded does not duplicate the position', async () => {
  const repo = createMemoryRepo();
  const checkout = checkoutCompletedEvent();
  const intent = paymentIntentSucceededEvent({ id: 'evt_pi_after' });

  await processStripeEvent(checkout, repo);
  const afterPi = await processStripeEvent(intent, repo);

  assert.equal(repo.positions.length, 1);
  assert.equal(repo.positions[0].status, 'active');
  assert.equal(repo.ledger.filter((row) => row.entry_type === 'payment_succeeded').length, 1);
  assert.equal(afterPi.outcome, 'activated');
});

test('unpaid checkout.session.completed does not create an active position', async () => {
  const repo = createMemoryRepo();
  const event = checkoutCompletedEvent({ paymentStatus: 'unpaid' });
  const result = await processStripeEvent(event, repo);
  assert.equal(result.outcome, 'pending');
  assert.equal(repo.positions[0].status, 'pending');
  assert.equal(repo.ledger.filter((row) => row.entry_type === 'payment_succeeded').length, 0);
});

test('events without clerk_user_id do not create a position (fail closed)', async () => {
  const repo = createMemoryRepo();
  const event = {
    id: 'evt_stray',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_stray',
        amount_total: 5000,
        payment_status: 'paid',
        metadata: { instrument_type: 'early_support' }
      }
    }
  };
  const result = await processStripeEvent(event, repo);
  assert.equal(result.outcome, 'ignored');
  assert.equal(repo.positions.length, 0);
});
