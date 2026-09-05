import { mintSignInTokenForUser, requireClerkUserId } from '../../lib/clerk-auth.js';
import { json, methodNotAllowed, errorResponse } from '../../lib/http.js';

/**
 * POST /api/auth/sign-in-token
 * Mint a short-lived Clerk ticket for the Bearer session's user so invest.*
 * can setActive on this origin. Fail closed. Never log the token.
 */
export async function POST(request) {
  try {
    const clerkUserId = await requireClerkUserId(request);
    const ticket = await mintSignInTokenForUser(clerkUserId);
    return json(200, { ticket });
  } catch (err) {
    return errorResponse(err);
  }
}

export function GET() {
  return methodNotAllowed();
}
