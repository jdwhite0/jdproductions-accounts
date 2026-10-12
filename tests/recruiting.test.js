import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createRecruitingHttpHandler } from '../lib/recruiting/http.js';
import { createMemoryRecruitingStore } from '../lib/recruiting/memory-store.js';
import { JD_ORG_ID } from '../lib/recruiting/constants.js';
import { createRecruitingService } from '../lib/recruiting/service.js';

const founder = { clerkUserId: 'user_founder', role: 'platform_admin' };
const recruiter = { clerkUserId: 'user_recruiter', role: 'recruiter' };
const interviewer = { clerkUserId: 'user_interviewer', role: 'interviewer' };

function service() {
  return createRecruitingService(createMemoryRecruitingStore());
}

function pdf() {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF').toString('base64');
}

async function publishedInternship(svc) {
  const { jobs } = await svc.listPublished();
  return jobs.find((job) => job.slug === 'software-engineering-ai-systems-intern');
}

test('catalog publishes 15 approved opportunities and the separate general application without invented compensation', async () => {
  const svc = service();
  const { jobs } = await svc.listPublished();
  assert.equal(jobs.filter((job) => job.opportunityType === 'internship').length, 8);
  assert.equal(jobs.filter((job) => job.opportunityType === 'upcoming').length, 1);
  assert.equal(jobs.filter((job) => job.opportunityType === 'talent_community').length, 1);
  assert.equal(jobs.filter((job) => job.opportunityType === 'active').length, 6);
  assert.equal(jobs.every((job) => job.compensation == null), true);
  const upcoming = jobs.find((job) => job.slug === 'research-testing-lead');
  assert.match(upcoming.timingNote, /hiring timetable.*not been confirmed/);
  assert.equal(jobs.some((job) => /\$\d/.test(JSON.stringify(job))), false);
});

test('draft opportunities stay off the public list and a founder can publish without a budget', async () => {
  const svc = service();
  const created = await svc.createOpportunity(founder, {
    title: 'Signals Research Intern',
    departmentName: 'Advanced Industries & Research',
    opportunityType: 'internship',
    employmentType: 'internship',
    summary: 'A draft internship.',
    description: 'Not public yet.'
  });
  assert.equal(created.status, 'draft');
  const before = await svc.listPublished();
  assert.equal(before.jobs.some((job) => job.slug === created.slug), false);
  const published = await svc.transitionOpportunity(founder, created.id, 'published');
  assert.equal(published.status, 'published');
  const after = await svc.listPublished();
  assert.equal(after.jobs.some((job) => job.slug === created.slug), true);
  assert.equal(after.jobs.find((job) => job.slug === created.slug).compensation, null);
});

test('a recruiter cannot publish', async () => {
  const svc = service();
  const created = await svc.createOpportunity(recruiter, {
    title: 'Recruiter draft',
    opportunityType: 'upcoming',
    summary: 'Draft'
  });
  await assert.rejects(() => svc.transitionOpportunity(recruiter, created.id, 'published'), (err) => err.status === 403);
});

test('applications persist, reject bad files, and confirm only after save', async () => {
  const svc = service();
  const job = await publishedInternship(svc);
  await assert.rejects(
    () =>
      svc.submitApplication({
        slug: job.slug,
        fullName: 'Ada Candidate',
        email: 'ada@example.com',
        consent: true,
        resume: { filename: 'notes.txt', contentType: 'text/plain', dataBase64: Buffer.from('hello').toString('base64') }
      }),
    (err) => err.code === 'resume_type'
  );
  assert.equal((await svc.listApplications(founder)).applications.length, 0);

  await assert.rejects(
    () =>
      svc.submitApplication({
        slug: job.slug,
        fullName: 'Ada Candidate',
        email: 'ada@example.com',
        consent: true,
        answers: [],
        location: 'SSN 123-45-6789'
      }),
    (err) => err.code === 'sensitive_data'
  );

  const saved = await svc.submitApplication(
    {
      slug: job.slug,
      fullName: 'Ada Candidate',
      email: 'Ada@Example.com',
      consent: true,
      phone: '813-555-0100',
      portfolioUrl: 'https://example.com/ada',
      source: 'jdproductions.io',
      idempotencyKey: 'ada-submit-0001',
      resume: { filename: 'Ada Resume.pdf', contentType: 'application/pdf', dataBase64: pdf() }
    },
    { ip: '203.0.113.10' }
  );
  assert.match(saved.referenceCode, /^JDP-/);
  assert.equal(saved.idempotent, false);
  assert.equal(saved.delivery, 'not_configured');
  assert.equal((await svc.listApplications(founder)).applications.length, 1);

  const again = await svc.submitApplication({
    slug: job.slug,
    fullName: 'Ada Candidate',
    email: 'ada@example.com',
    consent: true,
    idempotencyKey: 'ada-submit-0001'
  });
  assert.equal(again.idempotent, true);
  assert.equal(again.referenceCode, saved.referenceCode);
  assert.equal((await svc.listApplications(founder)).applications.length, 1);

  await assert.rejects(
    () =>
      svc.submitApplication({
        slug: job.slug,
        fullName: 'Ada Candidate',
        email: 'ada@example.com',
        consent: true
      }),
    (err) => err.code === 'duplicate_application'
  );
});

test('candidate status hides internal stage names and other people', async () => {
  const svc = service();
  const job = await publishedInternship(svc);
  const saved = await svc.submitApplication({
    slug: job.slug,
    fullName: 'Grace Hopper',
    email: 'grace@example.com',
    consent: true
  });
  const status = await svc.applicationStatus({ referenceCode: saved.referenceCode, email: 'grace@example.com' });
  assert.equal(status.statusLabel, 'Received');
  assert.equal(status.stage, undefined);
  await assert.rejects(
    () => svc.applicationStatus({ referenceCode: saved.referenceCode, email: 'other@example.com' }),
    (err) => err.status === 404
  );
});

test('founder reviews an application, changes stage, and pause keeps history', async () => {
  const svc = service();
  const job = await publishedInternship(svc);
  const saved = await svc.submitApplication({
    slug: job.slug,
    fullName: 'Grace Hopper',
    email: 'grace@example.com',
    consent: true
  });
  const { applications } = await svc.listApplications(founder);
  const application = applications.find((item) => item.referenceCode === saved.referenceCode);
  const moved = await svc.moveStage(founder, application.id, 'screening');
  assert.equal(moved.stage, 'screening');
  const detail = await svc.getApplication(founder, application.id);
  assert.equal(detail.notes.length, 0);
  await svc.addNote(founder, application.id, 'Portfolio looks relevant.');
  const withNote = await svc.getApplication(founder, application.id);
  assert.equal(withNote.notes.length, 1);
  const opportunity = (await svc.listOpportunities(founder)).opportunities.find((item) => item.slug === job.slug);
  await svc.transitionOpportunity(founder, opportunity.id, 'paused');
  const { jobs } = await svc.listPublished();
  assert.equal(jobs.some((item) => item.slug === job.slug), false);
  const still = await svc.getApplication(founder, application.id);
  assert.equal(still.candidate.email, 'grace@example.com');
  const overview = await svc.overview(founder);
  assert.ok(overview.totalApplications >= 1);
  const report = await svc.report(founder);
  assert.equal(report.applicationVolume, overview.totalApplications);
  assert.equal(report.averageDaysToFill, null);
});

test('an interviewer only sees an assigned interview', async () => {
  const svc = service();
  const job = await publishedInternship(svc);
  const saved = await svc.submitApplication({
    slug: job.slug,
    fullName: 'Katherine Johnson',
    email: 'katherine@example.com',
    consent: true
  });
  const { applications } = await svc.listApplications(founder);
  const application = applications.find((item) => item.referenceCode === saved.referenceCode);
  assert.equal((await svc.listApplications(interviewer)).applications.length, 0);
  const interview = await svc.scheduleInterview(founder, application.id, {
    interviewerClerkUserId: interviewer.clerkUserId,
    startsAt: '2026-11-02T15:00:00.000Z'
  });
  assert.equal(interview.schedulingMode, 'manual');
  const visible = await svc.getApplication(interviewer, application.id);
  assert.equal(visible.notes.length, 0);
  assert.equal(visible.offers.length, 0);
  await svc.submitFeedback(interviewer, interview.id, { body: 'Clear written answers.', recommendation: 'advance' });
  await assert.rejects(() => svc.moveStage(interviewer, application.id, 'interview'), (err) => err.status === 403);
});

test('withdrawal and the talent community store real answers', async () => {
  const svc = service();
  const { jobs } = await svc.listPublished();
  const general = jobs.find((job) => job.slug === 'general-application');
  const interest = general.questions.find((question) => question.prompt === 'Areas of interest');
  await assert.rejects(
    () =>
      svc.submitApplication({
        slug: general.slug,
        fullName: 'Test Person',
        email: 'talent@example.com',
        consent: true
      }),
    (err) => err.code === 'missing_answer'
  );
  const saved = await svc.submitApplication({
    slug: general.slug,
    fullName: 'Test Person',
    email: 'talent@example.com',
    consent: true,
    answers: [{ questionId: interest.id, value: ['Advanced Industries', 'Research'] }]
  });
  const withdrawn = await svc.withdrawApplication({ referenceCode: saved.referenceCode, email: 'talent@example.com' });
  assert.equal(withdrawn.statusLabel, 'Withdrawn');
});

test('http enforces auth and browser origins', async () => {
  const svc = service();
  const handler = createRecruitingHttpHandler({
    getService: async () => svc,
    loadActor: async (request) => {
      const auth = request.headers.get('authorization');
      if (!auth) {
        const err = new Error('Missing bearer token');
        err.status = 401;
        err.code = 'unauthorized';
        throw err;
      }
      return founder;
    }
  });
  const jobs = await handler(new Request('https://accounts.jdproductions.io/api/recruiting/jobs', { headers: { origin: 'https://jdproductions.io' } }));
  assert.equal(jobs.status, 200);
  assert.equal(jobs.headers.get('access-control-allow-origin'), 'https://jdproductions.io');
  const body = await jobs.json();
  assert.ok(body.jobs.length >= 11);
  const denied = await handler(new Request('https://accounts.jdproductions.io/api/recruiting/admin/overview'));
  assert.equal(denied.status, 401);
  const evil = await handler(
    new Request('https://accounts.jdproductions.io/api/recruiting/jobs', { headers: { origin: 'https://evil.example' } })
  );
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
});

test('migration does not alter the early-support ledger', () => {
  const sql = readFileSync(new URL('../db/migrations/0003_recruiting.sql', import.meta.url), 'utf8');
  assert.match(sql, /opportunity_type/);
  assert.match(sql, /recruiting_applications/);
  assert.doesNotMatch(sql, /ALTER TABLE (instruments|positions|ledger_entries)/);
  assert.doesNotMatch(sql, /funding_status/);
});

test('catalog expansion preserves role identities, question IDs, application history and later editor changes', async () => {
  const store = createMemoryRecruitingStore();
  const svc = createRecruitingService(store);
  const role = await svc.getPublished('operations-venture-development-intern');
  const row = (await svc.listOpportunities(founder)).opportunities.find(item => item.slug === role.slug);
  assert.equal(row.id, '00000000-0000-4000-8000-000000000203');
  const questionIds = role.questions.map(item => item.id);
  const application = await svc.submitApplication({ slug: role.slug, fullName: 'Historic Candidate', email: 'history@example.com', consent: true });
  await svc.updateOpportunity(founder, row.id, { summary: 'A later approved editor change.' });
  await svc.ensureCatalog();
  const retained = await svc.getPublished(role.slug);
  assert.equal(retained.summary, 'A later approved editor change.');
  assert.deepEqual(retained.questions.map(item => item.id), questionIds);
  assert.equal((await svc.listApplications(founder)).applications[0].referenceCode, application.referenceCode);
  assert.equal((await svc.listPublished()).jobs.length, 16);
  const revisions = (await store.listAudit(JD_ORG_ID, 100)).filter(item => item.action === 'careers_scope_2026_10_12');
  assert.equal(revisions.length, 3);
});

test('public application endpoint accepts the actual general application form payload and never exposes collections', async () => {
  const svc = service();
  const job = await svc.getPublished('general-application');
  const interest = job.questions.find(item => item.prompt === 'Areas of interest');
  const handler = createRecruitingHttpHandler({ getService: async () => svc, loadActor: async () => { throw Object.assign(new Error('Unauthorized'), { status: 401 }); } });
  const payload = { slug: job.slug, fullName: 'Jerry White — WEBSITE QA TEST', email: 'fixture@example.com',
    phone: null, location: null, portfolioUrl: null, links: [], consent: true, source: 'jdproductions.io',
    idempotencyKey: 'web-general-application-fixture-20261012',
    answers: [{ questionId: interest.id, value: ['Other'] }] };
  const request = () => new Request('https://accounts.jdproductions.io/api/recruiting/applications', {
    method: 'POST', headers: { origin: 'https://jdproductions.io', 'content-type': 'application/json' }, body: JSON.stringify(payload)
  });
  const response = await handler(request());
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.match(saved.referenceCode, /^JDP-/);
  assert.equal(saved.delivery, 'not_configured');
  assert.equal((await (await handler(request())).json()).referenceCode, saved.referenceCode);
  assert.equal((await svc.listApplications(founder)).applications.length, 1);
  const collection = await handler(new Request('https://accounts.jdproductions.io/api/recruiting/applications'));
  assert.equal(collection.status, 404);
});

test('every public route has an explicit Vercel function entry', () => {
  for (const route of ['applications', 'jobs', 'health', 'privacy']) {
    const source = readFileSync(new URL(`../api/recruiting/${route}.js`, import.meta.url), 'utf8');
    assert.match(source, /export \{ GET, POST, OPTIONS \} from '\.\/\[\.\.\.path\]\.js'/);
  }
});

test('deployment includes approved role data and recruiting migration for every recruiting function', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  for (const pattern of ['api/recruiting/[...path].js', 'api/recruiting/**/*.js']) {
    assert.equal(config.functions[pattern].includeFiles, '{db/migrations/0003_recruiting.sql,lib/recruiting/scope-roles.json}');
  }
  assert.equal(JSON.parse(readFileSync(new URL('../lib/recruiting/scope-roles.json', import.meta.url), 'utf8')).length, 8);
});
