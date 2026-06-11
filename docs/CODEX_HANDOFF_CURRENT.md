# Codex Handoff — UFO Predictor Current

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

This file gives Codex the current state and guardrails. Codex should not invent roadmap structure or “simplify” the publication path into another elegant RLS trap. The system has already paid that tuition.

## Current project status

UFO Predictor has four real World Cup fixtures publicly visible in the product.

Public fixtures:

| Match | API-Football fixture | State |
|---|---|---|
| Mexico vs South Africa | `api-football:fixture:1489369` | public; refreshed after fallback signals |
| South Korea vs Czech Republic | `api-football:fixture:1538999` | public; refreshed after fallback signals |
| Canada vs Bosnia & Herzegovina | `api-football:fixture:1539000` | public; published with fallback active |
| USA vs Paraguay | `api-football:fixture:1489370` | public; published with fallback active |

The current milestone is not broad automation. It is a manual, exact-fixture, admin-controlled publication bridge plus an exact admin refresh path for already-public fixtures.

## Recently completed work

### D06/D07 close

- D06 friendly pilot completed with 5 evaluated fixtures.
- D07 activated `v0.2-prelaunch` and froze model changes for MVP 1.

### F01 UI polish

- Public/admin UI polish merged.
- No model/data/payment logic changes in F01.

### E03 World Cup ingest hardening

Completed:

- exact scheduled World Cup fixture apply guard;
- competition slug reuse during ingest apply;
- team slug reuse during ingest apply;
- first exact World Cup fixture ingest.

Important ingest boundary:

- broad World Cup apply is still blocked;
- exact World Cup apply requires explicit fixture id, date range, and limit 1.

### E05 manual publication bridge

Completed/runtime-proven:

- admin action can publish one selected internal prediction;
- action copies selected `internal_lab` prediction into `public_product`;
- internal row remains untouched;
- no `prediction_results` access/exposure;
- match access is published through RPC.

### E06/F02 public launch cleanup

Completed for MVP 1 baseline:

- public launch surface is real-fixture safe;
- mock/preview mixing was removed from the primary public prediction path;
- homepage and public copy now read as product, not release notes from a bunker;
- navbar/session-aware CTAs were corrected.

### E07 fixture expansion and refresh

Completed in PR #61:

- static fallback signals added for immediate World Cup teams;
- Mexico/South Korea public predictions refreshed after fallback improvement;
- Canada and USA fixtures published with fallback active;
- exact admin public refresh path implemented;
- migration `0030_real_fixture_lab_public_refresh_rls.sql` added and applied manually.

## Manual first-publication architecture

The stable runtime path for the `matches.access_scope` flip is:

- migration: `0029_manual_publication_match_access_scope_rpc.sql`
- RPC: `public.publish_real_fixture_match_access_scope(target_match_id uuid, target_match_slug text)`
- called from `app/admin/real-fixture-lab/actions.ts`

RPC behavior:

- `SECURITY DEFINER`
- exact match id + slug only
- requires admin user
- requires current match row to be `admin_only + scheduled + api_football`
- requires linked competition `usage_scope='public_product'`
- updates only `matches.access_scope = 'public'`
- returns updated match id or `null`

Do not replace this with a direct `matches.update(...)` path unless a new explicit task says so.

## Exact public refresh architecture

PR #61 added exact refresh support for already-public API-Football fixtures.

Behavior:

- Real Fixture Lab can load one exact `public + api_football + scheduled` fixture for admin refresh;
- refresh generates a fresh preview with current model/fallback logic;
- refresh saves a new `internal_lab` evidence row;
- refresh appends a new replacement `public_product` row;
- older public rows remain as audit/history;
- public views read the latest public row;
- no `prediction_results` exposure;
- no provider predictions;
- no betting odds.

Migration:

- `0030_real_fixture_lab_public_refresh_rls.sql`

This was necessary because the Lab could not directly read public API-Football base-table rows under the previous RLS posture. The public product itself remains view-based.

## Applied/known publication migrations

These exist in current history and should not be edited:

- `0025_manual_publication_rls.sql`
- `0026_fix_manual_publication_match_update_policy.sql`
- `0027_inline_manual_publication_match_update_check.sql`
- `0028_manual_publication_match_new_row_helper.sql`
- `0029_manual_publication_match_access_scope_rpc.sql`
- `0030_real_fixture_lab_public_refresh_rls.sql`

If another DB correction is needed, add a new migration. Do not rewrite applied history. Really. It was not fun the first time either.

## Data model notes

### `prediction_versions`

Use:

- `id`
- `match_id`
- `run_scope`
- `prediction_type`
- `model_version_id`
- `created_at`

Do not assume:

- `model_version` column;
- `updated_at` column;
- `source_prediction_version_id`;
- `metadata_json`;
- `source_note`.

Join model version through:

- `prediction_versions.model_version_id = model_versions.id`
- `model_versions.version`

Exact refresh appends a new `public_product` prediction row rather than updating an old public row in place.

### `model_versions`

Use:

- `version`, not `version_key`.

Current active model:

- `v0.2-prelaunch`

### `prediction_markets`

Use:

- `market`
- `selection`
- `probability`
- `confidence`
- `is_premium`

Do not assume:

- `market_key`
- `outcome_key`

Market visibility/publication remains a future access-tier/premium decision.

### `matches`

Manual public first-publication changes only:

- `access_scope: admin_only -> public`

Exact refresh for already-public fixtures does not change `matches.access_scope`.

Do not expose or modify result/evaluation internals in this path.

## Current branch/process expectations

Before any implementation:

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/<real-task-name>
git status --short
git branch --show-current
```

After a PR merge:

```bash
git checkout main
git pull origin main
git status --short
git log --oneline -5
git branch -d <merged-branch>
git push origin --delete <merged-branch>
git status --short
```

Never implement on `main`.

## Migration operations

Supabase migrations are not auto-applied.

Codex may create migration files when instructed, but remote SQL application is manual and must be explicitly approved by the user.

Codex must not:

- run remote SQL;
- apply migrations;
- use service-role;
- edit already-applied migrations;
- guess migration state from repo alone when live DB evidence is needed.

## Current recommended next work

### E09 — Access tiers for prediction detail + scoreline visibility

Start with read-only recognition.

Goal:

- inspect what public routes can already read;
- decide anonymous/free-auth/premium boundaries;
- decide whether probable score belongs in anonymous, registered-free, or premium;
- decide whether top scorelines / BTTS / Over-Under should be premium-only;
- avoid exposing `prediction_results`;
- avoid implementing payments in this slice.

Likely files to inspect:

- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `app/matches/[slug]/page.tsx`
- `lib/supabase/public-prediction-queries.ts`
- `lib/supabase/public-match-detail-queries.ts`
- `components/plan-card.tsx`
- dashboard/access helpers if role/session logic is involved

Do not change files in the recognition step.

## Later recommended work

### E10 — Scoreline calibration and real signal enrichment plan

Reasons:

- current model differentiates fixtures better after fallback expansion;
- scoreline generation still tends too often toward `1-1`;
- static fallback should evolve toward real data snapshots with provenance.

Possible future inputs:

- FIFA rankings;
- Elo-style ratings;
- recent form;
- attack/defense signals;
- source dates;
- DB-backed team strength snapshots.

## Hard boundaries

- no broad World Cup apply;
- no broad friendlies apply;
- no batch publication;
- no automatic publication;
- no service-role in app routes;
- no public `prediction_results`;
- no provider predictions;
- no betting odds as hidden model input;
- no payment implementation unless a dedicated Epic G slice is opened;
- no large model rewrite without planned calibration scope.

## Validation defaults

For implementation:

```bash
git diff --check
npm run test -- <targeted-test-file>
npm run lint
npm run build
git status --short
```

Restore `next-env.d.ts` if build changes it unintentionally.

For docs-only:

```bash
git diff --check
git status --short
git diff --name-only
```
