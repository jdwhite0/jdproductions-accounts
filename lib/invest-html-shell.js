/**
 * Host-aware HTML shell for crawlers.
 *
 * Vercel serves a real `index.html` for `/` before `vercel.json` rewrites.
 * Invest hosts must get `invest.html` (Early Support OG/SEO) instead.
 * Middleware uses this; keep it free of Node-only APIs.
 */

import { isInvestHost } from "../src/utils/invest-host.js";

export const INVEST_HTML_SHELL = "/invest.html";
/** Built from Vite `index.html` then renamed so `/` is not a filesystem hit. */
export const ACCOUNTS_HTML_SHELL = "/accounts.html";

function lastPathSegment(pathname) {
  const trimmed = String(pathname || "/").split("?")[0];
  const parts = trimmed.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

/** Static files (jpg, js, css, png) must not be rewritten to the HTML shell. */
export function isStaticAssetPath(pathname) {
  const file = lastPathSegment(pathname);
  if (!file || !file.includes(".")) return false;
  return !file.endsWith(".html");
}

export function shouldRewriteToInvestShell({ hostname, pathname }) {
  if (!isInvestHost(hostname)) return false;
  const path = pathname || "/";
  if (path.startsWith("/api/")) return false;
  if (path === INVEST_HTML_SHELL) return false;
  if (isStaticAssetPath(path)) return false;
  return true;
}

export function htmlShellForHost(hostname) {
  return isInvestHost(hostname) ? INVEST_HTML_SHELL : ACCOUNTS_HTML_SHELL;
}
