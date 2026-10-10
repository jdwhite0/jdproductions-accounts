import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { DEPARTMENTS, OPPORTUNITIES } from './catalog.js';
import {
  CANDIDATE_STATUS,
  CONFIRMATION_TEMPLATE,
  DEFAULT_PIPELINE,
  EMPLOYMENT_TYPES,
  FIELD_TYPES,
  JD_ORG_ID,
  MAX_LONG,
  MAX_NAME,
  MAX_RESUME_BYTES,
  MAX_SHORT,
  OPPORTUNITY_TYPES,
  REFERENCE_ALPHABET,
  REQUISITION_STATUSES,
  STATUS_TRANSITIONS,
  WORKPLACES
} from './constants.js';
import { recruitingError } from './errors.js';
import { BROAD_ACCESS, PIPELINE_EDITORS, PUBLISHERS, assertRole } from './roles.js';

const SSN = /\b\d{3}-\d{2}-\d{4}\b/;
const EARLY_STAGES = ['application_received', 'initial_review', 'screening', 'interview', 'final_evaluation', 'future_consideration'];
const ADMIN_STAGES = [...EARLY_STAGES, 'offer', 'hired', 'rejected', 'archived'];
const FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc'
};

export function createRecruitingService(store, options = {}) {
  const now = options.now || (() => new Date());
  const uuid = options.uuid || randomUUID;

  return {
    ensureCatalog,
    listPublished,
    getPublished,
    submitApplication,
    applicationStatus,
    withdrawApplication,
    privacyRequest,
    createOpportunity,
    updateOpportunity,
    transitionOpportunity,
    addQuestion,
    assignMember,
    listOpportunities,
    getOpportunity,
    listApplications,
    getApplication,
    moveStage,
    addNote,
    scheduleInterview,
    submitFeedback,
    recordCommunication,
    recordDecision,
    createOffer,
    overview,
    report,
    downloadAttachment,
    listCandidates,
    listCommunications,
    listRetention,
    completeDeletion,
    exportApplications
  };

  async function org() {
    return store.ensureOrganization();
  }

  async function ensureCatalog(actorId = 'catalog') {
    const organization = await org();
    for (const department of DEPARTMENTS) {
      const existing = await store.findDepartmentByName(organization.id, department.name);
      if (!existing) {
        await store.insertDepartment({
          id: department.id,
          organizationId: organization.id,
          name: department.name,
          createdAt: now().toISOString()
        });
      }
    }
    const existing = await store.listRequisitions(organization.id);
    const bySlug = new Map(existing.map((item) => [item.slug, item]));
    for (const item of OPPORTUNITIES) {
      if (bySlug.has(item.slug)) continue;
      let departmentId = null;
      if (item.departmentName) {
        const department = await store.findDepartmentByName(organization.id, item.departmentName);
        if (!department) throw new Error(`Recruiting catalog is missing department ${item.departmentName}`);
        departmentId = department.id;
      }
      const created = await insertOpportunityRecord({
        ...item,
        departmentId,
        submittedBy: actorId,
        publishedBy: item.status === 'published' ? actorId : null
      });
      for (const [index, question] of (item.questions || []).entries()) {
        await store.insertQuestion(questionRow(created.id, question, index, uuid));
      }
      await store.insertHiringPlan({
        id: uuid(),
        requisitionId: created.id,
        targetHeadcount: item.headcount || 1,
        notes: 'Initial catalog. Not a headcount commitment.',
        createdAt: now().toISOString()
      });
    }
    return organization;
  }

  async function listPublished() {
    await ensureCatalog();
    const organization = await org();
    const rows = await store.listRequisitions(organization.id);
    const departments = await store.listDepartments(organization.id);
    const jobs = [];
    for (const row of rows) {
      if (!isPublic(row, now())) continue;
      jobs.push(await presentPublic(row, departments));
    }
    jobs.sort((a, b) => a.title.localeCompare(b.title));
    return { jobs };
  }

  async function getPublished(slug) {
    await ensureCatalog();
    const row = await requirePublic(slug);
    const departments = await store.listDepartments(row.organizationId);
    return presentPublic(row, departments);
  }

  async function submitApplication(input, context = {}) {
    await ensureCatalog();
    const row = await requirePublic(input.slug);
    const parsed = await validateSubmission(input, row);
    const organization = await org();
    const ipHash = hashIp(context.ip);
    const stamp = now().toISOString();
    const since = new Date(now().getTime() - 60 * 60 * 1000).toISOString();
    await store.insertAttempt({
      id: uuid(),
      organizationId: organization.id,
      ipHash,
      email: parsed.email,
      createdAt: stamp
    });
    const ipCount = await store.countRecentAttempts(organization.id, ipHash, since);
    const emailCount = await store.countRecentEmailAttempts(organization.id, parsed.email, since);
    if (ipCount > 8 || emailCount > 5) {
      throw recruitingError(429, 'rate_limited', 'Too many applications were submitted. Try again later.');
    }

    if (parsed.idempotencyKey) {
      const prior = await store.findApplicationByIdempotency(organization.id, parsed.idempotencyKey);
      if (prior) return finishIdempotent(prior, parsed.email);
    }

    try {
      return await store.transaction(async (tx) => {
        const candidate = await tx.upsertCandidate({
          id: uuid(),
          organizationId: organization.id,
          email: parsed.email,
          fullName: parsed.fullName,
          phone: parsed.phone,
          location: parsed.location,
          portfolioUrl: parsed.portfolioUrl,
          createdAt: stamp,
          updatedAt: stamp
        });
        await writeContacts(tx, candidate, parsed, stamp);
        const active = await tx.findActiveApplication(row.id, candidate.id);
        if (active) throw recruitingError(409, 'duplicate_application', 'An application for this role is already open.');
        const referenceCode = makeReference();
        const application = await tx.insertApplication({
          id: uuid(),
          organizationId: organization.id,
          requisitionId: row.id,
          candidateId: candidate.id,
          stage: 'application_received',
          source: parsed.source,
          referenceCode,
          idempotencyKey: parsed.idempotencyKey,
          consentAt: stamp,
          withdrawnAt: null,
          createdAt: stamp,
          updatedAt: stamp
        });
        await tx.insertConsent({
          id: uuid(),
          applicationId: application.id,
          candidateId: candidate.id,
          purpose: 'recruiting',
          grantedAt: stamp
        });
        for (const answer of parsed.answers) {
          await tx.insertResponse({
            id: uuid(),
            applicationId: application.id,
            questionId: answer.questionId,
            prompt: answer.prompt,
            value: answer.value
          });
          if (answer.consentPurpose && answer.truthy) {
            await tx.insertConsent({
              id: uuid(),
              applicationId: application.id,
              candidateId: candidate.id,
              purpose: answer.consentPurpose,
              grantedAt: stamp
            });
          }
        }
        if (parsed.resume) {
          await tx.insertAttachment({
            id: uuid(),
            applicationId: application.id,
            organizationId: organization.id,
            filename: parsed.resume.filename,
            contentType: parsed.resume.contentType,
            byteSize: parsed.resume.bytes.byteLength,
            sha256: sha256(parsed.resume.bytes),
            body: parsed.resume.bytes,
            scanStatus: 'unscanned',
            createdAt: stamp
          });
        }
        await tx.insertTransition({
          id: uuid(),
          applicationId: application.id,
          fromStage: null,
          toStage: 'application_received',
          actorId: 'candidate',
          createdAt: stamp
        });
        await tx.insertCommunication({
          id: uuid(),
          organizationId: organization.id,
          applicationId: application.id,
          templateKey: CONFIRMATION_TEMPLATE,
          body: 'Application recorded. Email delivery is not configured, so the confirmation is the response shown to the candidate.',
          deliveryStatus: 'recorded',
          actorId: null,
          createdAt: stamp
        });
        await tx.insertAudit({
          id: uuid(),
          organizationId: organization.id,
          actorId: null,
          action: 'application_submitted',
          entityType: 'application',
          entityId: application.id,
          detail: { requisitionId: row.id, referenceCode },
          createdAt: stamp
        });
        return confirmation(application, row, false);
      });
    } catch (err) {
      if (parsed.idempotencyKey && (err.code === 'conflict' || err.code === 'duplicate_application')) {
        const prior = await store.findApplicationByIdempotency(organization.id, parsed.idempotencyKey);
        if (prior) return finishIdempotent(prior, parsed.email);
      }
      throw err;
    }
  }

  async function finishIdempotent(application, email) {
    const candidate = await store.getCandidate(application.candidateId);
    if (!candidate || candidate.email !== email) {
      throw recruitingError(409, 'idempotency_conflict', 'That submission key was already used.');
    }
    const requisition = await store.getRequisition(application.requisitionId);
    return confirmation(application, requisition, true);
  }

  async function applicationStatus({ referenceCode, email }) {
    const application = await applicationForCandidate(referenceCode, email);
    const requisition = await store.getRequisition(application.requisitionId);
    return {
      referenceCode: application.referenceCode,
      statusLabel: CANDIDATE_STATUS[application.stage] || 'In review',
      jobTitle: requisition?.title || '',
      submittedAt: application.createdAt
    };
  }

  async function withdrawApplication({ referenceCode, email }) {
    const application = await applicationForCandidate(referenceCode, email);
    if (application.stage === 'hired') {
      throw recruitingError(409, 'cannot_withdraw', 'A hired application cannot be withdrawn here.');
    }
    if (application.stage === 'withdrawn') {
      return { referenceCode: application.referenceCode, statusLabel: 'Withdrawn', idempotent: true };
    }
    const stamp = now().toISOString();
    await store.updateApplication(application.id, { stage: 'withdrawn', withdrawnAt: stamp });
    await store.insertTransition({
      id: uuid(),
      applicationId: application.id,
      fromStage: application.stage,
      toStage: 'withdrawn',
      actorId: 'candidate',
      createdAt: stamp
    });
    await store.insertAudit({
      id: uuid(),
      organizationId: application.organizationId,
      actorId: null,
      action: 'application_withdrawn',
      entityType: 'application',
      entityId: application.id,
      detail: { from: application.stage },
      createdAt: stamp
    });
    return { referenceCode: application.referenceCode, statusLabel: 'Withdrawn', idempotent: false };
  }

  async function privacyRequest({ referenceCode, email, requestType }) {
    if (!['access', 'deletion'].includes(requestType)) {
      throw recruitingError(400, 'invalid_request', 'Request type must be access or deletion.');
    }
    const application = await applicationForCandidate(referenceCode, email);
    const stamp = now().toISOString();
    const record = await store.insertRetention({
      id: uuid(),
      organizationId: application.organizationId,
      candidateId: application.candidateId,
      applicationId: application.id,
      requestType,
      status: 'received',
      createdAt: stamp
    });
    await store.insertAudit({
      id: uuid(),
      organizationId: application.organizationId,
      actorId: null,
      action: 'privacy_request',
      entityType: 'retention',
      entityId: record.id,
      detail: { requestType },
      createdAt: stamp
    });
    return { status: 'received', requestType };
  }

  async function createOpportunity(actor, input) {
    assertRole(actor, PUBLISHERS.concat(['recruiter', 'hiring_manager']));
    await ensureCatalog();
    const organization = await org();
    const title = clean(input.title, MAX_NAME, 'title');
    let department = null;
    if (input.departmentName) {
      department = await store.findDepartmentByName(organization.id, input.departmentName);
      if (!department) {
        assertRole(actor, PUBLISHERS);
        department = await store.insertDepartment({
          id: uuid(),
          organizationId: organization.id,
          name: clean(input.departmentName, MAX_SHORT, 'department'),
          createdAt: now().toISOString()
        });
      }
    }
    const id = uuid();
    const created = await insertOpportunityRecord({
      id,
      slug: slugify(title, id),
      title,
      departmentId: department?.id || null,
      opportunityType: enumValue(input.opportunityType || 'upcoming', OPPORTUNITY_TYPES, 'opportunity_type'),
      employmentType: enumValue(input.employmentType || 'to_be_confirmed', EMPLOYMENT_TYPES, 'employment_type'),
      workplace: enumValue(input.workplace || 'to_be_confirmed', WORKPLACES, 'workplace'),
      location: optionalText(input.location, MAX_SHORT),
      summary: optionalText(input.summary, MAX_LONG) || '',
      description: optionalText(input.description, MAX_LONG) || '',
      responsibilities: optionalText(input.responsibilities, MAX_LONG) || '',
      qualifications: optionalText(input.qualifications, MAX_LONG) || '',
      learningOutcomes: optionalText(input.learningOutcomes, MAX_LONG) || '',
      instructions: optionalText(input.instructions, MAX_LONG) || '',
      timingStatus: input.timingStatus || 'to_be_determined',
      timingNote: optionalText(input.timingNote, MAX_LONG),
      supervisorLabel: optionalText(input.supervisorLabel, MAX_NAME),
      durationText: optionalText(input.durationText, MAX_SHORT),
      scheduleText: optionalText(input.scheduleText, MAX_SHORT),
      unresolvedTerms: Array.isArray(input.unresolvedTerms) ? input.unresolvedTerms : [],
      headcount: Number(input.headcount) || 1,
      compensationMinCents: centsOrNull(input.compensationMinCents),
      compensationMaxCents: centsOrNull(input.compensationMaxCents),
      compensationPublic: Boolean(input.compensationPublic),
      resumeRequired: Boolean(input.resumeRequired),
      status: 'draft',
      submittedBy: actor.clerkUserId,
      publishedBy: null
    });
    if (['recruiter', 'hiring_manager'].includes(actor.role)) {
      await store.insertMember({
        requisitionId: created.id,
        clerkUserId: actor.clerkUserId,
        memberRole: actor.role,
        createdAt: now().toISOString()
      });
    }
    await audit(actor, 'opportunity_created', 'requisition', created.id, { status: 'draft' });
    return sanitizeOpportunity(created);
  }

  async function updateOpportunity(actor, id, patch) {
    const current = await editableOpportunity(actor, id);
    const next = {};
    for (const key of [
      'title',
      'summary',
      'description',
      'responsibilities',
      'qualifications',
      'learningOutcomes',
      'instructions',
      'timingNote',
      'supervisorLabel',
      'durationText',
      'scheduleText',
      'location'
    ]) {
      if (patch[key] !== undefined) next[key] = optionalText(patch[key], MAX_LONG) || '';
    }
    if (patch.opportunityType) next.opportunityType = enumValue(patch.opportunityType, OPPORTUNITY_TYPES, 'opportunity_type');
    if (patch.employmentType) next.employmentType = enumValue(patch.employmentType, EMPLOYMENT_TYPES, 'employment_type');
    if (patch.workplace) next.workplace = enumValue(patch.workplace, WORKPLACES, 'workplace');
    if (patch.timingStatus) next.timingStatus = enumValue(patch.timingStatus, ['immediate', 'flexible', 'to_be_determined'], 'timing_status');
    if (patch.compensationPublic !== undefined) next.compensationPublic = Boolean(patch.compensationPublic);
    if (patch.resumeRequired !== undefined) next.resumeRequired = Boolean(patch.resumeRequired);
    if (patch.compensationMinCents !== undefined) next.compensationMinCents = centsOrNull(patch.compensationMinCents);
    if (patch.compensationMaxCents !== undefined) next.compensationMaxCents = centsOrNull(patch.compensationMaxCents);
    if (patch.unresolvedTerms) next.unresolvedTerms = patch.unresolvedTerms;
    if (patch.departmentName) {
      let department = await store.findDepartmentByName(current.organizationId, patch.departmentName);
      if (!department) {
        assertRole(actor, PUBLISHERS);
        department = await store.insertDepartment({
          id: uuid(),
          organizationId: current.organizationId,
          name: clean(patch.departmentName, MAX_SHORT, 'department'),
          createdAt: now().toISOString()
        });
      }
      next.departmentId = department.id;
    }
    const updated = await store.updateRequisition(id, next);
    if (updated.status === 'published') await snapshot(actor, updated);
    await audit(actor, 'opportunity_updated', 'requisition', id, { fields: Object.keys(next) });
    return sanitizeOpportunity(updated);
  }

  async function transitionOpportunity(actor, id, to) {
    assertRole(actor, PUBLISHERS);
    if (!REQUISITION_STATUSES.includes(to)) throw recruitingError(400, 'invalid_status', 'Unknown publication status.');
    const current = await store.getRequisition(id);
    if (!current || current.organizationId !== JD_ORG_ID) throw recruitingError(404, 'not_found', 'Opportunity not found.');
    const allowed = STATUS_TRANSITIONS[current.status] || [];
    if (!allowed.includes(to)) throw recruitingError(409, 'invalid_transition', 'That status change is not available.');
    const patch = { status: to };
    if (to === 'published') patch.publishedBy = actor.clerkUserId;
    const updated = await store.updateRequisition(id, patch);
    await store.insertRequisitionEvent({
      id: uuid(),
      requisitionId: id,
      fromStatus: current.status,
      toStatus: to,
      actorId: actor.clerkUserId,
      createdAt: now().toISOString()
    });
    if (to === 'published') await snapshot(actor, updated);
    await audit(actor, 'opportunity_status', 'requisition', id, { from: current.status, to });
    return sanitizeOpportunity(updated);
  }

  async function addQuestion(actor, requisitionId, input) {
    await editableOpportunity(actor, requisitionId);
    const fieldType = enumValue(input.fieldType, FIELD_TYPES, 'field_type');
    const options = normalizeOptions(fieldType, input.options);
    const existing = await store.listQuestions(requisitionId);
    const row = await store.insertQuestion({
      id: uuid(),
      requisitionId,
      prompt: clean(input.prompt, MAX_SHORT, 'prompt'),
      fieldType,
      required: Boolean(input.required),
      options,
      position: existing.length
    });
    await audit(actor, 'question_added', 'requisition', requisitionId, { questionId: row.id });
    return row;
  }

  async function assignMember(actor, requisitionId, input) {
    assertRole(actor, PUBLISHERS);
    await editableOpportunity(actor, requisitionId);
    const memberRole = enumValue(input.memberRole, ['recruiter', 'hiring_manager', 'interviewer'], 'member_role');
    await store.insertMember({
      requisitionId,
      clerkUserId: clean(input.clerkUserId, 120, 'clerk_user_id'),
      memberRole,
      createdAt: now().toISOString()
    });
    await audit(actor, 'member_assigned', 'requisition', requisitionId, { memberRole });
    return { ok: true };
  }

  async function listOpportunities(actor) {
    await ensureCatalog();
    const rows = await store.listRequisitions(JD_ORG_ID);
    const departments = await store.listDepartments(JD_ORG_ID);
    const visible = [];
    for (const row of rows) {
      if (await canSee(actor, row)) visible.push(withDepartment(row, departments));
    }
    return { opportunities: visible };
  }

  async function getOpportunity(actor, id) {
    const row = await store.getRequisition(id);
    if (!row || !(await canSee(actor, row))) throw recruitingError(404, 'not_found', 'Opportunity not found.');
    const questions = await store.listQuestions(id);
    const events = await store.listRequisitionEvents(id);
    const departments = await store.listDepartments(JD_ORG_ID);
    return { ...withDepartment(row, departments), questions, events };
  }

  async function listApplications(actor, filters = {}) {
    const rows = await visibleApplications(actor);
    const departments = await store.listDepartments(JD_ORG_ID);
    const requisitions = await store.listRequisitions(JD_ORG_ID);
    const result = [];
    for (const application of rows) {
      const requisition = requisitions.find((item) => item.id === application.requisitionId);
      if (filters.requisitionId && application.requisitionId !== filters.requisitionId) continue;
      if (filters.stage && application.stage !== filters.stage) continue;
      const candidate = await store.getCandidate(application.candidateId);
      const department = departments.find((item) => item.id === requisition?.departmentId);
      result.push({
        id: application.id,
        referenceCode: application.referenceCode,
        stage: application.stage,
        statusLabel: CANDIDATE_STATUS[application.stage] || application.stage,
        source: application.source,
        createdAt: application.createdAt,
        jobTitle: requisition?.title || '',
        department: department?.name || null,
        opportunityType: requisition?.opportunityType || null,
        candidateName: candidate?.fullName || '',
        candidateEmail: actor.role === 'interviewer' ? candidate?.email || '' : candidate?.email || ''
      });
    }
    return { applications: result };
  }

  async function getApplication(actor, id) {
    const application = await store.getApplication(id);
    if (!application) throw recruitingError(404, 'not_found', 'Application not found.');
    const requisition = await store.getRequisition(application.requisitionId);
    if (!(await canSeeApplication(actor, application, requisition))) {
      throw recruitingError(404, 'not_found', 'Application not found.');
    }
    const candidate = await store.getCandidate(application.candidateId);
    const answers = await store.listResponses(id);
    const attachments = await store.listAttachmentMeta(id);
    const interviews = await store.listInterviews(JD_ORG_ID);
    const mine = interviews.filter((item) => item.applicationId === id);
    const interviewerView = actor.role === 'interviewer';
    const feedback = interviewerView
      ? (await store.listFeedbackByApplication(id)).filter((item) => item.authorClerkUserId === actor.clerkUserId)
      : await store.listFeedbackByApplication(id);
    return {
      id: application.id,
      referenceCode: application.referenceCode,
      stage: application.stage,
      statusLabel: CANDIDATE_STATUS[application.stage] || application.stage,
      source: application.source,
      createdAt: application.createdAt,
      jobTitle: requisition?.title || '',
      opportunityType: requisition?.opportunityType || null,
      candidate: {
        fullName: candidate?.fullName || '',
        email: candidate?.email || '',
        phone: candidate?.phone || null,
        location: candidate?.location || null,
        portfolioUrl: candidate?.portfolioUrl || null
      },
      answers,
      attachments,
      interviews: interviewerView ? mine.filter((item) => item.interviewerClerkUserId === actor.clerkUserId) : mine,
      feedback,
      notes: interviewerView ? [] : await store.listNotes(id),
      offers: PUBLISHERS.includes(actor.role) ? await store.listOffers(id) : [],
      decisions: interviewerView ? [] : await store.listDecisions(id)
    };
  }

  async function moveStage(actor, applicationId, to) {
    const allowed = PUBLISHERS.includes(actor.role) ? ADMIN_STAGES : EARLY_STAGES;
    if (!PIPELINE_EDITORS.includes(actor.role)) assertRole(actor, PIPELINE_EDITORS);
    if (!allowed.includes(to)) throw recruitingError(403, 'forbidden', 'That stage is not available for this role.');
    const application = await requireStaffApplication(actor, applicationId);
    if (application.stage === to) return { id: application.id, stage: to };
    const stamp = now().toISOString();
    await store.updateApplication(application.id, { stage: to, withdrawnAt: null });
    await store.insertTransition({
      id: uuid(),
      applicationId: application.id,
      fromStage: application.stage,
      toStage: to,
      actorId: actor.clerkUserId,
      createdAt: stamp
    });
    await audit(actor, 'stage_changed', 'application', application.id, { from: application.stage, to });
    return { id: application.id, stage: to };
  }

  async function addNote(actor, applicationId, body) {
    assertRole(actor, PIPELINE_EDITORS);
    const application = await requireStaffApplication(actor, applicationId);
    const note = await store.insertNote({
      id: uuid(),
      applicationId: application.id,
      authorClerkUserId: actor.clerkUserId,
      body: clean(body, MAX_LONG, 'note'),
      createdAt: now().toISOString()
    });
    await audit(actor, 'note_added', 'application', application.id, { noteId: note.id });
    return { id: note.id };
  }

  async function scheduleInterview(actor, applicationId, input) {
    assertRole(actor, PIPELINE_EDITORS);
    const application = await requireStaffApplication(actor, applicationId);
    const interviewer = clean(input.interviewerClerkUserId, 120, 'interviewer');
    const interview = await store.insertInterview({
      id: uuid(),
      applicationId: application.id,
      interviewerClerkUserId: interviewer,
      startsAt: input.startsAt || null,
      status: input.startsAt ? 'scheduled' : 'proposed',
      createdBy: actor.clerkUserId,
      createdAt: now().toISOString()
    });
    await store.insertMember({
      requisitionId: application.requisitionId,
      clerkUserId: interviewer,
      memberRole: 'interviewer',
      createdAt: now().toISOString()
    });
    await audit(actor, 'interview_scheduled', 'interview', interview.id, { mode: 'manual' });
    return { ...interview, schedulingMode: 'manual' };
  }

  async function submitFeedback(actor, interviewId, input) {
    const interview = await store.getInterview(interviewId);
    if (!interview) throw recruitingError(404, 'not_found', 'Interview not found.');
    const application = await store.getApplication(interview.applicationId);
    if (interview.interviewerClerkUserId !== actor.clerkUserId && !PUBLISHERS.includes(actor.role)) {
      throw recruitingError(403, 'forbidden', 'Only the assigned interviewer can submit this evaluation.');
    }
    if (actor.role === 'interviewer' && interview.interviewerClerkUserId !== actor.clerkUserId) {
      throw recruitingError(403, 'forbidden', 'Only the assigned interviewer can submit this evaluation.');
    }
    const feedback = await store.insertFeedback({
      id: uuid(),
      interviewId,
      applicationId: application.id,
      authorClerkUserId: actor.clerkUserId,
      body: clean(input.body, MAX_LONG, 'feedback'),
      recommendation: input.recommendation
        ? enumValue(input.recommendation, ['advance', 'hold', 'decline'], 'recommendation')
        : null,
      createdAt: now().toISOString()
    });
    await store.updateInterview(interviewId, { status: 'completed' });
    await audit(actor, 'feedback_submitted', 'interview', interviewId, { feedbackId: feedback.id });
    return { id: feedback.id };
  }

  async function recordCommunication(actor, applicationId, input) {
    assertRole(actor, PIPELINE_EDITORS);
    const application = await requireStaffApplication(actor, applicationId);
    const templateKey = enumValue(
      input.templateKey,
      ['interview_invitation', 'interview_reschedule', 'status_update', 'offer', 'withdrawal', 'application_received'],
      'template'
    );
    const row = await store.insertCommunication({
      id: uuid(),
      organizationId: application.organizationId,
      applicationId: application.id,
      templateKey,
      body: clean(input.body, MAX_LONG, 'message'),
      deliveryStatus: 'recorded',
      actorId: actor.clerkUserId,
      createdAt: now().toISOString()
    });
    await audit(actor, 'communication_recorded', 'communication', row.id, { templateKey, delivered: false });
    return { id: row.id, deliveryStatus: 'recorded', delivered: false };
  }

  async function recordDecision(actor, applicationId, decision) {
    assertRole(actor, PUBLISHERS);
    const application = await requireStaffApplication(actor, applicationId);
    const choice = enumValue(decision, ['advance', 'hire', 'reject', 'hold'], 'decision');
    const stamp = now().toISOString();
    await store.insertDecision({
      id: uuid(),
      applicationId: application.id,
      decision: choice,
      actorId: actor.clerkUserId,
      createdAt: stamp
    });
    const stage = choice === 'hire' ? 'hired' : choice === 'reject' ? 'rejected' : choice === 'hold' ? 'future_consideration' : application.stage;
    if (stage !== application.stage) {
      await store.updateApplication(application.id, { stage });
      await store.insertTransition({
        id: uuid(),
        applicationId: application.id,
        fromStage: application.stage,
        toStage: stage,
        actorId: actor.clerkUserId,
        createdAt: stamp
      });
    }
    await audit(actor, 'decision_recorded', 'application', application.id, { decision: choice });
    return { decision: choice, stage };
  }

  async function createOffer(actor, applicationId, input) {
    assertRole(actor, PUBLISHERS);
    const application = await requireStaffApplication(actor, applicationId);
    const offer = await store.insertOffer({
      id: uuid(),
      applicationId: application.id,
      compensationMinCents: centsOrNull(input.compensationMinCents),
      compensationMaxCents: centsOrNull(input.compensationMaxCents),
      currency: 'usd',
      status: 'draft',
      createdBy: actor.clerkUserId,
      createdAt: now().toISOString()
    });
    await audit(actor, 'offer_drafted', 'offer', offer.id, { sent: false });
    return { id: offer.id, status: 'draft', sent: false };
  }

  async function overview(actor) {
    const applications = await visibleApplications(actor);
    const requisitions = await store.listRequisitions(JD_ORG_ID);
    const visibleReqs = [];
    for (const row of requisitions) if (await canSee(actor, row)) visibleReqs.push(row);
    const interviews = await store.listInterviews(JD_ORG_ID);
    const appIds = new Set(applications.map((item) => item.id));
    const related = interviews.filter((item) => appIds.has(item.applicationId));
    const clock = now();
    let outstanding = 0;
    let upcoming = 0;
    for (const interview of related) {
      if (interview.status === 'cancelled') continue;
      const feedback = await store.listFeedbackByInterview(interview.id);
      const starts = interview.startsAt ? new Date(interview.startsAt) : null;
      if (starts && starts > clock && interview.status !== 'completed') upcoming += 1;
      if (starts && starts <= clock && feedback.length === 0) outstanding += 1;
    }
    const activity = await store.listAudit(JD_ORG_ID, 12);
    return {
      openPositions: visibleReqs.filter((item) => item.status === 'published').length,
      totalApplications: applications.length,
      awaitingReview: applications.filter((item) => ['application_received', 'initial_review'].includes(item.stage)).length,
      upcomingInterviews: upcoming,
      outstandingEvaluations: outstanding,
      recentActivity: activity.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        createdAt: item.createdAt
      }))
    };
  }

  async function report(actor) {
    const applications = await visibleApplications(actor);
    const requisitions = await store.listRequisitions(JD_ORG_ID);
    const departments = await store.listDepartments(JD_ORG_ID);
    const byStage = {};
    const bySource = {};
    const byDepartment = {};
    const hireDays = [];
    for (const application of applications) {
      byStage[application.stage] = (byStage[application.stage] || 0) + 1;
      const source = application.source || 'unspecified';
      bySource[source] = (bySource[source] || 0) + 1;
      const requisition = requisitions.find((item) => item.id === application.requisitionId);
      const department = departments.find((item) => item.id === requisition?.departmentId);
      const name = department?.name || 'Unassigned';
      byDepartment[name] = (byDepartment[name] || 0) + 1;
      if (application.stage === 'hired') {
        const decisions = await store.listDecisions(application.id);
        const hire = decisions.find((item) => item.decision === 'hire');
        if (hire) {
          hireDays.push((new Date(hire.createdAt) - new Date(application.createdAt)) / 86400000);
        }
      }
    }
    return {
      applicationVolume: applications.length,
      byStage,
      bySource,
      byDepartment,
      averageDaysToFill: hireDays.length ? Math.round((hireDays.reduce((a, b) => a + b, 0) / hireDays.length) * 10) / 10 : null,
      note: 'Calculated from recorded applications.'
    };
  }

  async function downloadAttachment(actor, id) {
    const attachment = await store.getAttachment(id);
    if (!attachment || attachment.organizationId !== JD_ORG_ID) throw recruitingError(404, 'not_found', 'File not found.');
    const application = await store.getApplication(attachment.applicationId);
    const requisition = await store.getRequisition(application.requisitionId);
    if (!(await canSeeApplication(actor, application, requisition))) throw recruitingError(404, 'not_found', 'File not found.');
    await audit(actor, 'attachment_downloaded', 'attachment', id, { scanStatus: attachment.scanStatus });
    return attachment;
  }

  async function listCandidates(actor) {
    const applications = await visibleApplications(actor);
    const ids = [...new Set(applications.map((item) => item.candidateId))];
    const candidates = [];
    for (const id of ids) {
      const candidate = await store.getCandidate(id);
      if (!candidate) continue;
      candidates.push({
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        location: candidate.location,
        applicationCount: applications.filter((item) => item.candidateId === id).length
      });
    }
    return { candidates };
  }

  async function listCommunications(actor) {
    assertRole(actor, PIPELINE_EDITORS.concat(['interviewer']));
    if (actor.role === 'interviewer') return { communications: [] };
    const rows = await store.listCommunications(JD_ORG_ID);
    return {
      communications: rows.map((item) => ({
        id: item.id,
        applicationId: item.applicationId,
        templateKey: item.templateKey,
        deliveryStatus: item.deliveryStatus,
        delivered: false,
        createdAt: item.createdAt
      }))
    };
  }

  async function listRetention(actor) {
    assertRole(actor, PUBLISHERS);
    return { requests: await store.listRetention(JD_ORG_ID) };
  }

  async function completeDeletion(actor, retentionId) {
    assertRole(actor, ['platform_admin']);
    const requests = await store.listRetention(JD_ORG_ID);
    const request = requests.find((item) => item.id === retentionId);
    if (!request || request.requestType !== 'deletion') throw recruitingError(404, 'not_found', 'Deletion request not found.');
    const candidate = await store.getCandidate(request.candidateId);
    if (candidate) {
      await store.updateCandidate(candidate.id, {
        fullName: 'Redacted',
        email: `redacted-${candidate.id}@redacted.invalid`,
        phone: null,
        location: null,
        portfolioUrl: null
      });
    }
    if (request.applicationId) {
      const responses = await store.listResponses(request.applicationId);
      for (const response of responses) await store.updateResponse(response.id, { value: '[redacted]' });
      const metas = await store.listAttachmentMeta(request.applicationId);
      for (const meta of metas) {
        await store.updateAttachment(meta.id, { filename: 'redacted', body: new Uint8Array([0]), byteSize: 1 });
      }
    }
    await store.updateRetention(request.id, { status: 'completed' });
    await audit(actor, 'deletion_completed', 'retention', retentionId, {});
    return { status: 'completed' };
  }

  async function exportApplications(actor) {
    assertRole(actor, PUBLISHERS);
    const { applications } = await listApplications(actor);
    const header = ['reference', 'stage', 'job', 'department', 'type', 'name', 'email', 'source', 'submitted'];
    const lines = [header.join(',')];
    for (const item of applications) {
      lines.push(
        [item.referenceCode, item.stage, item.jobTitle, item.department, item.opportunityType, item.candidateName, item.candidateEmail, item.source, item.createdAt]
          .map(csv)
          .join(',')
      );
    }
    return lines.join('\n');
  }

  async function presentPublic(row, departments) {
    const department = departments.find((item) => item.id === row.departmentId);
    const questions = await store.listQuestions(row.id);
    const compensation =
      row.compensationPublic && (row.compensationMinCents != null || row.compensationMaxCents != null)
        ? {
            minCents: row.compensationMinCents,
            maxCents: row.compensationMaxCents,
            currency: row.compensationCurrency
          }
        : null;
    return {
      slug: row.slug,
      title: row.title,
      department: department?.name || null,
      opportunityType: row.opportunityType,
      employmentType: row.employmentType,
      workplace: row.workplace,
      location: row.location,
      summary: row.summary,
      description: row.description,
      responsibilities: row.responsibilities,
      qualifications: row.qualifications,
      learningOutcomes: row.learningOutcomes || '',
      instructions: row.instructions,
      timingStatus: row.timingStatus,
      timingNote: row.timingNote,
      supervisorLabel: row.supervisorLabel,
      durationText: row.durationText,
      scheduleText: row.scheduleText,
      unresolvedTerms: row.unresolvedTerms || [],
      compensation,
      resumeRequired: row.resumeRequired,
      questions: questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        fieldType: question.fieldType,
        required: question.required,
        options: publicOptions(question.options)
      }))
    };
  }

  async function requirePublic(slug) {
    const organization = await org();
    const rows = await store.listRequisitions(organization.id);
    const row = rows.find((item) => item.slug === slug);
    if (!row || !isPublic(row, now())) throw recruitingError(404, 'not_found', 'Opportunity not found.');
    return row;
  }

  async function applicationForCandidate(referenceCode, email) {
    const normalized = normalizeEmail(email);
    const application = await store.findApplicationByReference(String(referenceCode || '').trim());
    if (!application) throw recruitingError(404, 'not_found', 'Application not found.');
    const candidate = await store.getCandidate(application.candidateId);
    if (!candidate || candidate.email !== normalized) throw recruitingError(404, 'not_found', 'Application not found.');
    return application;
  }

  async function canSee(actor, requisition) {
    if (!actor || requisition.organizationId !== JD_ORG_ID) return false;
    if (BROAD_ACCESS.includes(actor.role)) return true;
    const members = await store.listMembers(requisition.id);
    return members.some((item) => item.clerkUserId === actor.clerkUserId);
  }

  async function canSeeApplication(actor, application, requisition) {
    if (!requisition || !(await canSee(actor, requisition))) {
      if (actor?.role !== 'interviewer') return false;
    }
    if (BROAD_ACCESS.includes(actor.role)) return true;
    if (actor.role === 'interviewer') {
      const interviews = await store.listInterviews(JD_ORG_ID);
      return interviews.some(
        (item) => item.applicationId === application.id && item.interviewerClerkUserId === actor.clerkUserId
      );
    }
    return canSee(actor, requisition);
  }

  async function visibleApplications(actor) {
    const applications = await store.listApplications(JD_ORG_ID);
    const requisitions = await store.listRequisitions(JD_ORG_ID);
    const visible = [];
    for (const application of applications) {
      const requisition = requisitions.find((item) => item.id === application.requisitionId);
      if (await canSeeApplication(actor, application, requisition)) visible.push(application);
    }
    return visible;
  }

  async function editableOpportunity(actor, id) {
    assertRole(actor, PUBLISHERS.concat(['recruiter', 'hiring_manager']));
    const row = await store.getRequisition(id);
    if (!row || !(await canSee(actor, row))) throw recruitingError(404, 'not_found', 'Opportunity not found.');
    return row;
  }

  async function requireStaffApplication(actor, id) {
    const application = await store.getApplication(id);
    if (!application) throw recruitingError(404, 'not_found', 'Application not found.');
    const requisition = await store.getRequisition(application.requisitionId);
    if (!(await canSeeApplication(actor, application, requisition))) {
      throw recruitingError(404, 'not_found', 'Application not found.');
    }
    if (actor.role === 'interviewer') throw recruitingError(403, 'forbidden', 'Not allowed.');
    return application;
  }

  async function insertOpportunityRecord(item) {
    const stamp = now().toISOString();
    return store.insertRequisition({
      id: item.id || uuid(),
      organizationId: JD_ORG_ID,
      departmentId: item.departmentId,
      teamId: null,
      slug: item.slug,
      title: item.title,
      headcount: item.headcount || 1,
      employmentType: item.employmentType,
      workplace: item.workplace,
      location: item.location || null,
      summary: item.summary || '',
      description: item.description || '',
      responsibilities: item.responsibilities || '',
      qualifications: item.qualifications || '',
      instructions: item.instructions || '',
      compensationMinCents: item.compensationMinCents ?? null,
      compensationMaxCents: item.compensationMaxCents ?? null,
      compensationCurrency: item.compensationCurrency || 'usd',
      compensationPublic: Boolean(item.compensationPublic),
      resumeRequired: Boolean(item.resumeRequired),
      opportunityType: item.opportunityType,
      timingStatus: item.timingStatus || 'to_be_determined',
      timingNote: item.timingNote || null,
      learningOutcomes: item.learningOutcomes || '',
      supervisorLabel: item.supervisorLabel || null,
      durationText: item.durationText || null,
      scheduleText: item.scheduleText || null,
      unresolvedTerms: item.unresolvedTerms || [],
      status: item.status || 'draft',
      opensOn: null,
      closesOn: null,
      pipeline: DEFAULT_PIPELINE,
      submittedBy: item.submittedBy || null,
      approvedBy: null,
      publishedBy: item.publishedBy || null,
      createdAt: stamp,
      updatedAt: stamp
    });
  }

  async function snapshot(actor, requisition) {
    const version = (await store.countPostingVersions(requisition.id)) + 1;
    const questions = await store.listQuestions(requisition.id);
    await store.insertPostingVersion({
      id: uuid(),
      requisitionId: requisition.id,
      version,
      snapshot: {
        title: requisition.title,
        summary: requisition.summary,
        opportunityType: requisition.opportunityType,
        questions: questions.map((question) => question.prompt)
      },
      createdBy: actor.clerkUserId,
      createdAt: now().toISOString()
    });
  }

  async function audit(actor, action, entityType, entityId, detail) {
    await store.insertAudit({
      id: uuid(),
      organizationId: JD_ORG_ID,
      actorId: actor?.clerkUserId || null,
      action,
      entityType,
      entityId,
      detail,
      createdAt: now().toISOString()
    });
  }

  async function validateSubmission(input, requisition) {
    const fullName = clean(input.fullName, MAX_NAME, 'name');
    const email = normalizeEmail(input.email);
    const phone = input.phone ? cleanPhone(input.phone) : null;
    const location = optionalText(input.location, MAX_SHORT);
    const portfolioUrl = input.portfolioUrl ? httpUrl(input.portfolioUrl) : null;
    const links = Array.isArray(input.links) ? input.links.slice(0, 5).map(httpUrl) : [];
    if (input.consent !== true) throw recruitingError(400, 'consent_required', 'Privacy acknowledgment is required.');
    const answers = [];
    const provided = new Map((input.answers || []).map((item) => [item.questionId, item.value]));
    const rows = await store.listQuestions(requisition.id);
    for (const question of rows) {
      const value = provided.get(question.id);
      if ((value == null || value === '' || (Array.isArray(value) && value.length === 0)) && question.required) {
        throw recruitingError(400, 'missing_answer', 'A required question is unanswered.');
      }
      if (value == null || value === '') continue;
      answers.push({
        questionId: question.id,
        prompt: question.prompt,
        value: normalizeAnswer(question, value),
        consentPurpose: consentPurpose(question.options),
        truthy: value === true || value === 'true' || value === 'yes'
      });
    }
    for (const item of input.answers || []) {
      if (!rows.some((question) => question.id === item.questionId)) {
        throw recruitingError(400, 'unknown_question', 'That question is not on this application.');
      }
    }
    let resume = null;
    if (input.resume) resume = validateResume(input.resume);
    else if (requisition.resumeRequired) throw recruitingError(400, 'resume_required', 'A résumé is required for this role.');
    const source = optionalText(input.source, 80);
    let idempotencyKey = null;
    if (input.idempotencyKey) {
      if (!/^[A-Za-z0-9_-]{8,80}$/.test(input.idempotencyKey)) {
        throw recruitingError(400, 'invalid_idempotency_key', 'Submission key is not valid.');
      }
      idempotencyKey = input.idempotencyKey;
    }
    return { fullName, email, phone, location, portfolioUrl, links, answers, resume, source, idempotencyKey };
  }
}

function confirmation(application, requisition, idempotent) {
  return {
    referenceCode: application.referenceCode,
    statusLabel: 'Received',
    jobTitle: requisition?.title || '',
    submittedAt: application.createdAt,
    idempotent,
    delivery: 'not_configured',
    message:
      'Your application has been received and will be available for review as we develop our teams. Save this reference. Email delivery is not configured, so this screen is the confirmation.'
  };
}

function isPublic(row, clock) {
  if (!row || row.status !== 'published') return false;
  const today = clock.toISOString().slice(0, 10);
  if (row.opensOn && String(row.opensOn).slice(0, 10) > today) return false;
  if (row.closesOn && String(row.closesOn).slice(0, 10) < today) return false;
  return true;
}

function questionRow(requisitionId, question, index, uuid) {
  return {
    id: uuid(),
    requisitionId,
    prompt: question.prompt,
    fieldType: question.fieldType,
    required: Boolean(question.required),
    options: question.options || (question.consentPurpose ? { consentPurpose: question.consentPurpose } : null),
    position: index
  };
}

async function writeContacts(tx, candidate, parsed, stamp) {
  const entries = [
    ['email', parsed.email],
    ['phone', parsed.phone],
    ['location', parsed.location],
    ['portfolio', parsed.portfolioUrl]
  ];
  for (const [kind, value] of entries) {
    if (!value) continue;
    await tx.insertContact({ id: randomUUID(), candidateId: candidate.id, kind, value, createdAt: stamp });
  }
  for (const link of parsed.links || []) {
    await tx.insertContact({ id: randomUUID(), candidateId: candidate.id, kind: 'link', value: link, createdAt: stamp });
  }
}

function validateResume(resume) {
  const contentType = FILE_TYPES[resume.contentType] ? resume.contentType : null;
  if (!contentType) throw recruitingError(400, 'resume_type', 'Upload a PDF or Word résumé.');
  const bytes = decodeBase64(resume.dataBase64);
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_RESUME_BYTES) {
    throw recruitingError(400, 'resume_size', 'Résumé must be a file under 2 MB.');
  }
  if (!magicOk(bytes, contentType)) throw recruitingError(400, 'resume_type', 'The file contents do not match its type.');
  const filename = basename(String(resume.filename || 'resume')).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'resume';
  return { filename, contentType, bytes };
}

function magicOk(bytes, contentType) {
  if (contentType === 'application/pdf') return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (contentType === 'application/msword') return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  return false;
}

function decodeBase64(value) {
  try {
    const buffer = Buffer.from(String(value || ''), 'base64');
    return new Uint8Array(buffer);
  } catch {
    throw recruitingError(400, 'resume_type', 'The résumé could not be read.');
  }
}

function normalizeAnswer(question, value) {
  assertNoSensitive(value);
  if (question.fieldType === 'boolean') return value === true || value === 'true' || value === 'yes' ? 'yes' : 'no';
  if (question.fieldType === 'multi_select') {
    const values = Array.isArray(value) ? value.map(String) : [String(value)];
    const allowed = publicOptions(question.options) || [];
    if (values.some((item) => !allowed.includes(item))) throw recruitingError(400, 'invalid_answer', 'Choose a listed option.');
    return values.join(', ');
  }
  if (question.fieldType === 'single_select') {
    const allowed = publicOptions(question.options) || [];
    if (!allowed.includes(String(value))) throw recruitingError(400, 'invalid_answer', 'Choose a listed option.');
  }
  const text = clean(value, question.fieldType === 'longtext' ? MAX_LONG : MAX_SHORT, 'answer');
  return text;
}

function publicOptions(options) {
  if (Array.isArray(options)) return options;
  if (options && Array.isArray(options.values)) return options.values;
  return null;
}

function consentPurpose(options) {
  if (options && typeof options === 'object' && !Array.isArray(options)) return options.consentPurpose || null;
  return null;
}

function normalizeOptions(fieldType, options) {
  if (fieldType === 'single_select' || fieldType === 'multi_select') {
    if (!Array.isArray(options) || options.length === 0) throw recruitingError(400, 'invalid_question', 'Select questions need options.');
    return options.map((item) => clean(item, MAX_SHORT, 'option'));
  }
  return null;
}

function assertNoSensitive(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  if (SSN.test(text)) throw recruitingError(400, 'sensitive_data', 'Do not include a Social Security number.');
  if (/\b(ssn|social security|bank account|routing number)\b/i.test(text)) {
    throw recruitingError(400, 'sensitive_data', 'Do not include government or banking identifiers.');
  }
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    throw recruitingError(400, 'invalid_email', 'Enter a valid email address.');
  }
  return email;
}

function clean(value, max, label) {
  const text = String(value ?? '').trim();
  if (!text) throw recruitingError(400, 'invalid_field', `Enter a ${label}.`);
  if (text.length > max) throw recruitingError(400, 'invalid_field', `${label} is too long.`);
  assertNoSensitive(text);
  return text;
}

function optionalText(value, max) {
  if (value == null || String(value).trim() === '') return null;
  return clean(value, max, 'field');
}

function cleanPhone(value) {
  const phone = clean(value, 40, 'phone');
  if (!/^[+0-9().\-\s]{7,40}$/.test(phone)) throw recruitingError(400, 'invalid_phone', 'Enter a valid phone number.');
  return phone;
}

function httpUrl(value) {
  const url = clean(value, 400, 'link');
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw recruitingError(400, 'invalid_url', 'Enter a full http or https link.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw recruitingError(400, 'invalid_url', 'Enter a full http or https link.');
  return url;
}

function enumValue(value, allowed, label) {
  if (!allowed.includes(value)) throw recruitingError(400, 'invalid_field', `Unknown ${label}.`);
  return value;
}

function centsOrNull(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw recruitingError(400, 'invalid_compensation', 'Compensation must be a whole number of cents.');
  return number;
}

function slugify(title, id) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  return `${base || 'role'}-${String(id).slice(0, 8)}`;
}

function makeReference() {
  const bytes = randomBytes(8);
  let out = 'JDP-';
  for (let i = 0; i < 8; i += 1) out += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  return out;
}

function hashIp(ip) {
  return createHash('sha256').update(`jdp-recruiting-v1:${ip || 'unknown'}`).digest('hex');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function csv(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function withDepartment(row, departments) {
  const department = departments.find((item) => item.id === row.departmentId);
  return { ...sanitizeOpportunity(row), departmentName: department?.name || null };
}

function sanitizeOpportunity(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    departmentId: row.departmentId,
    opportunityType: row.opportunityType,
    employmentType: row.employmentType,
    workplace: row.workplace,
    location: row.location,
    status: row.status,
    summary: row.summary,
    timingStatus: row.timingStatus,
    timingNote: row.timingNote,
    unresolvedTerms: row.unresolvedTerms || [],
    compensationPublic: row.compensationPublic,
    compensationMinCents: row.compensationMinCents,
    compensationMaxCents: row.compensationMaxCents,
    publishedBy: row.publishedBy || null
  };
}
