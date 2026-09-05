/**
 * invest.jdproductions.io is the same Vercel project as accounts., but `/`
 * must open Early Support — never ProtectedAdmin /dashboard.
 *
 * DNS (Google Domains) still required:
 *   invest  CNAME  ba5acd7daa29209d.vercel-dns-017.com
 */

export const INVEST_HOSTS = Object.freeze([
  "invest.jdproductions.io",
  "www.invest.jdproductions.io",
]);

export function normalizeHostname(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase()
    .split(":")[0]
    .replace(/\.$/, "");
}

export function isInvestHost(hostname) {
  const host =
    hostname === undefined
      ? typeof window !== "undefined"
        ? window.location.hostname
        : ""
      : hostname;
  return INVEST_HOSTS.includes(normalizeHostname(host));
}

/** Where `/` should land for this Host. */
export function rootIntentForHost(hostname) {
  return isInvestHost(hostname) ? "early-support" : "dashboard";
}

/** `/invest` is not its own page — send it to the Early Support landing. */
export function investPathDestination(hostname) {
  return isInvestHost(hostname) ? "/" : "/early-support";
}
