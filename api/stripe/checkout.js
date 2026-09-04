import { createDbRepository } from '../../db/repository.js';
import { requireClerkUserId } from '../../lib/clerk-auth.js';
import { json, methodNotAllowed, errorResponse } from '../../lib/http.js';
import { getStripe } from '../../lib/stripe.js';
import { createEarlySupportCheckout } from '../../lib/early-support/checkout.js';

export async function POST(request) {
  try {
    const clerkUserId = await requireClerkUserId(request);
    let body = {};
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    }

    const result = await createEarlySupportCheckout({
      clerkUserId,
      amountCents: body.amount_cents,
      repo: createDbRepository(),
      stripe: getStripe()
    });

    return json(200, {
      url: result.url,
      checkout_session_id: result.checkoutSessionId,
      position_id: result.positionId,
      status: result.status
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export function GET() {
  return methodNotAllowed();
}
