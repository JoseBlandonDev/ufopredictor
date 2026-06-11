# UFO Predictor — Implementation Plan v2

Last refreshed: post-E05 / first public World Cup fixture publication.

## Implementation strategy

Implement in small, reversible MVP slices. Each slice should either be:

- read-only recognition;
- code + tests;
- migration + runtime verification;
- docs refresh;
- or a complete end-to-end operational step.

Avoid mixing unrelated work. The project is already complicated enough without making every PR a buffet.

## Current operational flow for one public World Cup fixture

This is the proven MVP 1 flow:

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

Runtime-proven first fixture:

- `api-football:fixture:1489369`
- Mexico vs South Africa

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

Manual-publication migrations already involved:

- `0025_manual_publication_rls.sql`
- `0026_fix_manual_publication_match_update_policy.sql`
- `0027_inline_manual_publication_match_update_check.sql`
- `0028_manual_publication_match_new_row_helper.sql`
- `0029_manual_publication_match_access_scope_rpc.sql`

The runtime-proven match publication mechanism is the `0029` RPC.

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
git status --short
```

## MVP 1 immediate implementation plan

### E06 / F02 — Public Launch QA and Mock Cleanup

Purpose:

- make public pages launch-safe now that a real World Cup prediction is visible.

Implementation sequence:

1. read-only audit public routes and query helpers;
2. decide mock/preview handling;
3. implement smallest UI/query cleanup;
4. validate public detail for Mexico vs South Africa;
5. run targeted tests/lint/build;
6. capture screenshots/evidence.

Likely files:

- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `app/matches/[slug]/page.tsx`
- public Supabase query helpers under `lib/supabase/`

Boundary:

- no migrations unless audit finds a real data-boundary bug;
- no model logic change;
- no payment work;
- no `prediction_results` exposure.

### E07 — Second exact fixture publication

Purpose:

- repeat the exact public fixture flow for one more selected World Cup match.

Steps:

1. choose exact fixture id;
2. `fixture` read;
3. `ingest-dry-run` report;
4. exact `--apply true` only after review;
5. save internal prediction;
6. publish manually;
7. verify public surface.

Boundary:

- no broad apply;
- no batch;
- no auto-publication.

### G01 — Payment discovery, optional parallel

Purpose:

- explore PayPal/selected gateway tournament pass path.

Boundary:

- discovery only until public launch surface is stable;
- no Stripe assumption;
- no checkout implementation without explicit scope.

## Data/model implementation boundaries

- Active model is `v0.2-prelaunch`.
- Do not change model weights/features unless a planned calibration epic opens.
- Do not use provider predictions.
- Do not use betting odds as hidden input.
- Market odds can be considered later only as a transparent benchmark/comparison layer.

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
