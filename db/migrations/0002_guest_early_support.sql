-- Guest Early Support: pay first, account optional.
-- clerk_user_id is nullable until a supporter claims with a Clerk login.
-- supporter_email is the durable guest identity. Not ACCESS Supabase.

ALTER TABLE positions
  ALTER COLUMN clerk_user_id DROP NOT NULL;

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS supporter_email text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS tier text,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

ALTER TABLE positions
  DROP CONSTRAINT IF EXISTS positions_identity_chk;

ALTER TABLE positions
  ADD CONSTRAINT positions_identity_chk
  CHECK (clerk_user_id IS NOT NULL OR supporter_email IS NOT NULL);

ALTER TABLE positions
  DROP CONSTRAINT IF EXISTS positions_tier_chk;

ALTER TABLE positions
  ADD CONSTRAINT positions_tier_chk
  CHECK (tier IS NULL OR tier IN ('starter', 'standard', 'anchor', 'custom'));

CREATE INDEX IF NOT EXISTS positions_supporter_email_idx
  ON positions (lower(supporter_email));

CREATE UNIQUE INDEX IF NOT EXISTS positions_stripe_invoice_id_uidx
  ON positions (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;
