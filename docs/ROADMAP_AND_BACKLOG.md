# ROADMAP AND BACKLOG — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


## Current Phase

UFO Predictor has moved from Lab foundation into public beta product foundation and freemium boundary design.

Completed foundations:

- internal Lab Admin Flow;
- public predictions listing from DB;
- plans and entitlements backend foundation;
- public/free match detail from DB;
- explicit public projection hardening for anonymous users;
- premium access enforcement skeleton;
- registered-free value wall;
- C05 Gate 2A presentation boundary without SQL.

Next product need:

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

## Product Strategy

The product should enter a controlled beta/freemium phase before the World Cup.

Strategy:

- show useful free value;
- keep premium data protected;
- do not run mass promotion until results, UX, costs, and infrastructure are validated;
- use finals, friendlies, and pre-World Cup fixtures for organic learning;
- capture Registered Free users;
- prepare World Cup package monetization;
- keep monthly subscriptions for post-World Cup recurring league coverage.

Funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World Cup monthly subscriptions
```

## Roadmap Sequence

### C03 — Match Detail Public From DB

Status: Done.

Delivered:

- real public `/matches/[slug]`;
- `public_match_details`;
- `public_prediction_summaries`;
- public projection hardening with `0013`.

### C04 — Premium Access Enforcement Skeleton

Status: Done.

Delivered:

- server-side/pure premium access decision skeleton;
- entitlement/match unlock/admin/beta access logic;
- canonical `stageAccessKey` rule;
- tests;
- no premium payload opened;
- no SQL.

### C05 Gate 0 — Anonymous vs Registered Free Product Audit

Status: Done.

Delivered:

- product audit;
- decision that Registered Free is permanent;
- no separate beta/free expanded plan;
- identified that Anonymous and Registered Free were too similar before Gate 1.

### C05 Gate 1 — Registered Free Value Wall

Status: Done.

Delivered:

- Spanish public UI/copy improvements;
- value wall messaging in `/`, `/predictions`, `/matches/[slug]`, `/dashboard`, `/pricing`;
- no data boundary change;
- no premium payload.

### C05 Gate 2A — Presentation Boundary sin SQL

Status: Done in current working branch / pending commit or PR.

Goal:

Differentiate Anonymous vs Registered Free in presentation using only already-public fields.

Delivered/expected behavior:

- Anonymous keeps metadata + 1X2 complete.
- Anonymous sees confidence/risk as signal básica/teaser.
- Registered Free sees confidence/risk completo and more context.
- Preview signals remain placeholder/teaser.
- Dashboard reinforces free account value.

Non-scope:

- no SQL;
- no RLS;
- no migrations;
- no new views;
- no query changes;
- no premium tables;
- no premium payload;
- not a real data boundary.

### C05 Gate 2B — Real Data Boundary / Projection Decision

Status: Next / optional decision gate.

Goal:

Decide whether Anonymous vs Registered Free needs a true data/query boundary.

Options:

- keep presentation-only boundary temporarily;
- create separate `anon` and `registered_free` projection views;
- introduce RPC/server-only query shaping;
- use RLS if appropriate.

Decision inputs:

- SEO/discovery value;
- conversion to free registration;
- risk of giving away too much;
- technical complexity;
- whether new fields are sensitive.

### C05 Gate 3 — Registered Free Capture Foundation

Status: Future.

Goal:

Start capturing useful signals from Registered Free users.

Candidates:

- favorites;
- watchlist;
- preferred teams;
- preferred competitions;
- saved matches;
- interaction events;
- preview interest signals;
- onboarding preferences.

May require SQL/RLS.

### C06 — World Cup Premium Package Foundation

Status: Future.

Goal:

Prepare products/packages for World Cup monetization.

Candidate packages:

- World Cup Full Pass;
- 10 Match Pack;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage Pass;
- Semifinals / Final Pass.

This is product/package foundation, not premium payload serving.

### C07 — Entitled Premium Match Projection

Status: Future.

Goal:

Expose premium match sections only to authorized users through backend-filtered projections/server-only logic.

Possible premium sections later:

- markets;
- narratives;
- scorelines;
- expected goals;
- model vs market;
- Golden Hour Delta;
- post-result evaluation;
- deeper confidence/risk explanations.

### C08 — Trust / Transparency Real v0.1

Status: Future.

Goal:

Replace simulated transparency metrics with real, honest model performance surfaces.

Must distinguish:

- Lab/internal experiments;
- beta calibration;
- trust-eligible public predictions.

Do not present early calibration data as finalized trust metrics; keep calibration and production trust metrics clearly separated.

### D — Data Intake / Sports API

Goal:

Choose and integrate a real sports data provider.

Must consider:

- cost;
- quota;
- reliability;
- World Cup coverage;
- finals/friendlies coverage;
- fixtures;
- lineups if needed;
- results speed.

### D/E — Workers Runtime

Goal:

Replace mock worker runs with real scheduled jobs.

Likely jobs:

- sync fixtures;
- sync results;
- generate predictions;
- generate narratives;
- evaluate predictions.

### E — Payments / Packages / Subscriptions

Goal:

Enable commercial flows when product/package readiness justifies it.

Sequence:

1. World Cup packages/passes/unlocks.
2. Post-World Cup monthly subscriptions.

Do not implement checkout until package boundaries and premium projection are explicit.

### F — Odds / LLM Explanation Layer

Odds goal:

Support model vs market comparisons after provider/product/legal decision.

LLM goal:

Generate explanations after deterministic model outputs exist.

Rule:

The AI explains; it does not calculate.

### G — Auth / i18n / Infra

Candidates:

- Google Auth;
- EN/ES i18n;
- staging;
- observability/logging;
- cost monitoring;
- deployment hardening.

## Backlog: Product

- Premium section design.
- Anonymous vs Registered Free real boundary decision.
- Registered Free value refinement.
- Free vs premium field boundary.
- Entitlement-to-match resolver production mapping.
- 10 match pack consumption flow.
- Team pass access rules.
- Stage pass access rules.
- Group pass access rules.
- Competition/World Cup pass access rules.
- Single match unlock UX.
- Admin plan/access management later.
- Beta invite / soft launch messaging.
- Cost monitoring plan.
- Pre-World Cup beta match selection process.

## Backlog: Technical

- Premium-safe projection functions.
- Entitlement-based match access resolver integration with premium payload.
- Anonymous vs Registered Free DB projections if Gate 2B approves.
- Audit existing broad authenticated grants without breaking Lab.
- Real worker runtime.
- Sports API provider adapter.
- Odds provider adapter.
- LLM narrative adapter.
- Staging environment.
- Observability/logging.
- Data encoding cleanup for seeded team names such as `JapÃ³n` / `MÃ©xico`.
- EN/ES i18n routing/translation plan.

## Backlog: Documentation

- Update active docs when switching major conversations.
- Keep Supabase manual migration rule visible.
- Keep current PR/migration baseline in `START_HERE` and `CURRENT_PROJECT_STATUS`.
- Keep Codex prompt split visible:
  - `EJECUCIÓN RECOMENDADA`
  - `PROMPT LIMPIO PARA CODEX`
- Treat secondary docs as historical when they conflict with active docs.
- Avoid destructive summaries that erase project memory; preserve historical and operational context across refreshes.
