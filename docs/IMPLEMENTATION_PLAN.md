# UFO Predictor — Implementation Plan v3

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Implementation strategy

Implement in small, reversible MVP slices. Each slice should be one of:

- read-only recognition;
- code + tests;
- migration + runtime verification;
- docs refresh;
- or a complete end-to-end operational step.

Avoid mixing unrelated work. The project is already complicated enough without making every PR a buffet where the dessert is RLS failure.

## Current operational flow for one public World Cup fixture

This is the proven MVP 1 first-publication flow:

```text
1. choose exact fixture candidate
2. read API-Football fixture
3. run ingest dry-run
4. apply exact guarded ingest
5. verify admin-only match in Real Fixture Lab
6. generate/save internal_lab prediction
7. manually publish selected prediction
8. clone public_product prediction version
9. flip match to public through RPC
10. verify /predictions and /matches/[slug]
11. capture evidence
```

Runtime-proven fixtures now include:

- `api-football:fixture:1489369` — Mexico vs South Africa;
- `api-football:fixture:1538999` — South Korea vs Czech Republic;
- `api-football:fixture:1539000` — Canada vs Bosnia & Herzegovina;
- `api-football:fixture:1489370` — USA vs Paraguay.

## Current operational flow for refreshing an already-public fixture

This is the proven MVP 1 public-refresh flow:

```text
1. load exact public API-Football fixture in Real Fixture Lab
2. generate fresh preview with current model/fallback logic
3. run exact refresh action
4. save new internal_lab evidence
5. append new public_product prediction row
6. leave old public_product rows as history
7. verify /predictions reads latest public row
8. verify /matches/[slug] reads latest public row
```

Runtime-proven refreshed fixtures:

- Mexico vs South Africa;
- South Korea vs Czech Republic.

Required migration:

- `0030_real_fixture_lab_public_refresh_rls.sql`

## Branch workflow

Never work directly on `main`.

Start every implementation branch from updated `main`:

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/<real-task-name>
git status --short
git branch --show-current
```

After PR merge:

```bash
git checkout main
git pull origin main
git status --short
git log --oneline -5
git branch -d <merged-branch>
git push origin --delete <merged-branch>
git status --short
```

Then create the next branch.

## Migration workflow

Supabase migrations are not auto-applied.

Current process:

1. create migration file in repo;
2. review it;
3. validate locally where possible;
4. commit/PR/merge;
5. manually apply SQL in Supabase SQL Editor;
6. verify live objects/policies/functions;
7. run runtime UI/action test;
8. document result.

Rules:

- Do not edit migrations already applied to Supabase.
- Add a new migration for every DB correction.
- Coordinate migration numbers before parallel work.
- Keep migration files idempotent where practical.
- Treat manual SQL application as a separate operational step.

Important current migrations:

- `0029_manual_publication_match_access_scope_rpc.sql` — stable first-publication RPC.
- `0030_real_fixture_lab_public_refresh_rls.sql` — admin exact refresh support for already-public fixtures.

## Validation commands

For implementation:

```bash
git diff --check
npm run test -- <targeted-test-file>
npm run lint
npm run build
git status --short
```

If `next-env.d.ts` changes after build and it is not an intended change:

```bash
git restore next-env.d.ts
git status --short
```

For docs-only:

```bash
git diff --check
git diff --stat
git diff --name-only
git status --short
```

## MVP 1 completed implementation blocks

### E06 / F02 — Public Launch QA and Mock Cleanup

Status: complete for MVP 1 baseline.

Delivered:

- launch-safe public surface;
- mock/legacy rows excluded from primary public prediction surfaces;
- homepage copy made product-facing;
- public cards/details cleaned for real fixtures;
- session-aware navbar/CTA behavior fixed;
- public filters kept conservative.

Boundary preserved:

- no `prediction_results` exposure;
- no provider predictions;
- no betting odds;
- no service-role in app routes;
- no payment implementation.

### E07 — Next World Cup Fixture Expansion + Refresh

Status: complete / PR #61 merged.

Delivered:

- static MVP 1 fallback signals for immediate World Cup teams;
- exact public refresh path for already-public fixtures;
- RLS migration `0030`;
- Mexico and South Korea refreshed with fallback signals;
- Canada and USA published with fallback signals active.

Boundary preserved:

- no broad apply;
- no batch publication;
- no automatic publication;
- no `prediction_results` exposure;
- no provider predictions;
- no betting odds;
- no service-role in app routes.

## Next implementation plan

### E09 — Access tiers for prediction detail + scoreline visibility

Purpose:

- create a clean value ladder for anonymous, free authenticated, and future premium users.

Recognition questions first:

1. What data is already available in public views/query helpers?
2. Is probable score present in the public-safe payload?
3. Are top scorelines / BTTS / O-U present and currently hidden?
4. What can be shown without exposing `prediction_results`?
5. What is currently gated by session/admin role?
6. Does the implementation require new views/migrations, or only UI/query changes?

Recommended access direction:

| Tier | Candidate visibility |
|---|---|
| Anonymous | 1X2, confidence/risk, basic match detail, no betting/advice copy. |
| Free authenticated | probable score, short interpretation, watchlist/following. |
| Future premium | top scorelines, BTTS, Over/Under, expanded signal explanation, comparison/history. |

Boundaries:

- no payment implementation;
- no `prediction_results` exposure;
- no provider predictions;
- no odds as hidden input;
- no large model change.

### E10 — Scoreline calibration + real signal enrichment plan

Purpose:

- address the model’s conservative scoreline behavior;
- plan real data inputs beyond static fallback.

Known issue:

- several fixtures still rank `1-1` as top scoreline even when 1X2 leans meaningfully one way.

Likely files to inspect later:

- `lib/prediction-engine/expected-goals.ts`
- `lib/prediction-engine/generate-prediction.ts`
- `lib/prediction-engine/team-power.ts`
- `lib/prediction-engine/confidence-risk.ts`
- tests under `lib/prediction-engine/`

Potential data enrichment:

- FIFA ranking snapshots;
- Elo-style ratings;
- recent form;
- attack/defense scores;
- source/provenance dates;
- DB-backed team strength snapshots.

Boundary:

- no odds as hidden input;
- no provider predictions;
- no silent manual score editing;
- no overclaiming exact-score accuracy.

### H01 — Result verification after first fixtures finish

Trigger:

- after one or more public World Cup fixtures are finished.

Purpose:

- ingest/verify actual results;
- preserve internal evaluation path;
- decide public presentation of final results;
- avoid exposing `prediction_results` directly.

## Data/model implementation boundaries

- Active model is `v0.2-prelaunch`.
- Do not change model weights/features unless a planned calibration epic opens.
- Do not use provider predictions.
- Do not use betting odds as hidden input.
- Market odds can be considered later only as transparent benchmark/comparison, not as a hidden input.

## Public/private implementation boundaries

Allowed public data:

- selected public match rows;
- selected `public_product` prediction versions;
- public-safe confidence/risk context;
- public projections/views.

Not allowed publicly:

- `internal_lab` rows;
- `prediction_results`;
- raw Lab signals;
- internal evaluations;
- unverified result records;
- provider predictions;
- betting odds as hidden model input.
