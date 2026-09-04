import { createDbRepository } from '../../db/repository.js';
import { requireClerkUserId, getVerifiedEmailsForUser } from '../../lib/clerk-auth.js';
import { json, methodNotAllowed, errorResponse } from '../../lib/http.js';
import { claimPositionsForClerkUser } from '../../lib/early-support/claim.js';
import { TERMS_VERSION } from '../../lib/early-support/copy.js';

export async function POST(request) {
  try {
    const clerkUserId = await requireClerkUserId(request);
    const result = await claimPositionsForClerkUser({
      clerkUserId,
      repo: createDbRepository(),
      getVerifiedEmails: getVerifiedEmailsForUser
    });
    return json(200, {
      claimed: result.claimed,
      positions: result.positions.map(serializeClaimed)
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export function GET() {
  return methodNotAllowed();
}

function serializeClaimed(row) {
  return {
    id: row.id,
    status: row.status,
    amount_cents: row.amount_cents,
    currency: row.currency,
    tier: row.tier || null,
    terms_version: TERMS_VERSION,
    claimed_at: row.claimed_at || null
  };
}
