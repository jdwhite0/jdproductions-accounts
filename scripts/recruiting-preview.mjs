/**
 * In-memory recruiting API for local careers testing.
 * Bearer founder is a platform admin. Nothing here writes to production.
 */
import { createServer } from "node:http";
import { createMemoryRecruitingStore } from "../lib/recruiting/memory-store.js";
import { createRecruitingService } from "../lib/recruiting/service.js";
import { createRecruitingHttpHandler } from "../lib/recruiting/http.js";
import { recruitingError } from "../lib/recruiting/errors.js";

const service = createRecruitingService(createMemoryRecruitingStore());
const handle = createRecruitingHttpHandler({
  getService: async () => service,
  loadActor: async (request) => {
    const auth = request.headers.get("authorization") || "";
    if (auth === "Bearer founder") return { clerkUserId: "founder_local", role: "platform_admin" };
    if (!auth.startsWith("Bearer ")) throw recruitingError(401, "unauthorized", "Sign in required.");
    throw recruitingError(403, "forbidden", "Recruiting access is limited to authorized JD personnel.");
  },
});

const port = Number(process.env.PORT || 8787);
createServer(async (incoming, outgoing) => {
  const chunks = [];
  for await (const chunk of incoming) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const request = new Request(`http://127.0.0.1:${port}${incoming.url}`, {
    method: incoming.method,
    headers: incoming.headers,
    body: incoming.method === "GET" || incoming.method === "HEAD" ? undefined : body,
  });
  const response = await handle(request);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, "127.0.0.1", () => {
  console.log(`Recruiting preview http://127.0.0.1:${port}/api/recruiting/health`);
});
