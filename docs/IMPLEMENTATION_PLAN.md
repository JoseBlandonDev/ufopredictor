# IMPLEMENTATION PLAN — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


This is a secondary planning document. Active next-step planning lives in `NEXT_EPICS_PLAN.md` and `ROADMAP_AND_BACKLOG.md`, but this file preserves implementation sequence and constraints.

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

Current C01 data path is hardened through `public_prediction_summaries`.

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
- decided funnel is Anonymous -> Registered Free -> World Cup premium packages -> post-World-Cup monthly subscriptions;
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

Completed.

Implementation intent:

- differentiate Anonymous vs Registered Free at presentation level only;
- use already-public fields from existing queries/views;
- avoid SQL/RLS/migrations/new views/query changes.

Behavior:

- Anonymous keeps metadata + complete 1X2 probabilities.
- Anonymous sees confidence/risk as basic signal/teaser.
- Registered Free sees confidence/risk complete with more context.
- Preview signals remain placeholder/teaser.

### C05 Gate 2B — Server-side Anonymous Payload Shaping sin SQL

Completed in PR #28.

Behavior:

- Anonymous keeps metadata + complete 1X2 probabilities.
- Anonymous no longer receives `confidenceScore` / `riskLevel` in shaped UI DTO.
- Registered Free receives confidence/risk.
- No SQL/RLS/migrations/views/RPC.

### C05 Gate 3 — Saved Matches / Watchlist Foundation

Completed in PR #29.

Implementation:

- `0014_user_saved_matches.sql`;
- `public.user_saved_matches` table;
- own-row RLS;
- `authenticated`: SELECT, INSERT, DELETE;
- `anon`: no access;
- save/remove actions from `/matches/[slug]`;
- dashboard saved matches list;
- no `/predictions` button yet;
- no premium payload.

## Next Implementation Block

### C06 — World Cup Premium Package Foundation

Recommended next step.

Goal:

Prepare the World Cup package/pass/unlock foundation without serving premium match payload yet.

Potential scope:

- package candidates;
- product catalog representation;
- package-to-entitlement mapping;
- stage/team/group/match resource modeling;
- admin/seeding approach if approved;
- no checkout unless explicitly scoped.

Non-scope:

- no premium payload projection;
- no `prediction_markets` public/entitled serving;
- no `prediction_narratives` public/entitled serving;
- no `prediction_results` public/entitled serving;
- no payments/Stripe unless explicitly approved.

## Future Implementation Blocks

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
