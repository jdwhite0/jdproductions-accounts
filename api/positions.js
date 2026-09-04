import { createDbRepository } from '../db/repository.js';
import { requireClerkUserId } from '../lib/clerk-auth.js';
import { json, methodNotAllowed, errorResponse } from '../lib/http.js';

export async function GET(request) {
  try {
    const clerkUserId = await requireClerkUserId(request);
    const rows = await createDbRepository().listPositionsForUser(clerkUserId);
    const positions = rows.map(serializePosition);
    return json(200, { positions });
  } catch (err) {
    return errorResponse(err);
  }
}

export function POST() {
  return methodNotAllowed();
}

function serializePosition(row) {
  return {
    id: row.id,
    instrument_type: row.instrument_type,
    instrument_name: row.instrument_name,
    terms_version: row.terms_version,
    counsel_status: row.counsel_status,
    amount_cents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    stripe_checkout_session_id: row.stripe_checkout_session_id,
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
