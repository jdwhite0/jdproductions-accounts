/**
 * Accounts is a Clerk satellite of the ACCESS primary (getaccess.world).
 * After sign-in / sign-up on the primary, Clerk returns here with the session.
 * `nextPath` must already be allowlisted (see safeNextPath).
 */
export function satelliteReturnUrl(origin, nextPath) {
  const path =
    typeof nextPath === "string" && nextPath.startsWith("/")
      ? nextPath
      : "/dashboard";
  if (typeof origin !== "string" || origin.length === 0) return path;
  try {
    return new URL(path, origin).href;
  } catch {
    return path;
  }
}
