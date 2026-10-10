-- JD Productions recruiting system of record.
-- Tenant-aware. Does not alter Early Support tables (instruments, positions, ledger_entries, stripe_events).

CREATE TABLE recruiting_organizations (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruiting_departments (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE recruiting_teams (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  department_id uuid REFERENCES recruiting_departments(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruiting_requisitions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  department_id uuid REFERENCES recruiting_departments(id),
  team_id uuid REFERENCES recruiting_teams(id),
  slug text NOT NULL,
  title text NOT NULL,
  headcount integer NOT NULL DEFAULT 1 CHECK (headcount > 0 AND headcount <= 100),
  employment_type text NOT NULL,
  workplace text NOT NULL,
  location text,
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  responsibilities text NOT NULL DEFAULT '',
  qualifications text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  compensation_min_cents integer,
  compensation_max_cents integer,
  compensation_currency text NOT NULL DEFAULT 'usd',
  compensation_public boolean NOT NULL DEFAULT false,
  resume_required boolean NOT NULL DEFAULT false,
  opportunity_type text NOT NULL DEFAULT 'active',
  timing_status text NOT NULL DEFAULT 'flexible',
  timing_note text,
  learning_outcomes text NOT NULL DEFAULT '',
  supervisor_label text,
  duration_text text,
  schedule_text text,
  unresolved_terms jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  opens_on date,
  closes_on date,
  pipeline jsonb NOT NULL,
  submitted_by text,
  approved_by text,
  published_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug),
  CHECK (status IN ('draft', 'published', 'paused', 'closed', 'archived')),
  CHECK (opportunity_type IN ('active', 'internship', 'upcoming', 'talent_community')),
  CHECK (timing_status IN ('immediate', 'flexible', 'to_be_determined')),
  CHECK (workplace IN ('remote', 'hybrid', 'on_site', 'to_be_confirmed')),
  CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'to_be_confirmed')),
  CHECK (compensation_min_cents IS NULL OR compensation_min_cents >= 0),
  CHECK (compensation_max_cents IS NULL OR compensation_max_cents >= 0)
);

CREATE INDEX recruiting_requisitions_status_idx
  ON recruiting_requisitions (organization_id, status);

CREATE TABLE recruiting_hiring_plans (
  id uuid PRIMARY KEY,
  requisition_id uuid NOT NULL REFERENCES recruiting_requisitions(id),
  target_headcount integer NOT NULL CHECK (target_headcount > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruiting_posting_versions (
  id uuid PRIMARY KEY,
  requisition_id uuid NOT NULL REFERENCES recruiting_requisitions(id),
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requisition_id, version)
);

CREATE TABLE recruiting_questions (
  id uuid PRIMARY KEY,
  requisition_id uuid NOT NULL REFERENCES recruiting_requisitions(id),
  prompt text NOT NULL,
  field_type text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  options jsonb,
  position integer NOT NULL DEFAULT 0,
  CHECK (field_type IN ('string', 'longtext', 'email', 'url', 'single_select', 'multi_select', 'boolean'))
);

CREATE TABLE recruiting_candidates (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  location text,
  portfolio_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

CREATE TABLE recruiting_candidate_contacts (
  id uuid PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES recruiting_candidates(id),
  kind text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruiting_applications (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  requisition_id uuid NOT NULL REFERENCES recruiting_requisitions(id),
  candidate_id uuid NOT NULL REFERENCES recruiting_candidates(id),
  stage text NOT NULL DEFAULT 'application_received',
  source text,
  reference_code text NOT NULL UNIQUE,
  idempotency_key text,
  consent_at timestamptz NOT NULL,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE UNIQUE INDEX recruiting_one_active_application
  ON recruiting_applications (requisition_id, candidate_id)
  WHERE stage NOT IN ('rejected', 'withdrawn');

CREATE INDEX recruiting_applications_stage_idx
  ON recruiting_applications (organization_id, stage);

CREATE TABLE recruiting_responses (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  question_id uuid REFERENCES recruiting_questions(id),
  prompt text NOT NULL,
  value text NOT NULL
);

CREATE TABLE recruiting_attachments (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  filename text NOT NULL,
  content_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 2097152),
  sha256 text NOT NULL,
  body bytea NOT NULL,
  scan_status text NOT NULL DEFAULT 'unscanned',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scan_status IN ('unscanned', 'cleared', 'rejected'))
);

CREATE TABLE recruiting_members (
  requisition_id uuid NOT NULL REFERENCES recruiting_requisitions(id),
  clerk_user_id text NOT NULL,
  member_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requisition_id, clerk_user_id, member_role),
  CHECK (member_role IN ('recruiter', 'hiring_manager', 'interviewer'))
);

CREATE TABLE recruiting_transitions (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  from_stage text,
  to_stage text NOT NULL,
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruiting_interviews (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  interviewer_clerk_user_id text NOT NULL,
  starts_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('proposed', 'scheduled', 'completed', 'cancelled'))
);

CREATE INDEX recruiting_interviews_application_idx
  ON recruiting_interviews (application_id);

CREATE TABLE recruiting_feedback (
  id uuid PRIMARY KEY,
  interview_id uuid NOT NULL REFERENCES recruiting_interviews(id),
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  author_clerk_user_id text NOT NULL,
  body text NOT NULL,
  recommendation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (recommendation IS NULL OR recommendation IN ('advance', 'hold', 'decline'))
);

CREATE TABLE recruiting_notes (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  author_clerk_user_id text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruiting_offers (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  compensation_min_cents integer,
  compensation_max_cents integer,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'draft',
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft', 'approved', 'rescinded'))
);

CREATE TABLE recruiting_decisions (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  decision text NOT NULL,
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (decision IN ('advance', 'hire', 'reject', 'hold'))
);

CREATE TABLE recruiting_communications (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  application_id uuid NOT NULL REFERENCES recruiting_applications(id),
  template_key text NOT NULL,
  body text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'recorded',
  actor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (delivery_status IN ('recorded', 'queued', 'sent', 'failed'))
);

CREATE TABLE recruiting_consents (
  id uuid PRIMARY KEY,
  application_id uuid REFERENCES recruiting_applications(id),
  candidate_id uuid REFERENCES recruiting_candidates(id),
  purpose text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruiting_audit (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  actor_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recruiting_audit_org_idx
  ON recruiting_audit (organization_id, created_at DESC);

CREATE TABLE recruiting_retention (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES recruiting_organizations(id),
  candidate_id uuid REFERENCES recruiting_candidates(id),
  application_id uuid REFERENCES recruiting_applications(id),
  request_type text NOT NULL,
  status text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (request_type IN ('access', 'deletion')),
  CHECK (status IN ('received', 'completed', 'denied'))
);

CREATE TABLE recruiting_attempts (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  ip_hash text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recruiting_attempts_ip_idx
  ON recruiting_attempts (organization_id, ip_hash, created_at);

CREATE TABLE recruiting_requisition_events (
  id uuid PRIMARY KEY,
  requisition_id uuid NOT NULL REFERENCES recruiting_requisitions(id),
  from_status text,
  to_status text NOT NULL,
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO recruiting_organizations (id, slug, name)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'jd-productions',
  'JD Productions, Inc.'
)
ON CONFLICT (slug) DO NOTHING;
