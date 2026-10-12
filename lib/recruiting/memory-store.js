import { recruitingError } from './errors.js';
import { JD_ORG_ID, JD_ORG_NAME, JD_ORG_SLUG } from './constants.js';

const TABLES = [
  'departments',
  'teams',
  'requisitions',
  'hiringPlans',
  'versions',
  'questions',
  'candidates',
  'contacts',
  'applications',
  'responses',
  'attachments',
  'members',
  'transitions',
  'interviews',
  'feedback',
  'notes',
  'offers',
  'decisions',
  'communications',
  'consents',
  'audit',
  'retention',
  'attempts',
  'requisitionEvents'
];

function blank() {
  const state = { organization: null };
  for (const name of TABLES) state[name] = [];
  return state;
}

export function createMemoryRecruitingStore() {
  const box = { state: blank() };

  const api = {
    async ensureOrganization() {
      if (!box.state.organization) {
        box.state.organization = {
          id: JD_ORG_ID,
          slug: JD_ORG_SLUG,
          name: JD_ORG_NAME,
          createdAt: new Date().toISOString()
        };
      }
      return box.state.organization;
    },

    async catalogTransaction(fn) {
      return api.transaction(fn);
    },
    async hasCatalogRevision(orgId, requisitionId, revision) {
      return box.state.audit.some(row => row.organizationId === orgId && row.entityId === requisitionId && row.action === revision);
    },
    async transaction(fn) {
      const snap = structuredClone(box.state);
      try {
        return await fn(api);
      } catch (err) {
        box.state = snap;
        throw err;
      }
    },

    async insertDepartment(row) {
      const exists = box.state.departments.some(
        (item) => item.organizationId === row.organizationId && item.name.toLowerCase() === row.name.toLowerCase()
      );
      if (exists) throw recruitingError(409, 'department_exists', 'That department already exists.');
      box.state.departments.push(row);
      return row;
    },

    async listDepartments(orgId) {
      return box.state.departments.filter((item) => item.organizationId === orgId);
    },

    async findDepartmentByName(orgId, name) {
      return (
        box.state.departments.find(
          (item) => item.organizationId === orgId && item.name.toLowerCase() === String(name).toLowerCase()
        ) || null
      );
    },

    async insertTeam(row) {
      box.state.teams.push(row);
      return row;
    },

    async insertRequisition(row) {
      if (box.state.requisitions.some((item) => item.organizationId === row.organizationId && item.slug === row.slug)) {
        throw recruitingError(409, 'slug_exists', 'Slug already exists.');
      }
      box.state.requisitions.push(row);
      return row;
    },

    async updateRequisition(id, patch) {
      const row = box.state.requisitions.find((item) => item.id === id);
      if (!row) throw recruitingError(404, 'not_found', 'Requisition not found.');
      Object.assign(row, patch, { updatedAt: new Date().toISOString() });
      return row;
    },

    async getRequisition(id) {
      return box.state.requisitions.find((item) => item.id === id) || null;
    },

    async listRequisitions(orgId) {
      return box.state.requisitions.filter((item) => item.organizationId === orgId);
    },

    async insertHiringPlan(row) {
      box.state.hiringPlans.push(row);
      return row;
    },

    async insertPostingVersion(row) {
      box.state.versions.push(row);
      return row;
    },

    async countPostingVersions(requisitionId) {
      return box.state.versions.filter((item) => item.requisitionId === requisitionId).length;
    },

    async insertQuestion(row) {
      box.state.questions.push(row);
      return row;
    },

    async listQuestions(requisitionId) {
      return box.state.questions
        .filter((item) => item.requisitionId === requisitionId)
        .sort((a, b) => a.position - b.position);
    },

    async upsertCandidate(row) {
      const existing = box.state.candidates.find(
        (item) => item.organizationId === row.organizationId && item.email === row.email
      );
      if (existing) {
        existing.fullName = row.fullName || existing.fullName;
        if (row.phone) existing.phone = row.phone;
        if (row.location) existing.location = row.location;
        if (row.portfolioUrl) existing.portfolioUrl = row.portfolioUrl;
        existing.updatedAt = new Date().toISOString();
        return existing;
      }
      box.state.candidates.push(row);
      return row;
    },

    async getCandidate(id) {
      return box.state.candidates.find((item) => item.id === id) || null;
    },

    async updateCandidate(id, patch) {
      const row = box.state.candidates.find((item) => item.id === id);
      if (!row) throw recruitingError(404, 'not_found', 'Candidate not found.');
      Object.assign(row, patch, { updatedAt: new Date().toISOString() });
      return row;
    },

    async updateResponse(id, patch) {
      const row = box.state.responses.find((item) => item.id === id);
      if (!row) throw recruitingError(404, 'not_found', 'Response not found.');
      Object.assign(row, patch);
      return row;
    },

    async updateAttachment(id, patch) {
      const row = box.state.attachments.find((item) => item.id === id);
      if (!row) throw recruitingError(404, 'not_found', 'File not found.');
      Object.assign(row, patch);
      return row;
    },

    async updateRetention(id, patch) {
      const row = box.state.retention.find((item) => item.id === id);
      if (!row) throw recruitingError(404, 'not_found', 'Request not found.');
      Object.assign(row, patch);
      return row;
    },

    async listCandidates(orgId) {
      return box.state.candidates.filter((item) => item.organizationId === orgId);
    },

    async insertContact(row) {
      box.state.contacts.push(row);
      return row;
    },

    async insertApplication(row) {
      const active = box.state.applications.find(
        (item) =>
          item.requisitionId === row.requisitionId &&
          item.candidateId === row.candidateId &&
          !['rejected', 'withdrawn'].includes(item.stage)
      );
      if (active) throw recruitingError(409, 'duplicate_application', 'An application for this role is already open.');
      if (
        row.idempotencyKey &&
        box.state.applications.some(
          (item) => item.organizationId === row.organizationId && item.idempotencyKey === row.idempotencyKey
        )
      ) {
        throw recruitingError(409, 'idempotency_conflict', 'Idempotency key already used.');
      }
      box.state.applications.push(row);
      return row;
    },

    async updateApplication(id, patch) {
      const row = box.state.applications.find((item) => item.id === id);
      if (!row) throw recruitingError(404, 'not_found', 'Application not found.');
      Object.assign(row, patch, { updatedAt: new Date().toISOString() });
      return row;
    },

    async getApplication(id) {
      return box.state.applications.find((item) => item.id === id) || null;
    },

    async findApplicationByIdempotency(orgId, key) {
      if (!key) return null;
      return box.state.applications.find((item) => item.organizationId === orgId && item.idempotencyKey === key) || null;
    },

    async findActiveApplication(requisitionId, candidateId) {
      return (
        box.state.applications.find(
          (item) =>
            item.requisitionId === requisitionId &&
            item.candidateId === candidateId &&
            !['rejected', 'withdrawn'].includes(item.stage)
        ) || null
      );
    },

    async findApplicationByReference(reference) {
      return box.state.applications.find((item) => item.referenceCode === reference) || null;
    },

    async listApplications(orgId) {
      return box.state.applications.filter((item) => item.organizationId === orgId);
    },

    async insertResponse(row) {
      box.state.responses.push(row);
      return row;
    },

    async listResponses(applicationId) {
      return box.state.responses.filter((item) => item.applicationId === applicationId);
    },

    async insertAttachment(row) {
      box.state.attachments.push(row);
      return row;
    },

    async getAttachment(id) {
      return box.state.attachments.find((item) => item.id === id) || null;
    },

    async listAttachmentMeta(applicationId) {
      return box.state.attachments
        .filter((item) => item.applicationId === applicationId)
        .map(({ body, ...meta }) => meta);
    },

    async insertMember(row) {
      const exists = box.state.members.some(
        (item) =>
          item.requisitionId === row.requisitionId &&
          item.clerkUserId === row.clerkUserId &&
          item.memberRole === row.memberRole
      );
      if (!exists) box.state.members.push(row);
      return row;
    },

    async listMembers(requisitionId) {
      return box.state.members.filter((item) => item.requisitionId === requisitionId);
    },

    async listMembershipsForUser(clerkUserId) {
      return box.state.members.filter((item) => item.clerkUserId === clerkUserId);
    },

    async insertTransition(row) {
      box.state.transitions.push(row);
      return row;
    },

    async listTransitions(applicationId) {
      return box.state.transitions.filter((item) => item.applicationId === applicationId);
    },

    async insertInterview(row) {
      box.state.interviews.push(row);
      return row;
    },

    async updateInterview(id, patch) {
      const row = box.state.interviews.find((item) => item.id === id);
      if (!row) throw recruitingError(404, 'not_found', 'Interview not found.');
      Object.assign(row, patch);
      return row;
    },

    async getInterview(id) {
      return box.state.interviews.find((item) => item.id === id) || null;
    },

    async listInterviews(orgId) {
      const appIds = new Set(box.state.applications.filter((item) => item.organizationId === orgId).map((item) => item.id));
      return box.state.interviews.filter((item) => appIds.has(item.applicationId));
    },

    async insertFeedback(row) {
      box.state.feedback.push(row);
      return row;
    },

    async listFeedbackByInterview(interviewId) {
      return box.state.feedback.filter((item) => item.interviewId === interviewId);
    },

    async listFeedbackByApplication(applicationId) {
      return box.state.feedback.filter((item) => item.applicationId === applicationId);
    },

    async insertNote(row) {
      box.state.notes.push(row);
      return row;
    },

    async listNotes(applicationId) {
      return box.state.notes.filter((item) => item.applicationId === applicationId);
    },

    async insertOffer(row) {
      box.state.offers.push(row);
      return row;
    },

    async listOffers(applicationId) {
      return box.state.offers.filter((item) => item.applicationId === applicationId);
    },

    async insertDecision(row) {
      box.state.decisions.push(row);
      return row;
    },

    async listDecisions(applicationId) {
      return box.state.decisions.filter((item) => item.applicationId === applicationId);
    },

    async insertCommunication(row) {
      box.state.communications.push(row);
      return row;
    },

    async listCommunications(orgId) {
      return box.state.communications.filter((item) => item.organizationId === orgId);
    },

    async insertConsent(row) {
      box.state.consents.push(row);
      return row;
    },

    async insertAudit(row) {
      box.state.audit.push(row);
      return row;
    },

    async listAudit(orgId, limit = 50) {
      return box.state.audit
        .filter((item) => item.organizationId === orgId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, limit);
    },

    async insertRetention(row) {
      box.state.retention.push(row);
      return row;
    },

    async listRetention(orgId) {
      return box.state.retention.filter((item) => item.organizationId === orgId);
    },

    async insertAttempt(row) {
      box.state.attempts.push(row);
      return row;
    },

    async countRecentAttempts(orgId, ipHash, since) {
      return box.state.attempts.filter(
        (item) => item.organizationId === orgId && item.ipHash === ipHash && item.createdAt >= since
      ).length;
    },

    async countRecentEmailAttempts(orgId, email, since) {
      return box.state.attempts.filter(
        (item) => item.organizationId === orgId && item.email === email && item.createdAt >= since
      ).length;
    },

    async insertRequisitionEvent(row) {
      box.state.requisitionEvents.push(row);
      return row;
    },

    async listRequisitionEvents(requisitionId) {
      return box.state.requisitionEvents.filter((item) => item.requisitionId === requisitionId);
    }
  };

  return api;
}
