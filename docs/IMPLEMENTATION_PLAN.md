# IMPLEMENTATION PLAN — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

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

- public RLS for public predictions;
- server-only public prediction query;
- public prediction card;
- `/predictions` from DB.

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

## Next Implementation Block

### C03 — Match Detail Public From DB

Branch:

```txt
feature/match-detail-public-from-db
```

Implement:

- server-only match detail public query;
- real `/matches/[slug]` for public matches;
- safe 404/empty states;
- public prediction basics if available.

Do not implement:

- premium markets;
- premium narratives;
- prediction results;
- final paywall;
- payments;
- odds;
- LLM;
- workers;
- sports API.

## Migration Handling

If C03 needs a migration, Codex creates SQL only.

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
