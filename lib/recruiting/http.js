import { recruitingError } from './errors.js';

const STATIC_ORIGINS = new Set([
  'https://jdproductions.io',
  'https://www.jdproductions.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

export function createRecruitingHttpHandler({ getService, loadActor }) {
  return async function handle(request) {
    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/api\/recruiting\/?/, '').replace(/\/$/, '');
      const service = await getService();
      if (path === 'health' && request.method === 'GET') {
        await service.ensureCatalog();
        return json(request, 200, { ok: true, service: 'jd-recruiting' });
      }
      if (path === 'jobs' && request.method === 'GET') return json(request, 200, await service.listPublished());
      const job = path.match(/^jobs\/([^/]+)$/);
      if (job && request.method === 'GET') return json(request, 200, await service.getPublished(decodeURIComponent(job[1])));
      if (path === 'applications' && request.method === 'POST') {
        const body = await readJson(request);
        body.idempotencyKey = body.idempotencyKey || header(request, 'idempotency-key');
        const result = await service.submitApplication(body, { ip: clientIp(request) });
        return json(request, 201, result);
      }
      if (path === 'applications/status' && request.method === 'POST') {
        return json(request, 200, await service.applicationStatus(await readJson(request)));
      }
      if (path === 'applications/withdraw' && request.method === 'POST') {
        return json(request, 200, await service.withdrawApplication(await readJson(request)));
      }
      if (path === 'privacy' && request.method === 'POST') {
        return json(request, 202, await service.privacyRequest(await readJson(request)));
      }
      if (path.startsWith('admin')) return await admin(request, service, path, loadActor);
      return json(request, 404, { error: 'not_found' });
    } catch (err) {
      const status = Number(err?.status) || 500;
      if (status >= 500) console.error(err?.code || 'recruiting_error');
      return json(request, status, {
        error: err?.code || 'internal_error',
        message: status >= 500 ? 'Server error' : err.message
      });
    }
  };

  async function admin(request, service, path, loadActorFn) {
    const actor = await loadActorFn(request);
    if (path === 'admin/overview' && request.method === 'GET') return json(request, 200, await service.overview(actor));
    if (path === 'admin/reports' && request.method === 'GET') return json(request, 200, await service.report(actor));
    if (path === 'admin/opportunities' && request.method === 'GET') return json(request, 200, await service.listOpportunities(actor));
    if (path === 'admin/opportunities' && request.method === 'POST') {
      return json(request, 201, await service.createOpportunity(actor, await readJson(request)));
    }
    const opportunity = path.match(/^admin\/opportunities\/([^/]+)$/);
    if (opportunity && request.method === 'GET') {
      return json(request, 200, await service.getOpportunity(actor, opportunity[1]));
    }
    if (opportunity && request.method === 'POST') {
      return json(request, 200, await service.updateOpportunity(actor, opportunity[1], await readJson(request)));
    }
    const transition = path.match(/^admin\/opportunities\/([^/]+)\/status$/);
    if (transition && request.method === 'POST') {
      const body = await readJson(request);
      return json(request, 200, await service.transitionOpportunity(actor, transition[1], body.status));
    }
    const question = path.match(/^admin\/opportunities\/([^/]+)\/questions$/);
    if (question && request.method === 'POST') {
      return json(request, 201, await service.addQuestion(actor, question[1], await readJson(request)));
    }
    const member = path.match(/^admin\/opportunities\/([^/]+)\/members$/);
    if (member && request.method === 'POST') {
      return json(request, 200, await service.assignMember(actor, member[1], await readJson(request)));
    }
    if (path === 'admin/applications' && request.method === 'GET') {
      return json(request, 200, await service.listApplications(actor));
    }
    const application = path.match(/^admin\/applications\/([^/]+)$/);
    if (application && request.method === 'GET') return json(request, 200, await service.getApplication(actor, application[1]));
    const stage = path.match(/^admin\/applications\/([^/]+)\/stage$/);
    if (stage && request.method === 'POST') {
      const body = await readJson(request);
      return json(request, 200, await service.moveStage(actor, stage[1], body.stage));
    }
    const note = path.match(/^admin\/applications\/([^/]+)\/notes$/);
    if (note && request.method === 'POST') {
      const body = await readJson(request);
      return json(request, 201, await service.addNote(actor, note[1], body.body));
    }
    const interview = path.match(/^admin\/applications\/([^/]+)\/interviews$/);
    if (interview && request.method === 'POST') {
      return json(request, 201, await service.scheduleInterview(actor, interview[1], await readJson(request)));
    }
    const message = path.match(/^admin\/applications\/([^/]+)\/communications$/);
    if (message && request.method === 'POST') {
      return json(request, 201, await service.recordCommunication(actor, message[1], await readJson(request)));
    }
    const decision = path.match(/^admin\/applications\/([^/]+)\/decisions$/);
    if (decision && request.method === 'POST') {
      const body = await readJson(request);
      return json(request, 200, await service.recordDecision(actor, decision[1], body.decision));
    }
    const offer = path.match(/^admin\/applications\/([^/]+)\/offers$/);
    if (offer && request.method === 'POST') {
      return json(request, 201, await service.createOffer(actor, offer[1], await readJson(request)));
    }
    const feedback = path.match(/^admin\/interviews\/([^/]+)\/feedback$/);
    if (feedback && request.method === 'POST') {
      return json(request, 201, await service.submitFeedback(actor, feedback[1], await readJson(request)));
    }
    if (path === 'admin/candidates' && request.method === 'GET') return json(request, 200, await service.listCandidates(actor));
    if (path === 'admin/communications' && request.method === 'GET') return json(request, 200, await service.listCommunications(actor));
    if (path === 'admin/retention' && request.method === 'GET') return json(request, 200, await service.listRetention(actor));
    const deletion = path.match(/^admin\/retention\/([^/]+)\/complete$/);
    if (deletion && request.method === 'POST') {
      return json(request, 200, await service.completeDeletion(actor, deletion[1]));
    }
    const file = path.match(/^admin\/attachments\/([^/]+)$/);
    if (file && request.method === 'GET') {
      const attachment = await service.downloadAttachment(actor, file[1]);
      const headers = {
        ...corsHeaders(request),
        'content-type': attachment.contentType,
        'content-disposition': `attachment; filename="${attachment.filename}"`,
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        'x-scan-status': attachment.scanStatus || 'unscanned'
      };
      return new Response(attachment.body, { status: 200, headers });
    }
    if (path === 'admin/export' && request.method === 'GET') {
      const csv = await service.exportApplications(actor);
      return new Response(csv, {
        status: 200,
        headers: {
          ...corsHeaders(request),
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="recruiting-applications.csv"',
          'cache-control': 'no-store'
        }
      });
    }
    return json(request, 404, { error: 'not_found' });
  }
}

function json(request, status, body) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders(request), 'cache-control': 'no-store' }
  });
}

export function corsHeaders(request) {
  const origin = header(request, 'origin');
  if (!origin || !allowedOrigin(origin)) return { vary: 'Origin' };
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, Idempotency-Key',
    vary: 'Origin'
  };
}

function allowedOrigin(origin) {
  if (STATIC_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && /^jdproductions-website.*\.vercel\.app$/.test(url.hostname);
  } catch {
    return false;
  }
}

async function readJson(request) {
  const raw = await request.text();
  if (raw.length > 4_000_000) throw recruitingError(413, 'payload_too_large', 'The submission is too large.');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw recruitingError(400, 'invalid_json', 'The request could not be read.');
  }
}

function header(request, name) {
  if (typeof request.headers?.get === 'function') return request.headers.get(name);
  const headers = request.headers || {};
  return headers[name] || headers[name.toLowerCase()] || null;
}

function clientIp(request) {
  const forwarded = header(request, 'x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
