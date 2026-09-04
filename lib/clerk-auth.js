import { createClerkClient, verifyToken } from '@clerk/backend';
import { normalizeEmail } from './early-support/email.js';

/**
 * Resolve the signed-in Clerk user id from an Authorization: Bearer <session token>.
 * Fail closed if CLERK_SECRET_KEY is missing or the token is invalid.
 * Does not configure Clerk — consume-only (AGENTS.md §2.1).
 */
export async function requireClerkUserId(request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    const err = new Error('CLERK_SECRET_KEY is not set');
    err.status = 503;
    err.code = 'auth_not_configured';
    throw err;
  }

  const header = headerValue(request, 'authorization');
  const token = header?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const err = new Error('Missing bearer token');
    err.status = 401;
    err.code = 'unauthorized';
    throw err;
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    if (!payload?.sub) {
      const err = new Error('Invalid session');
      err.status = 401;
      err.code = 'unauthorized';
      throw err;
    }
    return payload.sub;
  } catch (cause) {
    if (cause?.status) throw cause;
    const err = new Error('Invalid session');
    err.status = 401;
    err.code = 'unauthorized';
    err.cause = cause;
    throw err;
  }
}

/**
 * Guest-capable: return Clerk user id when a Bearer token is present and valid.
 * No Authorization header → null (guest). Invalid token still fails closed.
 */
export async function optionalClerkUserId(request) {
  const header = headerValue(request, 'authorization');
  const token = header?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  return requireClerkUserId(request);
}

export async function getVerifiedEmailsForUser(clerkUserId) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    const err = new Error('CLERK_SECRET_KEY is not set');
    err.status = 503;
    err.code = 'auth_not_configured';
    throw err;
  }
  const clerk = createClerkClient({ secretKey });
  const user = await clerk.users.getUser(clerkUserId);
  const emails = [];
  for (const addr of user.emailAddresses || []) {
    if (addr.verification?.status === 'verified' && addr.emailAddress) {
      emails.push(normalizeEmail(addr.emailAddress));
    }
  }
  return [...new Set(emails)];
}

function headerValue(request, name) {
  if (typeof request.headers?.get === 'function') {
    return request.headers.get(name);
  }
  const headers = request.headers || {};
  return headers[name] || headers[name.toLowerCase()] || headers.Authorization;
}
