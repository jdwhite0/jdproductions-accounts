/**
 * Runs before Vercel filesystem + cache. Host rewrites in vercel.json never
 * apply to `/` while `index.html` exists, so crawlers were getting Accounts
 * meta on invest.jdproductions.io.
 */

import { next, rewrite } from "@vercel/functions";
import {
  INVEST_HTML_SHELL,
  shouldRewriteToInvestShell,
} from "./lib/invest-html-shell.js";

export default function middleware(request) {
  const url = new URL(request.url);
  if (
    !shouldRewriteToInvestShell({
      hostname: url.hostname,
      pathname: url.pathname,
    })
  ) {
    return next();
  }

  const dest = new URL(request.url);
  dest.pathname = INVEST_HTML_SHELL;
  return rewrite(dest);
}

export const config = {
  matcher: ["/", "/((?!api/|assets/).*)"],
};
