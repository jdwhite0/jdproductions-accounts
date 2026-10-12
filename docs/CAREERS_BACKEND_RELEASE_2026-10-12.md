# Careers scope release — October 12, 2026

## Approved scope

Retain the ten existing positions and the General Application channel. Update only the descriptions of Operations & Project Coordinator, Business Development & Partnerships Intern, and Operations & Venture Development Intern. Add Research & Testing Lead as an upcoming opportunity, plus Software QA & Product Testing, UX Research & Usability, Market & Competitive Research, and Finance & Administrative Operations internships. Source: founder-supplied workforce directive and accompanying role specification.

## Persistence and deployment behavior

This release uses the existing company-owned recruiting tables; it introduces no schema migration or ACCESS dependency. A catalog transaction takes a transaction-scoped Postgres advisory lock before seeding. Existing records are located by their preserved slug, never deleted or renamed. Five newly approved postings are inserted once, with real generated question IDs and existing default hiring-plan conventions.

The three description changes execute once per matching requisition ID and slug. Their prior and replacement text is preserved in recruiting_posting_versions. An existing recruiting_audit marker records completion inside the same transaction. Later staff edits are not overwritten on subsequent requests. Only summary, description, responsibilities, qualifications and learning outcomes change. Question IDs, answers, candidates, applications, notes, status, employment terms and URLs remain intact.

Deploying and invoking the recruiting API will therefore write the approved new postings and three one-time revisions to the company database. Parent review is required before deployment. No production data was changed during implementation.

## Application routing and evidence

Explicit Vercel function entries cover public applications, jobs, health and privacy in addition to the shared handler. The earlier authorized live test failed without a reference code; persistence remains unconfirmed. Read-only live HEAD returned 405 while OPTIONS returned 204, which does not establish a root cause. No duplicate test was submitted. A fixture matching the general-application form payload returns a persisted reference, and retry returns the same reference without another application. These wrappers are routing hardening, not a proven diagnosis of that live failure.

Email delivery remains unconfigured. Confirmation truth is the persisted application and returned reference, not an email claim. No shared Clerk configuration, application credentials, ACCESS data, or early-support tables change.

## Release verification

84 Accounts tests passed, including identity/question/application preservation, fixed-count workforce expansion, administrator-edit preservation, authorization and payload idempotency. Production verification must confirm all 16 channels and real question IDs after deployment; only then regenerate marketing pages from that published response. Verify POST routing with an approved identifiable test or reuse the earlier application's idempotency key when the owner can recover it. Do not submit a second indistinguishable application.
