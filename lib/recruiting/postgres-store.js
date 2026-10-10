import { getSql } from '../../db/client.js';
import { recruitingError } from './errors.js';
import { JD_ORG_ID, JD_ORG_NAME, JD_ORG_SLUG } from './constants.js';

export function createPostgresRecruitingStore(sql) {
  const q = sql || getSql();

  return {
    async ensureOrganization() {
      await q`
        INSERT INTO recruiting_organizations (id, slug, name)
        VALUES (${JD_ORG_ID}, ${JD_ORG_SLUG}, ${JD_ORG_NAME})
        ON CONFLICT (slug) DO NOTHING
      `;
      const [row] = await q`SELECT * FROM recruiting_organizations WHERE slug = ${JD_ORG_SLUG}`;
      return mapOrg(row);
    },
    async transaction(fn) {
      return q.begin(async (tx) => fn(createPostgresRecruitingStore(tx)));
    },
    async insertDepartment(row) {
      await q`
        INSERT INTO recruiting_departments (id, organization_id, name, created_at)
        VALUES (${row.id}, ${row.organizationId}, ${row.name}, ${row.createdAt})
      `;
      return row;
    },
    async listDepartments(orgId) {
      const rows = await q`SELECT * FROM recruiting_departments WHERE organization_id = ${orgId} ORDER BY name`;
      return rows.map(mapDepartment);
    },
    async findDepartmentByName(orgId, name) {
      const [row] = await q`
        SELECT * FROM recruiting_departments
        WHERE organization_id = ${orgId} AND lower(name) = lower(${name})
      `;
      return row ? mapDepartment(row) : null;
    },
    async insertTeam(row) {
      await q`
        INSERT INTO recruiting_teams (id, organization_id, department_id, name, created_at)
        VALUES (${row.id}, ${row.organizationId}, ${row.departmentId}, ${row.name}, ${row.createdAt})
      `;
      return row;
    },
    async insertRequisition(row) {
      await q`
        INSERT INTO recruiting_requisitions (
          id, organization_id, department_id, team_id, slug, title, headcount, employment_type,
          workplace, location, summary, description, responsibilities, qualifications, instructions,
          compensation_min_cents, compensation_max_cents, compensation_currency, compensation_public,
          resume_required, opportunity_type, timing_status, timing_note, learning_outcomes,
          supervisor_label, duration_text, schedule_text, unresolved_terms, status, opens_on, closes_on,
          pipeline, submitted_by, approved_by, published_by, created_at, updated_at
        ) VALUES (
          ${row.id}, ${row.organizationId}, ${row.departmentId}, ${row.teamId}, ${row.slug}, ${row.title},
          ${row.headcount}, ${row.employmentType}, ${row.workplace}, ${row.location}, ${row.summary},
          ${row.description}, ${row.responsibilities}, ${row.qualifications}, ${row.instructions},
          ${row.compensationMinCents}, ${row.compensationMaxCents}, ${row.compensationCurrency},
          ${row.compensationPublic}, ${row.resumeRequired}, ${row.opportunityType}, ${row.timingStatus},
          ${row.timingNote}, ${row.learningOutcomes}, ${row.supervisorLabel}, ${row.durationText},
          ${row.scheduleText}, ${q.json(row.unresolvedTerms || [])}, ${row.status}, ${row.opensOn},
          ${row.closesOn}, ${q.json(row.pipeline)}, ${row.submittedBy}, ${row.approvedBy}, ${row.publishedBy},
          ${row.createdAt}, ${row.updatedAt}
        )
      `;
      return row;
    },
    async updateRequisition(id, patch) {
      const data = mapPatch(patch);
      data.updated_at = new Date().toISOString();
      if (data.unresolved_terms) data.unresolved_terms = q.json(data.unresolved_terms);
      if (data.pipeline) data.pipeline = q.json(data.pipeline);
      const columns = Object.keys(data);
      await q`UPDATE recruiting_requisitions SET ${q(data, ...columns)} WHERE id = ${id}`;
      return this.getRequisition(id);
    },
    async getRequisition(id) {
      const [row] = await q`SELECT * FROM recruiting_requisitions WHERE id = ${id}`;
      return row ? mapRequisition(row) : null;
    },
    async listRequisitions(orgId) {
      const rows = await q`SELECT * FROM recruiting_requisitions WHERE organization_id = ${orgId}`;
      return rows.map(mapRequisition);
    },
    async insertHiringPlan(row) {
      await q`
        INSERT INTO recruiting_hiring_plans (id, requisition_id, target_headcount, notes, created_at)
        VALUES (${row.id}, ${row.requisitionId}, ${row.targetHeadcount}, ${row.notes}, ${row.createdAt})
      `;
      return row;
    },
    async insertPostingVersion(row) {
      await q`
        INSERT INTO recruiting_posting_versions (id, requisition_id, version, snapshot, created_by, created_at)
        VALUES (${row.id}, ${row.requisitionId}, ${row.version}, ${q.json(row.snapshot)}, ${row.createdBy}, ${row.createdAt})
      `;
      return row;
    },
    async countPostingVersions(requisitionId) {
      const [row] = await q`SELECT count(*)::int AS n FROM recruiting_posting_versions WHERE requisition_id = ${requisitionId}`;
      return row.n;
    },
    async insertQuestion(row) {
      await q`
        INSERT INTO recruiting_questions (id, requisition_id, prompt, field_type, required, options, position)
        VALUES (${row.id}, ${row.requisitionId}, ${row.prompt}, ${row.fieldType}, ${row.required}, ${row.options ? q.json(row.options) : null}, ${row.position})
      `;
      return row;
    },
    async listQuestions(requisitionId) {
      const rows = await q`SELECT * FROM recruiting_questions WHERE requisition_id = ${requisitionId} ORDER BY position`;
      return rows.map(mapQuestion);
    },
    async upsertCandidate(row) {
      const [saved] = await q`
        INSERT INTO recruiting_candidates (
          id, organization_id, email, full_name, phone, location, portfolio_url, created_at, updated_at
        ) VALUES (
          ${row.id}, ${row.organizationId}, ${row.email}, ${row.fullName}, ${row.phone}, ${row.location},
          ${row.portfolioUrl}, ${row.createdAt}, ${row.updatedAt}
        )
        ON CONFLICT (organization_id, email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = COALESCE(EXCLUDED.phone, recruiting_candidates.phone),
          location = COALESCE(EXCLUDED.location, recruiting_candidates.location),
          portfolio_url = COALESCE(EXCLUDED.portfolio_url, recruiting_candidates.portfolio_url),
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;
      return mapCandidate(saved);
    },
    async getCandidate(id) {
      const [row] = await q`SELECT * FROM recruiting_candidates WHERE id = ${id}`;
      return row ? mapCandidate(row) : null;
    },
    async updateCandidate(id, patch) {
      await q`
        UPDATE recruiting_candidates SET
          full_name = ${patch.fullName},
          email = ${patch.email},
          phone = ${patch.phone},
          location = ${patch.location},
          portfolio_url = ${patch.portfolioUrl},
          updated_at = now()
        WHERE id = ${id}
      `;
      return this.getCandidate(id);
    },
    async listCandidates(orgId) {
      const rows = await q`SELECT * FROM recruiting_candidates WHERE organization_id = ${orgId}`;
      return rows.map(mapCandidate);
    },
    async insertContact(row) {
      await q`
        INSERT INTO recruiting_candidate_contacts (id, candidate_id, kind, value, created_at)
        VALUES (${row.id}, ${row.candidateId}, ${row.kind}, ${row.value}, ${row.createdAt})
      `;
      return row;
    },
    async insertApplication(row) {
      try {
        await q`
          INSERT INTO recruiting_applications (
            id, organization_id, requisition_id, candidate_id, stage, source, reference_code,
            idempotency_key, consent_at, withdrawn_at, created_at, updated_at
          ) VALUES (
            ${row.id}, ${row.organizationId}, ${row.requisitionId}, ${row.candidateId}, ${row.stage},
            ${row.source}, ${row.referenceCode}, ${row.idempotencyKey}, ${row.consentAt}, ${row.withdrawnAt},
            ${row.createdAt}, ${row.updatedAt}
          )
        `;
      } catch (err) {
        if (err.code === '23505') {
          throw recruitingError(409, String(err.constraint || '').includes('active') ? 'duplicate_application' : 'conflict', 'Could not store that application.');
        }
        throw err;
      }
      return row;
    },
    async updateApplication(id, patch) {
      if (patch.withdrawnAt !== undefined) {
        await q`
          UPDATE recruiting_applications
          SET stage = ${patch.stage}, withdrawn_at = ${patch.withdrawnAt}, updated_at = now()
          WHERE id = ${id}
        `;
      } else {
        await q`UPDATE recruiting_applications SET stage = ${patch.stage}, updated_at = now() WHERE id = ${id}`;
      }
      return this.getApplication(id);
    },
    async getApplication(id) {
      const [row] = await q`SELECT * FROM recruiting_applications WHERE id = ${id}`;
      return row ? mapApplication(row) : null;
    },
    async findApplicationByIdempotency(orgId, key) {
      if (!key) return null;
      const [row] = await q`
        SELECT * FROM recruiting_applications WHERE organization_id = ${orgId} AND idempotency_key = ${key}
      `;
      return row ? mapApplication(row) : null;
    },
    async findActiveApplication(requisitionId, candidateId) {
      const [row] = await q`
        SELECT * FROM recruiting_applications
        WHERE requisition_id = ${requisitionId} AND candidate_id = ${candidateId}
          AND stage NOT IN ('rejected', 'withdrawn')
      `;
      return row ? mapApplication(row) : null;
    },
    async findApplicationByReference(reference) {
      const [row] = await q`SELECT * FROM recruiting_applications WHERE reference_code = ${reference}`;
      return row ? mapApplication(row) : null;
    },
    async listApplications(orgId) {
      const rows = await q`SELECT * FROM recruiting_applications WHERE organization_id = ${orgId} ORDER BY created_at DESC`;
      return rows.map(mapApplication);
    },
    async insertResponse(row) {
      await q`
        INSERT INTO recruiting_responses (id, application_id, question_id, prompt, value)
        VALUES (${row.id}, ${row.applicationId}, ${row.questionId}, ${row.prompt}, ${row.value})
      `;
      return row;
    },
    async listResponses(applicationId) {
      const rows = await q`SELECT * FROM recruiting_responses WHERE application_id = ${applicationId}`;
      return rows.map((row) => ({
        id: row.id,
        applicationId: row.application_id,
        questionId: row.question_id,
        prompt: row.prompt,
        value: row.value
      }));
    },
    async updateResponse(id, patch) {
      await q`UPDATE recruiting_responses SET value = ${patch.value} WHERE id = ${id}`;
      return { id, ...patch };
    },
    async insertAttachment(row) {
      await q`
        INSERT INTO recruiting_attachments (
          id, application_id, organization_id, filename, content_type, byte_size, sha256, body, scan_status, created_at
        ) VALUES (
          ${row.id}, ${row.applicationId}, ${row.organizationId}, ${row.filename}, ${row.contentType},
          ${row.byteSize}, ${row.sha256}, ${Buffer.from(row.body)}, ${row.scanStatus}, ${row.createdAt}
        )
      `;
      return row;
    },
    async getAttachment(id) {
      const [row] = await q`SELECT * FROM recruiting_attachments WHERE id = ${id}`;
      return row ? mapAttachment(row, true) : null;
    },
    async updateAttachment(id, patch) {
      await q`
        UPDATE recruiting_attachments SET
          filename = ${patch.filename},
          body = ${Buffer.from(patch.body)},
          byte_size = ${patch.byteSize}
        WHERE id = ${id}
      `;
      return { id, ...patch };
    },
    async listAttachmentMeta(applicationId) {
      const rows = await q`
        SELECT id, application_id, organization_id, filename, content_type, byte_size, sha256, scan_status, created_at
        FROM recruiting_attachments WHERE application_id = ${applicationId}
      `;
      return rows.map((row) => mapAttachment(row, false));
    },
    async insertMember(row) {
      await q`
        INSERT INTO recruiting_members (requisition_id, clerk_user_id, member_role, created_at)
        VALUES (${row.requisitionId}, ${row.clerkUserId}, ${row.memberRole}, ${row.createdAt})
        ON CONFLICT DO NOTHING
      `;
      return row;
    },
    async listMembers(requisitionId) {
      const rows = await q`SELECT * FROM recruiting_members WHERE requisition_id = ${requisitionId}`;
      return rows.map(mapMember);
    },
    async listMembershipsForUser(clerkUserId) {
      const rows = await q`SELECT * FROM recruiting_members WHERE clerk_user_id = ${clerkUserId}`;
      return rows.map(mapMember);
    },
    async insertTransition(row) {
      await q`
        INSERT INTO recruiting_transitions (id, application_id, from_stage, to_stage, actor_id, created_at)
        VALUES (${row.id}, ${row.applicationId}, ${row.fromStage}, ${row.toStage}, ${row.actorId}, ${row.createdAt})
      `;
      return row;
    },
    async listTransitions(applicationId) {
      const rows = await q`SELECT * FROM recruiting_transitions WHERE application_id = ${applicationId} ORDER BY created_at`;
      return rows.map((row) => ({
        id: row.id,
        applicationId: row.application_id,
        fromStage: row.from_stage,
        toStage: row.to_stage,
        actorId: row.actor_id,
        createdAt: iso(row.created_at)
      }));
    },
    async insertInterview(row) {
      await q`
        INSERT INTO recruiting_interviews (
          id, application_id, interviewer_clerk_user_id, starts_at, status, created_by, created_at
        ) VALUES (
          ${row.id}, ${row.applicationId}, ${row.interviewerClerkUserId}, ${row.startsAt}, ${row.status},
          ${row.createdBy}, ${row.createdAt}
        )
      `;
      return row;
    },
    async updateInterview(id, patch) {
      await q`UPDATE recruiting_interviews SET status = ${patch.status} WHERE id = ${id}`;
      return this.getInterview(id);
    },
    async getInterview(id) {
      const [row] = await q`SELECT * FROM recruiting_interviews WHERE id = ${id}`;
      return row ? mapInterview(row) : null;
    },
    async listInterviews(orgId) {
      const rows = await q`
        SELECT i.* FROM recruiting_interviews i
        JOIN recruiting_applications a ON a.id = i.application_id
        WHERE a.organization_id = ${orgId}
      `;
      return rows.map(mapInterview);
    },
    async insertFeedback(row) {
      await q`
        INSERT INTO recruiting_feedback (
          id, interview_id, application_id, author_clerk_user_id, body, recommendation, created_at
        ) VALUES (
          ${row.id}, ${row.interviewId}, ${row.applicationId}, ${row.authorClerkUserId}, ${row.body},
          ${row.recommendation}, ${row.createdAt}
        )
      `;
      return row;
    },
    async listFeedbackByInterview(interviewId) {
      const rows = await q`SELECT * FROM recruiting_feedback WHERE interview_id = ${interviewId}`;
      return rows.map(mapFeedback);
    },
    async listFeedbackByApplication(applicationId) {
      const rows = await q`SELECT * FROM recruiting_feedback WHERE application_id = ${applicationId}`;
      return rows.map(mapFeedback);
    },
    async insertNote(row) {
      await q`
        INSERT INTO recruiting_notes (id, application_id, author_clerk_user_id, body, created_at)
        VALUES (${row.id}, ${row.applicationId}, ${row.authorClerkUserId}, ${row.body}, ${row.createdAt})
      `;
      return row;
    },
    async listNotes(applicationId) {
      const rows = await q`SELECT * FROM recruiting_notes WHERE application_id = ${applicationId} ORDER BY created_at`;
      return rows.map((row) => ({
        id: row.id,
        applicationId: row.application_id,
        authorClerkUserId: row.author_clerk_user_id,
        body: row.body,
        createdAt: iso(row.created_at)
      }));
    },
    async insertOffer(row) {
      await q`
        INSERT INTO recruiting_offers (
          id, application_id, compensation_min_cents, compensation_max_cents, currency, status, created_by, created_at
        ) VALUES (
          ${row.id}, ${row.applicationId}, ${row.compensationMinCents}, ${row.compensationMaxCents},
          ${row.currency}, ${row.status}, ${row.createdBy}, ${row.createdAt}
        )
      `;
      return row;
    },
    async listOffers(applicationId) {
      const rows = await q`SELECT * FROM recruiting_offers WHERE application_id = ${applicationId}`;
      return rows.map((row) => ({
        id: row.id,
        applicationId: row.application_id,
        compensationMinCents: row.compensation_min_cents,
        compensationMaxCents: row.compensation_max_cents,
        currency: row.currency,
        status: row.status,
        createdBy: row.created_by,
        createdAt: iso(row.created_at)
      }));
    },
    async insertDecision(row) {
      await q`
        INSERT INTO recruiting_decisions (id, application_id, decision, actor_id, created_at)
        VALUES (${row.id}, ${row.applicationId}, ${row.decision}, ${row.actorId}, ${row.createdAt})
      `;
      return row;
    },
    async listDecisions(applicationId) {
      const rows = await q`SELECT * FROM recruiting_decisions WHERE application_id = ${applicationId} ORDER BY created_at`;
      return rows.map((row) => ({
        id: row.id,
        applicationId: row.application_id,
        decision: row.decision,
        actorId: row.actor_id,
        createdAt: iso(row.created_at)
      }));
    },
    async insertCommunication(row) {
      await q`
        INSERT INTO recruiting_communications (
          id, organization_id, application_id, template_key, body, delivery_status, actor_id, created_at
        ) VALUES (
          ${row.id}, ${row.organizationId}, ${row.applicationId}, ${row.templateKey}, ${row.body},
          ${row.deliveryStatus}, ${row.actorId}, ${row.createdAt}
        )
      `;
      return row;
    },
    async listCommunications(orgId) {
      const rows = await q`SELECT * FROM recruiting_communications WHERE organization_id = ${orgId} ORDER BY created_at DESC`;
      return rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        applicationId: row.application_id,
        templateKey: row.template_key,
        body: row.body,
        deliveryStatus: row.delivery_status,
        actorId: row.actor_id,
        createdAt: iso(row.created_at)
      }));
    },
    async insertConsent(row) {
      await q`
        INSERT INTO recruiting_consents (id, application_id, candidate_id, purpose, granted_at)
        VALUES (${row.id}, ${row.applicationId}, ${row.candidateId}, ${row.purpose}, ${row.grantedAt})
      `;
      return row;
    },
    async insertAudit(row) {
      await q`
        INSERT INTO recruiting_audit (id, organization_id, actor_id, action, entity_type, entity_id, detail, created_at)
        VALUES (
          ${row.id}, ${row.organizationId}, ${row.actorId}, ${row.action}, ${row.entityType}, ${row.entityId},
          ${q.json(row.detail || {})}, ${row.createdAt}
        )
      `;
      return row;
    },
    async listAudit(orgId, limit = 50) {
      const rows = await q`
        SELECT * FROM recruiting_audit WHERE organization_id = ${orgId}
        ORDER BY created_at DESC LIMIT ${limit}
      `;
      return rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        actorId: row.actor_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        detail: row.detail,
        createdAt: iso(row.created_at)
      }));
    },
    async insertRetention(row) {
      await q`
        INSERT INTO recruiting_retention (
          id, organization_id, candidate_id, application_id, request_type, status, created_at
        ) VALUES (
          ${row.id}, ${row.organizationId}, ${row.candidateId}, ${row.applicationId}, ${row.requestType},
          ${row.status}, ${row.createdAt}
        )
      `;
      return row;
    },
    async updateRetention(id, patch) {
      await q`UPDATE recruiting_retention SET status = ${patch.status} WHERE id = ${id}`;
      return { id, ...patch };
    },
    async listRetention(orgId) {
      const rows = await q`SELECT * FROM recruiting_retention WHERE organization_id = ${orgId} ORDER BY created_at DESC`;
      return rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        candidateId: row.candidate_id,
        applicationId: row.application_id,
        requestType: row.request_type,
        status: row.status,
        createdAt: iso(row.created_at)
      }));
    },
    async insertAttempt(row) {
      await q`
        INSERT INTO recruiting_attempts (id, organization_id, ip_hash, email, created_at)
        VALUES (${row.id}, ${row.organizationId}, ${row.ipHash}, ${row.email}, ${row.createdAt})
      `;
      return row;
    },
    async countRecentAttempts(orgId, ipHash, since) {
      const [row] = await q`
        SELECT count(*)::int AS n FROM recruiting_attempts
        WHERE organization_id = ${orgId} AND ip_hash = ${ipHash} AND created_at >= ${since}
      `;
      return row.n;
    },
    async countRecentEmailAttempts(orgId, email, since) {
      const [row] = await q`
        SELECT count(*)::int AS n FROM recruiting_attempts
        WHERE organization_id = ${orgId} AND email = ${email} AND created_at >= ${since}
      `;
      return row.n;
    },
    async insertRequisitionEvent(row) {
      await q`
        INSERT INTO recruiting_requisition_events (id, requisition_id, from_status, to_status, actor_id, created_at)
        VALUES (${row.id}, ${row.requisitionId}, ${row.fromStatus}, ${row.toStatus}, ${row.actorId}, ${row.createdAt})
      `;
      return row;
    },
    async listRequisitionEvents(requisitionId) {
      const rows = await q`SELECT * FROM recruiting_requisition_events WHERE requisition_id = ${requisitionId} ORDER BY created_at`;
      return rows.map((row) => ({
        id: row.id,
        requisitionId: row.requisition_id,
        fromStatus: row.from_status,
        toStatus: row.to_status,
        actorId: row.actor_id,
        createdAt: iso(row.created_at)
      }));
    }
  };
}

const PATCH_COLUMNS = {
  title: 'title',
  summary: 'summary',
  description: 'description',
  responsibilities: 'responsibilities',
  qualifications: 'qualifications',
  learningOutcomes: 'learning_outcomes',
  instructions: 'instructions',
  timingNote: 'timing_note',
  supervisorLabel: 'supervisor_label',
  durationText: 'duration_text',
  scheduleText: 'schedule_text',
  location: 'location',
  opportunityType: 'opportunity_type',
  employmentType: 'employment_type',
  workplace: 'workplace',
  timingStatus: 'timing_status',
  compensationPublic: 'compensation_public',
  resumeRequired: 'resume_required',
  compensationMinCents: 'compensation_min_cents',
  compensationMaxCents: 'compensation_max_cents',
  unresolvedTerms: 'unresolved_terms',
  departmentId: 'department_id',
  status: 'status',
  publishedBy: 'published_by',
  pipeline: 'pipeline'
};

function mapPatch(patch) {
  const data = {};
  for (const [key, column] of Object.entries(PATCH_COLUMNS)) {
    if (patch[key] !== undefined) data[column] = patch[key];
  }
  return data;
}

function mapOrg(row) {
  return { id: row.id, slug: row.slug, name: row.name, createdAt: iso(row.created_at) };
}
function mapDepartment(row) {
  return { id: row.id, organizationId: row.organization_id, name: row.name, createdAt: iso(row.created_at) };
}
function mapRequisition(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    departmentId: row.department_id,
    teamId: row.team_id,
    slug: row.slug,
    title: row.title,
    headcount: row.headcount,
    employmentType: row.employment_type,
    workplace: row.workplace,
    location: row.location,
    summary: row.summary,
    description: row.description,
    responsibilities: row.responsibilities,
    qualifications: row.qualifications,
    instructions: row.instructions,
    compensationMinCents: row.compensation_min_cents,
    compensationMaxCents: row.compensation_max_cents,
    compensationCurrency: row.compensation_currency,
    compensationPublic: row.compensation_public,
    resumeRequired: row.resume_required,
    opportunityType: row.opportunity_type,
    timingStatus: row.timing_status,
    timingNote: row.timing_note,
    learningOutcomes: row.learning_outcomes,
    supervisorLabel: row.supervisor_label,
    durationText: row.duration_text,
    scheduleText: row.schedule_text,
    unresolvedTerms: row.unresolved_terms || [],
    status: row.status,
    opensOn: row.opens_on ? String(row.opens_on).slice(0, 10) : null,
    closesOn: row.closes_on ? String(row.closes_on).slice(0, 10) : null,
    pipeline: row.pipeline,
    submittedBy: row.submitted_by,
    approvedBy: row.approved_by,
    publishedBy: row.published_by,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}
function mapQuestion(row) {
  return {
    id: row.id,
    requisitionId: row.requisition_id,
    prompt: row.prompt,
    fieldType: row.field_type,
    required: row.required,
    options: row.options,
    position: row.position
  };
}
function mapCandidate(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    location: row.location,
    portfolioUrl: row.portfolio_url,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}
function mapApplication(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    requisitionId: row.requisition_id,
    candidateId: row.candidate_id,
    stage: row.stage,
    source: row.source,
    referenceCode: row.reference_code,
    idempotencyKey: row.idempotency_key,
    consentAt: iso(row.consent_at),
    withdrawnAt: row.withdrawn_at ? iso(row.withdrawn_at) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}
function mapAttachment(row, withBody) {
  const mapped = {
    id: row.id,
    applicationId: row.application_id,
    organizationId: row.organization_id,
    filename: row.filename,
    contentType: row.content_type,
    byteSize: row.byte_size,
    sha256: row.sha256,
    scanStatus: row.scan_status,
    createdAt: iso(row.created_at)
  };
  if (withBody) mapped.body = row.body;
  return mapped;
}
function mapMember(row) {
  return { requisitionId: row.requisition_id, clerkUserId: row.clerk_user_id, memberRole: row.member_role };
}
function mapInterview(row) {
  return {
    id: row.id,
    applicationId: row.application_id,
    interviewerClerkUserId: row.interviewer_clerk_user_id,
    startsAt: row.starts_at ? iso(row.starts_at) : null,
    status: row.status,
    createdBy: row.created_by,
    createdAt: iso(row.created_at)
  };
}
function mapFeedback(row) {
  return {
    id: row.id,
    interviewId: row.interview_id,
    applicationId: row.application_id,
    authorClerkUserId: row.author_clerk_user_id,
    body: row.body,
    recommendation: row.recommendation,
    createdAt: iso(row.created_at)
  };
}
function iso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}
