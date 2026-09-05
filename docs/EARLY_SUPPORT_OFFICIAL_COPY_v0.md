# Early Support — official copy (early_support_v0)

**Stamp:** `early_support_v0`  
**Payee:** JD Productions Inc.  
**Processor:** Stripe  

This is the official public wording. UI strings and Stripe product / invoice
text should stay aligned with this document. Do not describe Early Support as
angel investing, equity, shares, a SAFE, a security, a guaranteed return, an
ROI percentage, or a tax-deductible charitable gift until counsel papers a
later instrument.

---

## Definition

Early Support is how you stand with [JD Productions Inc.](https://arc-sos.state.al.us/cgi/corpdetail.mbr/detail?corp=000514953)
before the next formal round. It is voluntary support to the company.

It records the supporter’s Early Support on the JD Productions Accounts ledger,
emails a Stripe payment receipt and an itemized invoice, and may include
priority consideration when counsel later offers a formal instrument.

Early Support is **not** equity, shares, a SAFE, or any other security. It is
**not** a guaranteed return. It is **not** a charitable donation or 501(c)(3)
contribution, and it is **not** tax-deductible as a charitable gift.

Any later instrument is a **separate, counsel-prepared step**. Nothing converts
silently from Early Support into that instrument.

Terms version stamped on checkout, ledger, invoice, and Positions:
`early_support_v0`.

---

## Invest / belief page disclosure

**Eyebrow:** Early Support

**Headline:** Stand with the studio

**Subhead:** Stand with JD Productions before the next formal round.

**Body:** Early Support is how you stand with [JD Productions Inc.](https://arc-sos.state.al.us/cgi/corpdetail.mbr/detail?corp=000514953)
before the next formal round. Choose an amount first — a login is optional. We
record your support on our ledger and email a Stripe receipt plus an itemized
invoice either way. Afterward, you can create an account to claim your
position here.

The company name in that first sentence is a quiet link to the Alabama
Secretary of State business-entity record (entity `000-514-953`). Do not add a
separate “we’re real” line on the belief page.

**Important:** Early Support is not equity, shares, a SAFE, or any other
security. It is not a guaranteed return. It is not a charitable donation or
501(c)(3) contribution, and it is not tax-deductible as a charitable gift. Tax
treatment is between you and your advisor. Any later instrument is a separate
step prepared by counsel; nothing converts silently.

**What you receive**

- A ledger record of your Early Support position
- A Stripe payment receipt by email
- An itemized invoice by email
- Acknowledgment of Early Support Terms (`early_support_v0`)
- Priority consideration when a counsel-prepared offering exists (not a
  guaranteed allocation)

**Amounts**

| Name | Amount | Hint |
|---|---|---|
| Believe | $100 | A first show of belief |
| Stand | $250 | Stand with the studio |
| Build | $500 | Help build what’s next |
| Custom | Amount you choose, within the posted minimum and maximum | Support what you desire |

Backend keys stay `starter` / `standard` / `anchor` / `custom`.

**Processor fees:** Payments are processed by Stripe. Stripe’s processor fees
apply and are not itemized as a separate charge on this invoice.

**Continue:** By continuing you accept the Early Support Terms
(`early_support_v0`) and the Early Support Privacy addendum.

Live routes: `/early-support` (belief / checkout), `/invest` (redirects here),
`https://invest.jdproductions.io/` (same landing; host-aware, no dashboard),
`/early-support/terms`, `/early-support/privacy`.

---

## Checkout product

**Name:** `Early Support — [Believe|Stand|Build|Custom]`

**Description:** Voluntary Early Support to JD Productions Inc. Includes
ledger record, email receipt, and itemized invoice. Not equity or a security.
Not a guaranteed return. Not a charitable donation. Terms: early_support_v0.

---

## Invoice itemization (every tier)

**Charge line:** `Early Support — [Believe|Stand|Build|Custom] — $[amount]`

**$0 included lines**

1. Ledger record of Early Support position — Included
2. Stripe payment receipt by email — Included
3. Acknowledgment of Early Support Terms (early_support_v0) — Included
4. Priority consideration when a counsel-prepared instrument is later offered
   (not a guaranteed allocation) — Included

---

## Invoice notes

Payee: JD Productions Inc. Early Support is voluntary support to JD
Productions Inc. It is not equity or a security, not a guaranteed return, and
not a charitable donation or 501(c)(3) contribution. An account is optional —
the ledger record, Stripe receipt, and itemized invoice are provided either
way. Any later formal instrument is a separate, counsel-prepared step; nothing
converts silently. Payments are processed by Stripe; processor fees apply.

---

## Invoice / Checkout terms footer

EARLY SUPPORT TERMS NOTICE: By continuing you accept Early Support Terms
early_support_v0. Not equity/security, not guaranteed return, not charitable
donation. Included items only those listed. Priority is not guaranteed
allocation.

Link Terms and Privacy (env `EARLY_SUPPORT_TERMS_URL` /
`EARLY_SUPPORT_PRIVACY_URL`, or the relative routes
`/early-support/terms` and `/early-support/privacy`).

---

## Positions (signed-in)

**Headline:** Your Early Support  
**Thank-you line:** Thank you. Your early support helps build what’s next.  
**Priority card:** Priority in later rounds when counsel papers the instrument.

A position is **active** only after a verified Stripe webhook. Browser Checkout
success is not money truth.
