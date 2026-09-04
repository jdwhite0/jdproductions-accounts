import assert from 'node:assert/strict';
import test from 'node:test';
import { claimPositionsForClerkUser } from '../lib/early-support/claim.js';
import { createMemoryRepo } from './helpers/memory-repo.js';

test('claim matches guest positions by verified email and binds clerk_user_id', async () => {
  const repo = createMemoryRepo();
  await repo.createPendingPosition({
    clerkUserId: null,
    supporterEmail: 'guest@example.com',
    instrumentId: 'inst_early_support_v0',
    amountCents: 25000,
    checkoutSessionId: 'cs_guest_1',
    tier: 'standard'
  });
  await repo.createPendingPosition({
    clerkUserId: null,
    supporterEmail: 'other@example.com',
    instrumentId: 'inst_early_support_v0',
    amountCents: 10000,
    checkoutSessionId: 'cs_other',
    tier: 'starter'
  });

  const result = await claimPositionsForClerkUser({
    clerkUserId: 'user_abc',
    repo,
    getVerifiedEmails: async () => ['guest@example.com']
  });

  assert.equal(result.claimed, 1);
  assert.equal(result.positions[0].clerk_user_id, 'user_abc');
  assert.ok(result.positions[0].claimed_at);
  assert.equal(repo.positions[1].clerk_user_id, null);
});

test('claim is case-insensitive on email and does not steal bound positions', async () => {
  const repo = createMemoryRepo();
  await repo.createPendingPosition({
    clerkUserId: null,
    supporterEmail: 'Guest@Example.COM',
    instrumentId: 'inst_early_support_v0',
    amountCents: 10000,
    checkoutSessionId: 'cs_case',
    tier: 'starter'
  });
  const taken = await repo.createPendingPosition({
    clerkUserId: 'user_other',
    supporterEmail: 'taken@example.com',
    instrumentId: 'inst_early_support_v0',
    amountCents: 10000,
    checkoutSessionId: 'cs_taken',
    tier: 'starter'
  });

  const result = await claimPositionsForClerkUser({
    clerkUserId: 'user_abc',
    repo,
    getVerifiedEmails: async () => ['GUEST@example.com', 'taken@example.com']
  });

  assert.equal(result.claimed, 1);
  assert.equal(repo.positions.find((p) => p.id === taken.id).clerk_user_id, 'user_other');
});

test('claim fails closed without clerk user or verified email', async () => {
  const repo = createMemoryRepo();
  await assert.rejects(
    () => claimPositionsForClerkUser({ clerkUserId: null, repo, getVerifiedEmails: async () => [] }),
    (err) => err.status === 401
  );
  await assert.rejects(
    () =>
      claimPositionsForClerkUser({
        clerkUserId: 'user_abc',
        repo,
        getVerifiedEmails: async () => []
      }),
    (err) => err.status === 400 && err.code === 'email_unverified'
  );
});
