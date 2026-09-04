import { createDbRepository } from '../db/repository.js';
import { requireClerkUserId } from '../lib/clerk-auth.js';
import { json, methodNotAllowed, errorResponse } from '../lib/http.js';
import { formatUsdFromCents, TERMS_VERSION } from '../lib/early-support/copy.js';

export async function GET(request) {
  try {
    const clerkUserId = await requireClerkUserId(request);
    const repo = createDbRepository();
    const rows = await repo.listPositionsForUser(clerkUserId);
    const ledger = repo.listLedgerForUser ? await repo.listLedgerForUser(clerkUserId) : [];
    const positions = rows.map(serializePosition);
    return json(200, {
      positions,
      activity: buildActivity(positions, ledger)
    });
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
    terms_version: row.terms_version || TERMS_VERSION,
    counsel_status: row.counsel_status,
    amount_cents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    tier: row.tier || null,
    supporter_email: row.supporter_email || null,
    stripe_checkout_session_id: row.stripe_checkout_session_id,
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    stripe_invoice_id: row.stripe_invoice_id || null,
    claimed_at: row.claimed_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function buildActivity(positions, ledger) {
  const byId = new Map(positions.map((p) => [p.id, p]));
  const items = [];

  for (const row of ledger) {
    const position = byId.get(row.position_id);
    const amount = formatUsdFromCents(row.amount_cents, position?.currency || 'usd');
    if (row.entry_type === 'payment_succeeded') {
      items.push({
        id: row.id,
        type: 'payment_received',
        title: 'Payment received',
        subtitle: amount,
        occurred_at: row.occurred_at,
        position_id: row.position_id
      });
      items.push({
        id: `${row.id}_opened`,
        type: 'position_opened',
        title: 'Early support position opened',
        subtitle: 'Position is now active',
        occurred_at: row.occurred_at,
        position_id: row.position_id
      });
    } else if (row.entry_type === 'intent_created') {
      items.push({
        id: row.id,
        type: 'terms_accepted',
        title: 'Terms accepted',
        subtitle: position?.terms_version || TERMS_VERSION,
        occurred_at: row.occurred_at,
        position_id: row.position_id
      });
    }
  }

  items.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
  return items.slice(0, 20);
}
