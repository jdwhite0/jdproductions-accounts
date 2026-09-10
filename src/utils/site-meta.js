/**
 * Static URL-card / document titles for Accounts vs invest hosts.
 * Crawler meta must live in index.html / invest.html — this module is for
 * browser document.title and shared copy constants.
 */

import { LANDING_HEADLINE, LANDING_SUBHEAD } from "../../lib/early-support/copy.js";
import { isInvestHost } from "./invest-host.js";

export const ACCOUNTS_SITE = Object.freeze({
  title: "JD Productions Accounts",
  description:
    "JD Productions Accounts — company accounts gateway and Early Support for JD Productions Inc.",
  url: "https://accounts.jdproductions.io/",
  imagePath: "/og-accounts.jpg",
  imageAlt: "JD Productions Accounts — company accounts gateway",
  twitterCard: "summary_large_image",
});

export const INVEST_SITE = Object.freeze({
  title: `${LANDING_HEADLINE} · JD Productions`,
  description: LANDING_SUBHEAD,
  url: "https://invest.jdproductions.io/",
  imagePath: "/og-early-support.jpg",
  imageAlt:
    "Early Support — stand with JD Productions before the next formal round",
  twitterCard: "summary_large_image",
  siteName: "JD Productions",
});

/** Browser tab title for Early Support surfaces. */
export const EARLY_SUPPORT_DOCUMENT_TITLE = INVEST_SITE.title;

export const ACCOUNTS_DOCUMENT_TITLE = ACCOUNTS_SITE.title;

export function documentTitleForHost(hostname) {
  return isInvestHost(hostname) ? INVEST_SITE.title : ACCOUNTS_SITE.title;
}
