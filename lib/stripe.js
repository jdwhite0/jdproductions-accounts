import Stripe from 'stripe';

let stripeClient;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const err = new Error('STRIPE_SECRET_KEY is not set');
    err.status = 503;
    err.code = 'stripe_not_configured';
    throw err;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || '';
}
