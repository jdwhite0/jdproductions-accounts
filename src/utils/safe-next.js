export function safeNextPath(value, fallback = "/dashboard") {
  if (typeof value !== "string") return fallback;
  const allowed = new Set([
    "/positions",
    "/dashboard",
    "/early-support",
    "/early-support/success",
  ]);
  return allowed.has(value) ? value : fallback;
}
