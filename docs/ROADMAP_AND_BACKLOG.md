# UFO Predictor Roadmap and Backlog

_Last refreshed after PR #71: E10C signal enrichment, E10D xG/scoreline calibration, finished-fixture prelaunch refresh, public prediction priority/result display, and Real Fixture Lab usability updates._

## Working rules

- Do not create a PR for every micro-change. Group related commits into a functional branch and open a PR when the block is useful and reviewable.
- Do not refresh project docs after every micro-change. Refresh docs after meaningful project-state transitions, before a major handoff, or before moving to a new long conversation.
- ChatGPT owns project-state documentation refreshes because it carries the cross-conversation context. The user manually copies refreshed Markdown files into `/docs`. Codex verifies docs-only consistency after the manual copy.
- Supabase migrations are applied manually through Supabase SQL Editor unless the project explicitly changes that workflow.
- Keep `prediction_results` internal. Public surfaces must only use public-safe projections.
- Do not use betting odds or provider predictions as hidden model input.
- Do not commit `codex-inputs/` or raw local source packs.

---

## Current MVP 1 baseline

### Completed recently

- **E10C - National-team signal enrichment**
  - 48 canonical World Cup teams now have source-backed signal coverage.
  - Signals include FIFA rank/points, Elo rank/rating, Elo average rank/rating, historical goals for/against per match, `recentMatchCount`, neutral `marketScore: 50`, and neutral `lineupContextScore: 50`.

- **E10D - xG / scoreline calibration**
  - Expected-goals and scoreline behavior now use E10C metadata more meaningfully.
  - The old blind/default `1-1` tendency has been reduced for clear mismatches.
  - The model is improved, not perfect. Do not backfit to real results.

- **Finished fixture prelaunch refresh**
  - Exact admin-only refresh for already-public scheduled/finished fixtures is supported.
  - Refresh is append-only and does not mutate match results or internal evaluation rows.

- **Public prediction priority and verified results**
  - `/predictions` prioritizes active/upcoming fixtures.
  - Finished fixtures are shown as recent results/history.
  - Public cards/details can show verified final results through public-safe projections.

- **Real Fixture Lab usability**
  - Active World Cup operational fixtures are prioritized.
  - Legacy/pilot fixtures are secondary/collapsed.
  - Admin controls have pointer/disabled/pending/loading feedback.

### Operational state

The first four World Cup fixtures have been refreshed/verified as applicable:

- Mexico vs South Africa: final 2-0 verified; public prediction refreshed.
- South Korea vs Czechia: final 2-1 verified; public prediction refreshed.
- Canada vs Bosnia and Herzegovina: final 1-1 verified; public prediction refreshed.
- USA vs Paraguay: final 4-1 verified/evaluated; public prediction refreshed.

The next controlled batch has been ingested/published:

- Qatar vs Switzerland
- Brazil vs Morocco
- Haiti vs Scotland
- Australia vs Turkiye
- Germany vs Curacao
- Netherlands vs Japan
- Ivory Coast vs Ecuador
- Sweden vs Tunisia

---

## Parallel work strategy

Core model/data/fixture operations and product-platform work should be separated so another contributor can work in parallel without colliding with ongoing prediction/data changes.

### Core work usually owned by the model/data track

Avoid assigning these to parallel contributors unless explicitly scoped:

- `lib/prediction-engine/`
- `lib/football-api/`
- `scripts/api-football-read-spike.ts`
- API-Football ingest/apply behavior
- World Cup fixture/result verification flow
- signal-pack generation and `codex-inputs/`
- Supabase policies/views related to prediction publication or `prediction_results`
- public prediction query core, unless the task is explicitly a public UI/projection task

### Parallel-safe work areas

Good candidates for another contributor:

- auth/account UX
- login/logout redirect polish
- plans/pricing page
- payment provider research/spike
- subscription/entitlement design proposal
- premium gate UI shell
- production readiness checklist
- environment separation plan
- domain/auth callback configuration audit
- trust/legal/product copy
- landing/product shell polish

---

# Epic G - Product Platform, Production Readiness, and Monetization Foundations

**Status:** Active / parallelizable
**Purpose:** Let a second contributor advance product platform, account, launch, environment, and monetization work while the main track continues with fixtures, data, signal refresh, and model operations.

Current Epic G sequence:

- G01 Auth/account UX - Done.
- G02 Dev/Prod Environment Separation and Production Config Audit - In progress / documented in `docs/PRODUCTION_READINESS.md`.
- G03 Production Smoke Test - Pending.
- G04 Plans/Pricing MVP - Pending.
- G05 Payment Provider Spike - Pending.
- G06 Subscription/Entitlement Model Proposal - Pending.
- G07 Premium Gate UI Shell - Pending.
- G08 Trust/Legal/Responsible Use Copy - Pending.

## Boundaries for Epic G

Epic G should not touch:

- prediction engine formulas or calibration
- API-Football ingest/apply logic
- match result verification logic
- `prediction_results`
- signal packs or raw source packs
- betting odds or provider predictions as hidden inputs
- public prediction projections unless explicitly scoped and coordinated
- Supabase RLS/schema for prediction publication unless explicitly approved

Epic G may touch:

- auth/account pages and UI
- product shell and navigation
- plans/pricing pages
- payment provider spike documents
- entitlement design documents
- environment/production readiness documentation
- deployment/domain configuration checks
- non-sensitive UI copy

---

## G01 - Google Auth and Account UX Polish

**Status:** Done.

**Goal:** Make login/account behavior reliable and understandable before public launch.

### Tasks

- Audit current Google login/logout flow.
- Verify login on local/dev environment.
- Verify login on `ufopredictor.com`.
- Check OAuth redirect/callback configuration for production domain.
- Check allowed origins / callback URLs in Supabase and Google Cloud Console.
- Confirm post-login redirect behavior.
- Confirm logout behavior.
- Add clear error UI for failed auth or misconfigured callback.
- Confirm mobile login flow.

### Acceptance criteria

- Google login works on production domain.
- Users can log in, log out, and return to the intended page.
- Failed login states show a clear message instead of silent failure.
- No prediction/model/data files are touched.

---

## G02 - Dev/Prod Environment Separation and Production Config Audit

**Status:** In progress / documented. G02 created the configuration checklist in `docs/PRODUCTION_READINESS.md`; it did not run the G03 production smoke test.

**Goal:** Separate local/dev and production behavior so launch testing does not accidentally depend on local-only assumptions.

### Tasks

- Inventory required environment variables for local and production.
- Confirm production Supabase URL/key configuration.
- Confirm production auth callback URLs.
- Confirm Vercel/project environment variables.
- Confirm domain configuration for `ufopredictor.com`.
- Confirm whether preview deployments should use separate callbacks or blocked auth.
- Document manual Supabase SQL Editor migration process for production.
- Add a production readiness checklist.

### Acceptance criteria

- Production environment variables are documented.
- Auth/domain config is documented and testable.
- There is a clear checklist before launch.
- No schema/RLS change is introduced unless separately approved.

---

## G03 - Production Smoke Test on ufopredictor.com

**Status:** Pending.

**Goal:** Verify the deployed product works end-to-end on the real domain before public launch.

### Tasks

- Open the home page on `ufopredictor.com`.
- Verify navigation links work.
- Verify `/predictions` is reachable.
- Verify match detail pages are reachable.
- Verify login works.
- Verify gated/premium placeholder behavior is understandable.
- Verify logged-out and logged-in states.
- Verify mobile layout basics.
- Verify no admin/Lab links leak to public users.
- Verify public pages do not expose internal payloads.

### Acceptance criteria

- Home, predictions, match detail, login, and account flows work on production domain.
- Any broken routes/auth blockers are listed with exact reproduction steps.
- No internal admin routes or payloads are exposed.

---

## G04 - Plans / Pricing Page MVP

**Status:** Pending.

**Goal:** Prepare the public explanation of free vs premium access before real payments.

### Tasks

- Define free plan value.
- Define premium plan value.
- List premium features planned but not yet implemented.
- Add no-guarantees / not-betting copy.
- Add CTA behavior based on auth state.
- Keep copy honest: probabilities, not certainty.

### Acceptance criteria

- A user understands what free and premium mean.
- No fake payment flow is implied as live if not live.
- No odds/provider-prediction claims are made.

---

## G05 - Payment Provider Spike

**Status:** Pending.

**Goal:** Decide how payments should work before implementing real billing.

### Tasks

- Compare candidate providers such as Stripe, Mercado Pago, Wompi, or another region-appropriate provider.
- Check country support, fees, settlement, tax/invoice implications, subscriptions, webhooks, and developer effort.
- Recommend one provider and a fallback.
- Document required environment variables and webhook needs.
- Do not implement real payments yet unless explicitly approved.

### Acceptance criteria

- There is a clear provider recommendation.
- Implementation risks and requirements are documented.
- No production payment code is added without approval.

---

## G06 - Subscription / Entitlement Model Proposal

**Status:** Pending.

**Goal:** Design how premium access should be represented before billing integration.

### Tasks

- Propose tables or metadata for plans, subscriptions, entitlements, and billing events.
- Define free vs premium access checks.
- Define how premium access gates public-safe prediction details.
- Define webhook/event handling at a high level.
- Identify RLS/security concerns.
- Do not apply migrations yet unless explicitly approved.

### Acceptance criteria

- There is a reviewed entitlement design.
- It does not expose `prediction_results`.
- It keeps premium public-safe.

---

## G07 - Premium Gate UI Shell

**Status:** Pending.

**Goal:** Improve the placeholder premium area without implementing the full premium prediction detail yet.

### Tasks

- Replace confusing empty premium states.
- Show locked premium teaser when logged out/free.
- Show clear "premium coming soon" or "premium details unavailable" language if needed.
- Add CTA to plans/login.
- Keep actual premium model outputs out of scope until the premium prediction detail epic.

### Acceptance criteria

- The premium area no longer looks broken.
- It does not reveal internal Lab data.
- It does not imply implemented features that do not exist.

---

## G08 - Trust, Legal, and Responsible Use Copy

**Status:** Pending.

**Goal:** Add clear product trust language without overpromising prediction accuracy.

### Tasks

- Draft short disclaimers: predictions are probabilistic, not guarantees.
- Clarify the product is not a betting service.
- Clarify no betting odds/provider predictions are hidden model inputs.
- Add responsible-use wording.
- Review copy placement on home/plans/prediction pages.

### Acceptance criteria

- Public copy sets correct expectations.
- No false accuracy claims.
- No betting-like positioning.

---

# Core next epics after current MVP operations

## Epic H - Premium Prediction Detail MVP

**Status:** Planned  
**Purpose:** Implement actual premium prediction content for paid users.

Planned content:

- top 3 probable scorelines with percentages
- expected goals for both teams
- BTTS probability
- Over/Under 2.5 probability
- 1X2 probability details
- confidence/risk explanation
- key public-safe model factors

Boundaries:

- no `prediction_results` exposure
- no raw Lab payloads
- no provider predictions
- no betting odds as hidden input

## Epic I - Venue and Match Context Metadata

**Status:** Planned  
**Purpose:** Replace "Sede por confirmar" and add stadium/city/time context.

Planned content:

- stadium name
- city
- country
- kickoff local time where practical
- source/provenance for venue data

## Epic J - Signal Refresh Strategy

**Status:** Planned  
**Purpose:** Keep FIFA/Elo/recent-form signals fresh during the World Cup without reacting after every single match.

Current direction:

- daily or semi-manual refresh during tournament windows
- regenerate normalized signal pack
- run tests
- use refreshed signals only for future predictions
- later evaluate worker/cron automation

Open questions:

- how often to refresh Elo/FIFA during the tournament
- how to handle differences between FIFA and Elo weighting
- whether recent-form score should become a stronger runtime input
- how to avoid overreacting to one result

## Epic K - Continued Fixture Operations

**Status:** Active / ongoing  
**Purpose:** Continue exact controlled operations while automation remains limited.

Loop:

1. discover fixtures
2. dry-run exact fixture
3. apply exact fixture
4. save internal prediction
5. publish public prediction
6. attach result when finished
7. verify result
8. persist internal evaluation

Boundaries:

- no broad tournament-wide apply unless approved
- no hidden provider/odds input
- keep `prediction_results` internal


