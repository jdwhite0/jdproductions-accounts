import { sql } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, integer } from 'drizzle-orm/pg-core';

/**
 * Early Support schema (this project only).
 * instrument_type is early_support — not equity / shares / securities.
 */

export const instruments = pgTable(
  'instruments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    instrumentType: text('instrument_type').notNull(),
    name: text('name').notNull(),
    termsVersion: text('terms_version').notNull(),
    counselStatus: text('counsel_status').notNull().default('unpapered'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex('instruments_type_terms_uidx').on(table.instrumentType, table.termsVersion)]
);

export const positions = pgTable(
  'positions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    clerkUserId: text('clerk_user_id').notNull(),
    instrumentId: uuid('instrument_id')
      .notNull()
      .references(() => instruments.id),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    status: text('status').notNull(),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('positions_clerk_user_id_idx').on(table.clerkUserId)]
);

export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    positionId: uuid('position_id')
      .notNull()
      .references(() => positions.id),
    entryType: text('entry_type').notNull(),
    amountCents: integer('amount_cents').notNull(),
    stripeEventId: text('stripe_event_id'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`)
  },
  (table) => [uniqueIndex('ledger_entries_stripe_event_id_uidx').on(table.stripeEventId)]
);

export const stripeEvents = pgTable('stripe_events', {
  stripeEventId: text('stripe_event_id').primaryKey(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  payload: jsonb('payload').notNull()
});
