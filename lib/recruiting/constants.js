export const JD_ORG_ID = '00000000-0000-4000-8000-000000000001';
export const JD_ORG_SLUG = 'jd-productions';
export const JD_ORG_NAME = 'JD Productions, Inc.';

export const REQUISITION_STATUSES = ['draft', 'published', 'paused', 'closed', 'archived'];

export const OPPORTUNITY_TYPES = ['active', 'internship', 'upcoming', 'talent_community'];

export const STATUS_TRANSITIONS = {
  draft: ['published', 'archived'],
  published: ['paused', 'closed', 'draft', 'archived'],
  paused: ['published', 'closed', 'archived'],
  closed: ['published', 'archived', 'draft'],
  archived: ['draft', 'published']
};

export const DEFAULT_PIPELINE = [
  'application_received',
  'initial_review',
  'screening',
  'interview',
  'final_evaluation',
  'offer',
  'hired',
  'future_consideration'
];

export const TERMINAL_STAGES = ['rejected', 'withdrawn'];

export const CANDIDATE_STATUS = {
  application_received: 'Received',
  initial_review: 'In review',
  screening: 'In review',
  interview: 'Interview',
  final_evaluation: 'In review',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Closed',
  withdrawn: 'Withdrawn',
  archived: 'Closed',
  future_consideration: 'On file'
};

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'to_be_confirmed'];
export const WORKPLACES = ['remote', 'hybrid', 'on_site', 'to_be_confirmed'];
export const FIELD_TYPES = ['string', 'longtext', 'email', 'url', 'single_select', 'multi_select', 'boolean'];

export const MAX_RESUME_BYTES = 2 * 1024 * 1024;
export const MAX_NAME = 160;
export const MAX_SHORT = 400;
export const MAX_LONG = 20000;

export const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const CONFIRMATION_TEMPLATE = 'application_received';
