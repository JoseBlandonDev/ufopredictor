# IMPLEMENTATION PLAN — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

This is a secondary planning document. Active next-step planning lives in `NEXT_EPICS_PLAN.md` and `ROADMAP_AND_BACKLOG.md`.

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

Current C01 data path is now hardened through C03's `public_prediction_summaries` view.

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

## Next Implementation Block

### C04 — Premium Access Enforcement Skeleton

Branch:

```txt
feature/premium-access-enforcement-skeleton
```

Implement or prepare:

- server-only premium access resolver pattern;
- free vs protected field boundary;
- entitlement-based match access skeleton;
- pure tests for access decisions;
- no premium data leakage.

Do not implement:

- public `prediction_markets`;
- public `prediction_narratives`;
- public `prediction_results`;
- final premium UI;
- payments;
- odds;
- LLM;
- workers;
- sports API.

## Migration Handling

If C04 needs a migration, Codex creates SQL only.

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
```

Restore `next-env.d.ts` if changed.
