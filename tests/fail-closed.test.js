import assert from 'node:assert/strict';
import test from 'node:test';
import { requireClerkUserId } from '../lib/clerk-auth.js';
import { coerceAmountCents, createEarlySupportCheckout } from '../lib/early-support/checkout.js';
import { createMemoryRepo } from './helpers/memory-repo.js';

test('checkout helper never writes status=active', async () => {
  const repo = createMemoryRepo();
  const stripe = {
    checkout: {
      sessions: {
        create: async () => ({
          id: 'cs_pending_only',
          url: 'https://checkout.stripe.com/c/pay/cs_pending_only',
          payment_intent: null
        })
      }
    }
  };

  const result = await createEarlySupportCheckout({
    clerkUserId: 'user_abc',
    amountCents: 2500,
    repo,
    stripe
  });

  assert.equal(result.status, 'pending');
  assert.equal(repo.positions.length, 1);
  assert.equal(repo.positions[0].status, 'pending');
  assert.equal(repo.ledger[0].entry_type, 'intent_created');
});

test('amount_cents is rejected outside server bounds', () => {
  assert.equal(coerceAmountCents(2500), 2500);
  assert.throws(() => coerceAmountCents(1), /amount_cents/);
  assert.throws(() => coerceAmountCents(99_999_999), /amount_cents/);
  assert.throws(() => coerceAmountCents(12.5), /amount_cents/);
});

test('Clerk auth fails closed when secret or bearer is missing', async () => {
  const previous = process.env.CLERK_SECRET_KEY;
  delete process.env.CLERK_SECRET_KEY;
  await assert.rejects(
    () => requireClerkUserId({ headers: { get: () => 'Bearer test' } }),
    (err) => err.status === 503 && err.code === 'auth_not_configured'
  );

  process.env.CLERK_SECRET_KEY = 'sk_test_dummy';
  await assert.rejects(
    () => requireClerkUserId({ headers: { get: () => '' } }),
    (err) => err.status === 401 && err.code === 'unauthorized'
  );

  if (previous == null) delete process.env.CLERK_SECRET_KEY;
  else process.env.CLERK_SECRET_KEY = previous;
});
