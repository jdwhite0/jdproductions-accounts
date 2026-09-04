export function createMemoryRepo({ instrument } = {}) {
  const defaultInstrument = instrument || {
    id: 'inst_early_support_v0',
    instrument_type: 'early_support',
    name: 'Early Support',
    terms_version: 'early_support_v0',
    counsel_status: 'unpapered'
  };

  const stripeEvents = new Map();
  const positions = [];
  const ledger = [];
  let positionSeq = 0;
  let ledgerSeq = 0;

  return {
    stripeEvents,
    positions,
    ledger,

    async tryInsertStripeEvent({ stripeEventId, type, payload }) {
      if (stripeEvents.has(stripeEventId)) return false;
      stripeEvents.set(stripeEventId, { stripeEventId, type, payload });
      return true;
    },

    async getInstrumentByTermsVersion(termsVersion) {
      return defaultInstrument.terms_version === termsVersion ? defaultInstrument : null;
    },

    async getInstrumentById(id) {
      return defaultInstrument.id === id ? defaultInstrument : null;
    },

    async findPositionByCheckoutSession(checkoutSessionId) {
      return positions.find((p) => p.stripe_checkout_session_id === checkoutSessionId) || null;
    },

    async findPositionByPaymentIntent(paymentIntentId) {
      return positions.find((p) => p.stripe_payment_intent_id === paymentIntentId) || null;
    },

    async createPendingPosition(data) {
      const row = {
        id: `pos_${++positionSeq}`,
        clerk_user_id: data.clerkUserId,
        instrument_id: data.instrumentId,
        amount_cents: data.amountCents,
        currency: data.currency ?? 'usd',
        status: 'pending',
        stripe_checkout_session_id: data.checkoutSessionId ?? null,
        stripe_payment_intent_id: data.paymentIntentId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      positions.push(row);
      return row;
    },

    async upsertPositionFromPayment(data) {
      let existing =
        (data.checkoutSessionId &&
          positions.find((p) => p.stripe_checkout_session_id === data.checkoutSessionId)) ||
        (data.paymentIntentId && positions.find((p) => p.stripe_payment_intent_id === data.paymentIntentId)) ||
        null;

      if (existing) {
        const previousStatus = existing.status;
        const nextStatus =
          existing.status === 'refunded' || existing.status === 'void' ? existing.status : data.status;
        existing.amount_cents = data.amountCents;
        existing.currency = data.currency ?? existing.currency;
        existing.status = nextStatus;
        existing.stripe_checkout_session_id =
          data.checkoutSessionId || existing.stripe_checkout_session_id;
        existing.stripe_payment_intent_id = data.paymentIntentId || existing.stripe_payment_intent_id;
        existing.updated_at = new Date().toISOString();
        return { position: existing, created: false, previousStatus };
      }

      const created = {
        id: `pos_${++positionSeq}`,
        clerk_user_id: data.clerkUserId,
        instrument_id: data.instrumentId,
        amount_cents: data.amountCents,
        currency: data.currency ?? 'usd',
        status: data.status,
        stripe_checkout_session_id: data.checkoutSessionId ?? null,
        stripe_payment_intent_id: data.paymentIntentId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      positions.push(created);
      return { position: created, created: true, previousStatus: null };
    },

    async markPositionStatus(positionId, status) {
      const existing = positions.find((p) => p.id === positionId);
      if (!existing) return null;
      existing.status = status;
      existing.updated_at = new Date().toISOString();
      return existing;
    },

    async appendLedger(entry) {
      if (entry.stripeEventId && ledger.some((row) => row.stripe_event_id === entry.stripeEventId)) {
        return null;
      }
      const row = {
        id: `led_${++ledgerSeq}`,
        position_id: entry.positionId,
        entry_type: entry.entryType,
        amount_cents: entry.amountCents,
        stripe_event_id: entry.stripeEventId ?? null,
        metadata: entry.metadata ?? {}
      };
      ledger.push(row);
      return row;
    },

    async listPositionsForUser(clerkUserId) {
      return positions.filter((p) => p.clerk_user_id === clerkUserId);
    }
  };
}

export function checkoutCompletedEvent({
  id = 'evt_cs_1',
  sessionId = 'cs_test_1',
  paymentIntentId = 'pi_test_1',
  clerkUserId = 'user_abc',
  amountTotal = 10000,
  paymentStatus = 'paid'
} = {}) {
  return {
    id,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        payment_intent: paymentIntentId,
        amount_total: amountTotal,
        currency: 'usd',
        payment_status: paymentStatus,
        client_reference_id: clerkUserId,
        metadata: {
          instrument_type: 'early_support',
          clerk_user_id: clerkUserId,
          instrument_id: 'inst_early_support_v0',
          terms_version: 'early_support_v0'
        }
      }
    }
  };
}

export function paymentIntentSucceededEvent({
  id = 'evt_pi_1',
  paymentIntentId = 'pi_test_1',
  clerkUserId = 'user_abc',
  amount = 10000
} = {}) {
  return {
    id,
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: paymentIntentId,
        amount,
        amount_received: amount,
        currency: 'usd',
        metadata: {
          instrument_type: 'early_support',
          clerk_user_id: clerkUserId,
          instrument_id: 'inst_early_support_v0',
          terms_version: 'early_support_v0'
        }
      }
    }
  };
}
