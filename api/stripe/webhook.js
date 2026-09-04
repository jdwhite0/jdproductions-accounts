import { createDbRepository } from '../../db/repository.js';
import { json, methodNotAllowed, errorResponse } from '../../lib/http.js';
import { getWebhookSecret } from '../../lib/stripe.js';
import { processStripeEvent } from '../../lib/early-support/process-event.js';
import { handleStripeWebhookRequest } from '../../lib/early-support/webhook.js';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');
    const result = await handleStripeWebhookRequest({
      rawBody,
      signature,
      webhookSecret: getWebhookSecret(),
      processEvent: (event) => processStripeEvent(event, createDbRepository())
    });
    return json(result.status, result.body);
  } catch (err) {
    return errorResponse(err);
  }
}

export function GET() {
  return methodNotAllowed();
}
