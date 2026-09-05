import assert from 'node:assert/strict';
import test from 'node:test';
import { mintSignInTokenForUser, optionalClerkUserId, requireClerkUserId, SIGN_IN_TOKEN_TTL_SECONDS } from '../lib/clerk-auth.js';
import { coerceAmountCents, createEarlySupportCheckout, resolveTierAndAmount } from '../lib/early-support/checkout.js';
import { createMemoryRepo } from './helpers/memory-repo.js';

function fakeStripe(overrides = {}) {
  return {
    checkout: {
      sessions: {
        create: async (params) => {
          fakeStripe.lastParams = params;
          return {
            id: 'cs_pending_only',
            url: 'https://checkout.stripe.com/c/pay/cs_pending_only',
            payment_intent: null,
            ...overrides.session
          };
        }
      }
    }
  };
}

test('checkout helper never writes status=active', async () => {
  const repo = createMemoryRepo();
  const stripe = fakeStripe();

  const result = await createEarlySupportCheckout({
    clerkUserId: 'user_abc',
    email: 'member@example.com',
    amountCents: 25000,
    tier: 'standard',
    repo,
    stripe
  });

  assert.equal(result.status, 'pending');
  assert.equal(repo.positions.length, 1);
  assert.equal(repo.positions[0].status, 'pending');
  assert.equal(repo.ledger[0].entry_type, 'intent_created');
});

test('guest checkout is allowed without clerk_user_id and stamps metadata', async () => {
  const repo = createMemoryRepo();
  const stripe = fakeStripe();

  const result = await createEarlySupportCheckout({
    clerkUserId: null,
    email: 'Guest@Example.COM',
    tier: 'starter',
    repo,
    stripe
  });

  assert.equal(result.status, 'pending');
  assert.equal(result.tier, 'starter');
  assert.equal(result.email, 'guest@example.com');
  assert.equal(repo.positions[0].clerk_user_id, null);
  assert.equal(repo.positions[0].supporter_email, 'guest@example.com');
  assert.equal(repo.positions[0].status, 'pending');

  const params = fakeStripe.lastParams;
  assert.equal(params.customer_email, 'guest@example.com');
  assert.equal(params.customer_creation, 'always');
  assert.equal(params.client_reference_id, undefined);
  assert.equal(params.metadata.instrument_type, 'early_support');
  assert.equal(params.metadata.terms_version, 'early_support_v0');
  assert.equal(params.metadata.tier, 'starter');
  assert.equal(params.metadata.email, 'guest@example.com');
  assert.equal(params.metadata.clerk_user_id, undefined);
  assert.equal(params.payment_intent_data.receipt_email, 'guest@example.com');
  assert.equal(params.line_items[0].price_data.product_data.name, 'Early Support — Believe');
  assert.match(params.line_items[0].price_data.product_data.description, /Not equity/);
});

test('signed-in checkout still pre-fills clerk_user_id in metadata', async () => {
  const repo = createMemoryRepo();
  const stripe = fakeStripe();

  await createEarlySupportCheckout({
    clerkUserId: 'user_abc',
    email: 'member@example.com',
    tier: 'anchor',
    repo,
    stripe
  });

  const params = fakeStripe.lastParams;
  assert.equal(params.client_reference_id, 'user_abc');
  assert.equal(params.metadata.clerk_user_id, 'user_abc');
  assert.equal(params.metadata.tier, 'anchor');
  assert.equal(params.line_items[0].price_data.unit_amount, 50000);
});

test('amount_cents is rejected outside server bounds', () => {
  assert.equal(coerceAmountCents(2500), 2500);
  assert.throws(() => coerceAmountCents(1), /amount_cents/);
  assert.throws(() => coerceAmountCents(99_999_999), /amount_cents/);
  assert.throws(() => coerceAmountCents(12.5), /amount_cents/);
});

test('named tiers resolve to locked amounts and custom respects env bounds', () => {
  assert.deepEqual(resolveTierAndAmount({ tier: 'starter' }), {
    tier: 'starter',
    amountCents: 10000,
    label: 'Believe'
  });
  assert.deepEqual(resolveTierAndAmount({ tier: 'standard' }), {
    tier: 'standard',
    amountCents: 25000,
    label: 'Stand'
  });
  assert.deepEqual(resolveTierAndAmount({ tier: 'anchor' }), {
    tier: 'anchor',
    amountCents: 50000,
    label: 'Build'
  });
  assert.equal(resolveTierAndAmount({ amountCents: 33300 }).tier, 'custom');
  assert.throws(() => resolveTierAndAmount({ amountCents: 1 }), /amount_cents/);
});

test('guest checkout rejects invalid email', async () => {
  const repo = createMemoryRepo();
  await assert.rejects(
    () =>
      createEarlySupportCheckout({
        email: 'not-an-email',
        tier: 'standard',
        repo,
        stripe: fakeStripe()
      }),
    (err) => err.status === 400 && err.code === 'invalid_email'
  );
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

  const guest = await optionalClerkUserId({ headers: { get: () => '' } });
  assert.equal(guest, null);

  if (previous == null) delete process.env.CLERK_SECRET_KEY;
  else process.env.CLERK_SECRET_KEY = previous;
});

test('GET-style auth helper stays fail-closed without a bearer (positions/claim)', async () => {
  const previous = process.env.CLERK_SECRET_KEY;
  process.env.CLERK_SECRET_KEY = 'sk_test_dummy';
  await assert.rejects(
    () => requireClerkUserId({ headers: { get: () => null } }),
    (err) => err.code === 'unauthorized'
  );
  if (previous == null) delete process.env.CLERK_SECRET_KEY;
  else process.env.CLERK_SECRET_KEY = previous;
});

test('sign-in token mint is short-lived and fail-closed', async () => {
  await assert.rejects(
    () => mintSignInTokenForUser(''),
    (err) => err.status === 401 && err.code === 'unauthorized'
  );

  const ticket = await mintSignInTokenForUser('user_abc', {
    createSignInToken: async ({ userId, expiresInSeconds }) => {
      assert.equal(userId, 'user_abc');
      assert.equal(expiresInSeconds, SIGN_IN_TOKEN_TTL_SECONDS);
      assert.equal(SIGN_IN_TOKEN_TTL_SECONDS, 60);
      return { token: 'tk_test_not_a_real_secret' };
    }
  });
  assert.equal(ticket, 'tk_test_not_a_real_secret');

  await assert.rejects(
    () =>
      mintSignInTokenForUser('user_abc', {
        createSignInToken: async () => ({ token: null })
      }),
    (err) => err.status === 503 && err.code === 'ticket_mint_failed'
  );
});
