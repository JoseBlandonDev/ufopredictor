# IMPLEMENTATION PLAN — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


This is a secondary planning document. Active next-step planning lives in `NEXT_EPICS_PLAN.md` and `ROADMAP_AND_BACKLOG.md`, but this file preserves the implementation sequence and constraints.

## Completed Implementation Blocks

### Lab Admin Flow

Completed:

- Lab fixture review actions;
- match result actions;
- internal Lab prediction markets;
- persisted Lab evaluations.

### C01 — Public Predictions From DB

Completed:

- public prediction listing from Supabase;
- public prediction card;
- `/predictions` from DB.

Current C01 data path is hardened through C03's `public_prediction_summaries` view.

### C02 — Plans & Entitlements Backend

Completed:

- public active plans;
- public plan features;
- own-row subscriptions;
- own-row entitlements;
- own-row match unlocks;
- pure access logic;
- tests;
- `/pricing` from DB;
- `/dashboard` from DB.

### C03 — Match Detail Public From DB

Completed:

- server-only match detail public query;
- real `/matches/[slug]` for public matches;
- safe 404/empty states;
- public prediction basics if available;
- `public_match_details` view;
- `public_prediction_summaries` view;
- anon public projection hardening;
- no premium data opened.

### C04 — Premium Access Enforcement Skeleton

Completed:

- premium match resource contract;
- server-side access resolver pattern;
- canonical `stageAccessKey` approach;
- entitlement/match unlock/admin/beta access decisions;
- pure tests;
- no SQL;
- no premium payload opened.

Important C04 rules:

- `premium_user` alone does not authorize protected content.
- Active subscription alone does not authorize protected content.
- `quantity/match_pack` does not authorize content directly.
- `trustedBetaFreeMatchIds` must be server-side trusted.
- `stageAccessKey` must be server-derived/canonical.

### C05 Gate 0 — Anonymous vs Registered Free Product Audit

Completed:

- audited current anonymous vs registered-free experience;
- decided the funnel is Anonymous -> Registered Free -> World Cup premium packages -> post-World Cup monthly subscriptions;
- rejected separate `beta/free expanded` plan concept;
- confirmed Registered Free is permanent.

### C05 Gate 1 — Registered Free Value Wall

Completed:

- UI/copy in Spanish;
- `/` value proposition;
- `/predictions` session-aware messaging;
- `/matches/[slug]` session-aware preview block;
- `/dashboard` free value block;
- `/pricing` roadmap/no-checkout framing;
- no SQL;
- no RLS;
- no data boundary change;
- no premium payload.

### C05 Gate 2A — Presentation Boundary sin SQL

Completed in current working branch / pending commit or PR.

Implementation intent:

- differentiate Anonymous vs Registered Free at presentation level only;
- use already-public fields from existing queries/views;
- avoid SQL/RLS/migrations/new views/query changes.

Expected behavior:

- Anonymous keeps metadata + complete 1X2 probabilities.
- Anonymous sees confidence/risk as basic signal/teaser.
- Registered Free sees confidence/risk complete with more context.
- Preview signals remain placeholder/teaser.
- Dashboard reinforces free account value.

Non-scope:

- no real data boundary;
- no premium tables;
- no premium payload;
- no payments;
- no i18n;
- no sports API;
- no LLM;
- no workers.

## Next Implementation Decision

### C05 Gate 2B — Real Data Boundary / Projection Decision

Recommended next step.

Goal:

Decide whether C05 Gate 2A should be hardened into a real DB/query boundary.

Options:

1. Keep Gate 2A as presentation boundary for now.
2. Add separate anon vs registered-free projection views.
3. Add server-only query shaping or RPC.
4. Add RLS if appropriate.

Decision constraints:

- If the field is sensitive, it must not be sent to the browser for unauthorized users.
- Visual locks, blur, and teasers are not authorization.
- No premium base tables should open publicly.
- Do not use service role for normal UI.

## Future Implementation Blocks

### C05 Gate 3 — Registered Free Capture Foundation

Potential scope:

- favorites;
- watchlist;
- preferred teams;
- preferred competitions;
- saved matches;
- interaction events;
- preview interest signals.

Likely requires SQL/RLS if implemented.

### C06 — World Cup Premium Package Foundation

Potential scope:

- define visible package catalog;
- map packages to entitlements/unlocks;
- prepare World Cup Full Pass;
- prepare 10 Match Pack;
- prepare Single Match Unlock;
- prepare Country/Team/Group/Stage/Semifinals/Final passes.

Do not serve premium payload yet unless C07 is explicitly reached.

### C07 — Entitled Premium Match Projection

Potential scope:

- backend-filtered premium projection;
- safe server-only access checks;
- premium markets/narratives/results only for authorized users;
- tests and SQL/RLS/RPC if needed.

### C08 — Trust / Transparency Real v0.1

Potential scope:

- replace simulated transparency;
- separate Lab/internal vs beta calibration vs trust-eligible public predictions;
- avoid overclaiming performance.

## Migration Handling

If a future gate needs a migration, Codex creates SQL only.

The user applies it manually in Supabase SQL Editor.

No remote migration is assumed until manually confirmed.

## Validation Standard

Before commit:

```bash
git diff --check
npm run test
npm run lint
npm run build
git status --short
git diff --name-only
git diff --stat
```

Restore `next-env.d.ts` if changed.
