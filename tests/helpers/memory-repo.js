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

  function stamp(data) {
    return {
      id: `pos_${++positionSeq}`,
      clerk_user_id: data.clerkUserId ?? data.clerk_user_id ?? null,
      supporter_email: data.supporterEmail ?? data.supporter_email ?? null,
      instrument_id: data.instrumentId ?? data.instrument_id,
      amount_cents: data.amountCents ?? data.amount_cents,
      currency: data.currency ?? 'usd',
      status: data.status ?? 'pending',
      stripe_checkout_session_id: data.checkoutSessionId ?? data.stripe_checkout_session_id ?? null,
      stripe_payment_intent_id: data.paymentIntentId ?? data.stripe_payment_intent_id ?? null,
      stripe_customer_id: data.stripeCustomerId ?? data.stripe_customer_id ?? null,
      stripe_invoice_id: data.stripeInvoiceId ?? data.stripe_invoice_id ?? null,
      tier: data.tier ?? null,
      claimed_at: data.claimed_at ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

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

    async findPositionById(id) {
      return positions.find((p) => p.id === id) || null;
    },

    async findPositionByCheckoutSession(checkoutSessionId) {
      return positions.find((p) => p.stripe_checkout_session_id === checkoutSessionId) || null;
    },

    async findPositionByPaymentIntent(paymentIntentId) {
      return positions.find((p) => p.stripe_payment_intent_id === paymentIntentId) || null;
    },

    async createPendingPosition(data) {
      const row = stamp({ ...data, status: 'pending' });
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
        existing.clerk_user_id = data.clerkUserId || existing.clerk_user_id;
        existing.supporter_email = data.supporterEmail || existing.supporter_email;
        existing.amount_cents = data.amountCents;
        existing.currency = data.currency ?? existing.currency;
        existing.status = nextStatus;
        existing.stripe_checkout_session_id = data.checkoutSessionId || existing.stripe_checkout_session_id;
        existing.stripe_payment_intent_id = data.paymentIntentId || existing.stripe_payment_intent_id;
        existing.stripe_customer_id = data.stripeCustomerId || existing.stripe_customer_id;
        existing.tier = data.tier || existing.tier;
        existing.updated_at = new Date().toISOString();
        return { position: existing, created: false, previousStatus };
      }

      const created = stamp({ ...data, status: data.status });
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

    async setPositionInvoiceId(positionId, invoiceId) {
      const existing = positions.find((p) => p.id === positionId);
      if (!existing || existing.stripe_invoice_id) return existing || null;
      existing.stripe_invoice_id = invoiceId;
      existing.updated_at = new Date().toISOString();
      return existing;
    },

    async setPositionCustomerId(positionId, customerId) {
      const existing = positions.find((p) => p.id === positionId);
      if (!existing) return null;
      existing.stripe_customer_id = existing.stripe_customer_id || customerId;
      existing.updated_at = new Date().toISOString();
      return existing;
    },

    async claimGuestPositionsByEmails(clerkUserId, emails) {
      const set = new Set((emails || []).map((e) => String(e).toLowerCase()));
      const claimed = [];
      for (const row of positions) {
        if (row.clerk_user_id) continue;
        if (!row.supporter_email || !set.has(String(row.supporter_email).toLowerCase())) continue;
        row.clerk_user_id = clerkUserId;
        row.claimed_at = new Date().toISOString();
        row.updated_at = row.claimed_at;
        claimed.push(row);
      }
      return claimed;
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
        occurred_at: new Date().toISOString(),
        metadata: entry.metadata ?? {}
      };
      ledger.push(row);
      return row;
    },

    async listPositionsForUser(clerkUserId) {
      return positions.filter((p) => p.clerk_user_id === clerkUserId);
    },

    async listLedgerForUser(clerkUserId) {
      const ids = new Set(positions.filter((p) => p.clerk_user_id === clerkUserId).map((p) => p.id));
      return ledger.filter((row) => ids.has(row.position_id));
    }
  };
}

export function checkoutCompletedEvent({
  id = 'evt_cs_1',
  sessionId = 'cs_test_1',
  paymentIntentId = 'pi_test_1',
  clerkUserId = 'user_abc',
  email = 'guest@example.com',
  amountTotal = 25000,
  paymentStatus = 'paid',
  tier = 'standard',
  customerId = 'cus_test_1'
} = {}) {
  const metadata = {
    instrument_type: 'early_support',
    instrument_id: 'inst_early_support_v0',
    terms_version: 'early_support_v0',
    tier,
    email
  };
  if (clerkUserId) metadata.clerk_user_id = clerkUserId;
  return {
    id,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        payment_intent: paymentIntentId,
        customer: customerId,
        amount_total: amountTotal,
        currency: 'usd',
        payment_status: paymentStatus,
        customer_email: email,
        client_reference_id: clerkUserId || undefined,
        metadata
      }
    }
  };
}

export function paymentIntentSucceededEvent({
  id = 'evt_pi_1',
  paymentIntentId = 'pi_test_1',
  clerkUserId = 'user_abc',
  email = 'guest@example.com',
  amount = 25000,
  tier = 'standard'
} = {}) {
  const metadata = {
    instrument_type: 'early_support',
    clerk_user_id: clerkUserId,
    instrument_id: 'inst_early_support_v0',
    terms_version: 'early_support_v0',
    tier,
    email
  };
  if (!clerkUserId) delete metadata.clerk_user_id;
  return {
    id,
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: paymentIntentId,
        amount,
        amount_received: amount,
        currency: 'usd',
        metadata
      }
    }
  };
}
