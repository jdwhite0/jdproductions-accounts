import { recruitingError } from './errors.js';

export const RECRUITING_ROLES = [
  'platform_admin',
  'recruitment_admin',
  'recruiter',
  'hiring_manager',
  'interviewer'
];

const STAFF = new Set(RECRUITING_ROLES);

/**
 * Map Clerk publicMetadata onto a recruiting role.
 * Founder and admin keep their existing Accounts meaning and are platform admins here.
 * Other staff are named with publicMetadata.recruitingRole so a member is not a founder.
 * This does not write to Clerk.
 */
export function resolveRecruitingRole(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  const role = metadata.role;
  if (role === 'admin' || role === 'founder' || role === 'platform_admin') return 'platform_admin';
  const requested = metadata.recruitingRole || null;
  if (typeof requested === 'string' && STAFF.has(requested)) return requested;
  return null;
}

export function actorFromMetadata(clerkUserId, metadata) {
  const role = resolveRecruitingRole(metadata);
  if (!role) throw recruitingError(403, 'forbidden', 'Recruiting access is limited to authorized JD personnel.');
  return { clerkUserId, role };
}

export function assertRole(actor, allowed) {
  if (!actor || !allowed.includes(actor.role)) {
    throw recruitingError(403, 'forbidden', 'Not allowed.');
  }
}

export const BROAD_ACCESS = ['platform_admin', 'recruitment_admin'];
export const PIPELINE_EDITORS = ['platform_admin', 'recruitment_admin', 'recruiter', 'hiring_manager'];
export const PUBLISHERS = ['platform_admin', 'recruitment_admin'];
