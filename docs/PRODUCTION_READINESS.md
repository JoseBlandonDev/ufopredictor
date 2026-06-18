# Production Readiness - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Current status

G02 completed dev/prod environment separation and production config/readiness audit work as a readiness baseline. That does not mean production smoke testing is complete.

PR #81 added an admin-only publish queue and should be included in production readiness checks.

## Pending Epic G production work

- G03 production smoke test on the real production domain.
- Verify auth callback/domain behavior in production.
- Verify Resend/Supabase email confirmation in production.
- Verify public prediction surfaces.
- Verify match detail anonymous, registered-free, premium/admin states.
- Verify premium detail authorized/locked states.
- Verify `/admin/real-fixture-publish-queue` admin-only access and safe operation.
- Confirm `/admin/real-fixture-lab` exact-detail blocker is not used as the primary operational path until fixed.

## Dev/prod environment notes

- Keep development and production environment variables separated.
- Do not reuse production secrets in local/dev scripts unless explicitly intended and documented.
- Payment/Wompi secrets must not be added to public/client runtime.
- Service-role keys must stay limited to approved server/script contexts.

## Payment readiness

G05B adds a Wompi production-enabled MVP for `world-cup-pass`. Before opening payments broadly, verify production Wompi keys, production webhook URL, final COP price, Railway smoke test, webhook retry monitoring, and advisor review.

Redirect pages are informational only. Verified Wompi webhook processing is the only payment path that activates G06 entitlements.

## Current smoke-test targets

- `/`
- `/predictions`
- `/matches/[slug]` public and authenticated states
- `/admin/real-fixture-publish-queue`
- Auth flows and confirmation emails
- `/pricing` Wompi checkout CTA
- `/api/wompi/webhook` verified webhook processing
- No public exposure of internal evaluation or `prediction_results`

## Known production risk

Real Fixture Lab exact-detail route still has a stack overflow blocker. Treat it as a follow-up bug and avoid making it a required production operation until fixed.
