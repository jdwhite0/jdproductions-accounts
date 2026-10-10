import { createClerkClient } from '@clerk/backend';
import { requireClerkUserId } from '../../lib/clerk-auth.js';
import { createRecruitingHttpHandler } from '../../lib/recruiting/http.js';
import { actorFromMetadata } from '../../lib/recruiting/roles.js';
import { getSql } from '../../db/client.js';
import { ensureRecruitingSchema } from '../../lib/recruiting/ensure-schema.js';
import { createPostgresRecruitingStore } from '../../lib/recruiting/postgres-store.js';
import { createRecruitingService } from '../../lib/recruiting/service.js';

const handle = createRecruitingHttpHandler({
  getService: async () => {
    const sql = getSql();
    await ensureRecruitingSchema(sql);
    return createRecruitingService(createPostgresRecruitingStore(sql));
  },
  loadActor: async (request) => {
    const clerkUserId = await requireClerkUserId(request);
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      const err = new Error('CLERK_SECRET_KEY is not set');
      err.status = 503;
      err.code = 'auth_not_configured';
      throw err;
    }
    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(clerkUserId);
    return actorFromMetadata(clerkUserId, user.publicMetadata);
  }
});

export function GET(request) {
  return handle(request);
}
export function POST(request) {
  return handle(request);
}
export function OPTIONS(request) {
  return handle(request);
}
