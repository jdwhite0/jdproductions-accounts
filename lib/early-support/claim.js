import { normalizeEmail } from './email.js';

/**
 * Attach guest Early Support positions to a signed-in Clerk user when a
 * verified email matches supporter_email. Never steals a position already
 * bound to a different clerk_user_id.
 */
export async function claimPositionsForClerkUser({ clerkUserId, repo, getVerifiedEmails }) {
  if (!clerkUserId) {
    const err = new Error('Missing bearer token');
    err.status = 401;
    err.code = 'unauthorized';
    throw err;
  }
  if (typeof getVerifiedEmails !== 'function') {
    const err = new Error('Email lookup is not configured');
    err.status = 503;
    err.code = 'auth_not_configured';
    throw err;
  }

  const raw = await getVerifiedEmails(clerkUserId);
  const emails = [...new Set((raw || []).map(normalizeEmail).filter(Boolean))];
  if (!emails.length) {
    const err = new Error('A verified email is required to claim Early Support positions');
    err.status = 400;
    err.code = 'email_unverified';
    throw err;
  }

  const claimed = await repo.claimGuestPositionsByEmails(clerkUserId, emails);
  return { claimed: claimed.length, positions: claimed, emails };
}
