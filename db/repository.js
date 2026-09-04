import { getSql } from './client.js';

const UNIQUE_VIOLATION = '23505';

export function createDbRepository(sql = getSql()) {
  return {
    async tryInsertStripeEvent({ stripeEventId, type, payload }) {
      try {
        await sql`
          INSERT INTO stripe_events (stripe_event_id, type, payload)
          VALUES (${stripeEventId}, ${type}, ${sql.json(payload)})
        `;
        return true;
      } catch (err) {
        if (err.code === UNIQUE_VIOLATION) return false;
        throw err;
      }
    },

    async getInstrumentByTermsVersion(termsVersion) {
      const rows = await sql`
        SELECT *
        FROM instruments
        WHERE instrument_type = 'early_support'
          AND terms_version = ${termsVersion}
        LIMIT 1
      `;
      return rows[0] ?? null;
    },

    async getInstrumentById(id) {
      if (!id) return null;
      const rows = await sql`
        SELECT * FROM instruments WHERE id = ${id} LIMIT 1
      `;
      return rows[0] ?? null;
    },

    async findPositionById(id) {
      if (!id) return null;
      const rows = await sql`
        SELECT * FROM positions WHERE id = ${id} LIMIT 1
      `;
      return rows[0] ?? null;
    },

    async findPositionByCheckoutSession(checkoutSessionId) {
      if (!checkoutSessionId) return null;
      const rows = await sql`
        SELECT * FROM positions
        WHERE stripe_checkout_session_id = ${checkoutSessionId}
        LIMIT 1
      `;
      return rows[0] ?? null;
    },

    async findPositionByPaymentIntent(paymentIntentId) {
      if (!paymentIntentId) return null;
      const rows = await sql`
        SELECT * FROM positions
        WHERE stripe_payment_intent_id = ${paymentIntentId}
        LIMIT 1
      `;
      return rows[0] ?? null;
    },

    async createPendingPosition(data) {
      const [row] = await sql`
        INSERT INTO positions (
          clerk_user_id,
          supporter_email,
          instrument_id,
          amount_cents,
          currency,
          status,
          stripe_checkout_session_id,
          stripe_payment_intent_id,
          stripe_customer_id,
          tier
        ) VALUES (
          ${data.clerkUserId ?? null},
          ${data.supporterEmail ?? null},
          ${data.instrumentId},
          ${data.amountCents},
          ${data.currency ?? 'usd'},
          'pending',
          ${data.checkoutSessionId ?? null},
          ${data.paymentIntentId ?? null},
          ${data.stripeCustomerId ?? null},
          ${data.tier ?? null}
        )
        RETURNING *
      `;
      return row;
    },

    async upsertPositionFromPayment(data) {
      return sql.begin(async (tx) => {
        let existing = null;
        if (data.checkoutSessionId) {
          const bySession = await tx`
            SELECT * FROM positions
            WHERE stripe_checkout_session_id = ${data.checkoutSessionId}
            LIMIT 1
          `;
          existing = bySession[0] ?? null;
        }
        if (!existing && data.paymentIntentId) {
          const byIntent = await tx`
            SELECT * FROM positions
            WHERE stripe_payment_intent_id = ${data.paymentIntentId}
            LIMIT 1
          `;
          existing = byIntent[0] ?? null;
        }

        if (existing) {
          const nextStatus =
            existing.status === 'refunded' || existing.status === 'void' ? existing.status : data.status;
          const [updated] = await tx`
            UPDATE positions SET
              clerk_user_id = COALESCE(${data.clerkUserId ?? null}, clerk_user_id),
              supporter_email = COALESCE(${data.supporterEmail ?? null}, supporter_email),
              amount_cents = ${data.amountCents},
              currency = ${data.currency ?? existing.currency},
              status = ${nextStatus},
              stripe_checkout_session_id = COALESCE(${data.checkoutSessionId ?? null}, stripe_checkout_session_id),
              stripe_payment_intent_id = COALESCE(${data.paymentIntentId ?? null}, stripe_payment_intent_id),
              stripe_customer_id = COALESCE(${data.stripeCustomerId ?? null}, stripe_customer_id),
              tier = COALESCE(${data.tier ?? null}, tier),
              updated_at = now()
            WHERE id = ${existing.id}
            RETURNING *
          `;
          return { position: updated, created: false, previousStatus: existing.status };
        }

        const [created] = await tx`
          INSERT INTO positions (
            clerk_user_id,
            supporter_email,
            instrument_id,
            amount_cents,
            currency,
            status,
            stripe_checkout_session_id,
            stripe_payment_intent_id,
            stripe_customer_id,
            tier
          ) VALUES (
            ${data.clerkUserId ?? null},
            ${data.supporterEmail ?? null},
            ${data.instrumentId},
            ${data.amountCents},
            ${data.currency ?? 'usd'},
            ${data.status},
            ${data.checkoutSessionId ?? null},
            ${data.paymentIntentId ?? null},
            ${data.stripeCustomerId ?? null},
            ${data.tier ?? null}
          )
          RETURNING *
        `;
        return { position: created, created: true, previousStatus: null };
      });
    },

    async markPositionStatus(positionId, status) {
      const [row] = await sql`
        UPDATE positions SET
          status = ${status},
          updated_at = now()
        WHERE id = ${positionId}
        RETURNING *
      `;
      return row ?? null;
    },

    async setPositionInvoiceId(positionId, invoiceId) {
      const [row] = await sql`
        UPDATE positions SET
          stripe_invoice_id = ${invoiceId},
          updated_at = now()
        WHERE id = ${positionId}
          AND stripe_invoice_id IS NULL
        RETURNING *
      `;
      return row ?? null;
    },

    async setPositionCustomerId(positionId, customerId) {
      const [row] = await sql`
        UPDATE positions SET
          stripe_customer_id = COALESCE(stripe_customer_id, ${customerId}),
          updated_at = now()
        WHERE id = ${positionId}
        RETURNING *
      `;
      return row ?? null;
    },

    async claimGuestPositionsByEmails(clerkUserId, emails) {
      const list = (emails || []).map((e) => String(e).toLowerCase()).filter(Boolean);
      if (!list.length) return [];
      return sql`
        UPDATE positions SET
          clerk_user_id = ${clerkUserId},
          claimed_at = now(),
          updated_at = now()
        WHERE clerk_user_id IS NULL
          AND lower(supporter_email) IN ${sql(list)}
        RETURNING *
      `;
    },

    async appendLedger(entry) {
      try {
        const [row] = await sql`
          INSERT INTO ledger_entries (
            position_id,
            entry_type,
            amount_cents,
            stripe_event_id,
            metadata
          ) VALUES (
            ${entry.positionId},
            ${entry.entryType},
            ${entry.amountCents},
            ${entry.stripeEventId ?? null},
            ${sql.json(entry.metadata ?? {})}
          )
          RETURNING *
        `;
        return row;
      } catch (err) {
        if (err.code === UNIQUE_VIOLATION) return null;
        throw err;
      }
    },

    async listPositionsForUser(clerkUserId) {
      return sql`
        SELECT
          p.id,
          p.clerk_user_id,
          p.supporter_email,
          p.instrument_id,
          p.amount_cents,
          p.currency,
          p.status,
          p.stripe_checkout_session_id,
          p.stripe_payment_intent_id,
          p.stripe_customer_id,
          p.stripe_invoice_id,
          p.tier,
          p.claimed_at,
          p.created_at,
          p.updated_at,
          i.instrument_type,
          i.terms_version,
          i.counsel_status,
          i.name AS instrument_name
        FROM positions p
        JOIN instruments i ON i.id = p.instrument_id
        WHERE p.clerk_user_id = ${clerkUserId}
        ORDER BY p.created_at DESC
      `;
    },

    async listLedgerForUser(clerkUserId, limit = 50) {
      return sql`
        SELECT
          l.id,
          l.position_id,
          l.entry_type,
          l.amount_cents,
          l.stripe_event_id,
          l.occurred_at,
          l.metadata
        FROM ledger_entries l
        JOIN positions p ON p.id = l.position_id
        WHERE p.clerk_user_id = ${clerkUserId}
        ORDER BY l.occurred_at DESC
        LIMIT ${limit}
      `;
    }
  };
}
