import { createDbRepository } from '../../db/repository.js';
import { optionalClerkUserId, getVerifiedEmailsForUser } from '../../lib/clerk-auth.js';
import { json, methodNotAllowed, errorResponse } from '../../lib/http.js';
import { getStripe } from '../../lib/stripe.js';
import { createEarlySupportCheckout } from '../../lib/early-support/checkout.js';

export async function POST(request) {
  try {
    const clerkUserId = await optionalClerkUserId(request);
    let body = {};
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    }

    let email = body.email;
    if (!email && clerkUserId) {
      const emails = await getVerifiedEmailsForUser(clerkUserId);
      email = emails[0];
    }

    if (body.accepted_terms !== true) {
      const err = new Error('Early Support Terms must be accepted');
      err.status = 400;
      err.code = 'terms_not_accepted';
      throw err;
    }

    const result = await createEarlySupportCheckout({
      clerkUserId,
      email,
      amountCents: body.amount_cents,
      tier: body.tier,
      acceptedTerms: body.accepted_terms,
      repo: createDbRepository(),
      stripe: getStripe()
    });

    return json(200, {
      url: result.url,
      checkout_session_id: result.checkoutSessionId,
      position_id: result.positionId,
      status: result.status,
      tier: result.tier
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export function GET() {
  return methodNotAllowed();
}
