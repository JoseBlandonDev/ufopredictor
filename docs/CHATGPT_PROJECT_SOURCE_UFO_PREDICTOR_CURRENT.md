# ChatGPT Project Source — UFO Predictor Current

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

This is the high-signal project source for ChatGPT conversations. It should prevent new conversations from improvising the roadmap, because apparently stale documentation is how software projects summon fog machines.

## Product summary

UFO Predictor is a football prediction product focused on probabilistic match forecasts, transparent methodology, and safe public/free/premium presentation.

Current launch focus:

- World Cup 2026 selected fixtures;
- public basic predictions;
- confidence/risk framing;
- protected internal Lab/evaluation data;
- manual exact-fixture operations before any automation;
- preparing access tiers for public/free/premium detail.

## Current milestone

MVP 1 has moved past “first fixture proof.” Four real World Cup fixtures are public.

| Match | Fixture | Slug | Status |
|---|---|---|---|
| Mexico vs South Africa | `api-football:fixture:1489369` | `world-cup-2026-mexico-vs-south-africa-2026-06-11` | public; refreshed after fallback signals |
| South Korea vs Czech Republic | `api-football:fixture:1538999` | `world-cup-2026-south-korea-vs-czech-republic-2026-06-12` | public; refreshed after fallback signals |
| Canada vs Bosnia & Herzegovina | `api-football:fixture:1539000` | `world-cup-2026-canada-vs-bosnia-herzegovina-2026-06-12` | public; published with fallback signals active |
| USA vs Paraguay | `api-football:fixture:1489370` | known public World Cup match slug in app/DB | public; published with fallback signals active |

This proves the MVP 1 path is operational across multiple fixtures:

```text
API-Football exact fixture
-> guarded exact ingest
-> Real Fixture Lab internal prediction
-> manual publication
-> public_product prediction
-> public match visibility
```

It also proves the refresh path for already-public fixtures:

```text
public API-Football fixture
-> exact admin Real Fixture Lab load
-> regenerated internal_lab evidence
-> appended replacement public_product prediction
-> public views read latest public_product row
```

## MVP stage map

### MVP 0 — Pre-World-Cup Calibration Lab

Status: complete / operational PASS.

Includes:

- D05 Real Fixture Lab loop;
- D06 5-fixture friendly pilot;
- D07 v0.2-prelaunch model sanity;
- D08A admin navigation cleanup.

Important interpretation:

- operational loop proved;
- model sample too small for strong performance claims;
- model remains `v0.2-prelaunch` for MVP 1 unless a dedicated calibration epic opens.

### MVP 1 — World Cup Launch MVP

Status: active / public baseline established.

Completed:

- F01 UI polish;
- E03 exact World Cup ingest hardening;
- E04 first exact World Cup fixture ingest;
- E05 manual public prediction publication runtime pass;
- E06/F02 public surface QA and mock cleanup;
- E07 selected fixture expansion, fallback signals, and exact public refresh.

Next:

- E09 access tiers for prediction detail and scoreline visibility;
- E10 scoreline calibration and real signal enrichment plan;
- live result verification once fixtures finish;
- optional G01 payment/tournament-pass discovery after access-tier definition.

### MVP 1.5 — Live World Cup Iteration

Future.

Likely work:

- live result verification;
- public performance aggregation only after enough sample exists;
- operational automation;
- product/monetization iteration.

### MVP 2 — Sustainable Post-World-Cup Product

Future.

Likely work:

- recurring competitions;
- recurring payments;
- richer model/transparency;
- production scale.

## Current architecture in one page

### Ingest

- API-Football is the real fixture source.
- World Cup ingest is exact-fixture only.
- Broad World Cup apply remains blocked.
- Real fixtures are ingested as `admin_only`.
- Competition/team slug reuse protects against legacy/mock duplicate slugs.

### Internal prediction

- Real Fixture Lab generates and saves `internal_lab` predictions.
- Current prediction type: `pre_match_24h`.
- Current active model: `v0.2-prelaunch`.

### Public publication

Manual first publication:

1. validates selected match and selected internal prediction;
2. creates a `public_product` prediction version;
3. flips exact match to `public` through RPC;
4. leaves internal prediction unchanged;
5. does not expose `prediction_results`;
6. does not rely on provider predictions or betting odds.

Runtime-proven RPC:

- `publish_real_fixture_match_access_scope(target_match_id uuid, target_match_slug text)`
- migration: `0029_manual_publication_match_access_scope_rpc.sql`

### Public refresh

Exact refresh for already-public fixtures:

1. loads one exact public API-Football fixture in Real Fixture Lab;
2. regenerates prediction using current model/fallback logic;
3. saves new `internal_lab` evidence;
4. appends a new replacement `public_product` row;
5. leaves older public rows as audit/history;
6. keeps `matches.access_scope='public'` unchanged;
7. public views pick the latest public row.

Required migration:

- `0030_real_fixture_lab_public_refresh_rls.sql`
- applied manually in Supabase SQL Editor.

### Public reads

Public product reads from public-safe projections/query helpers:

- `public_prediction_summaries`
- `public_match_details`

A public match must be:

- `matches.access_scope='public'`
- competition `usage_scope='public_product'`
- compatible public prediction row exists.

## Important data model corrections

### `model_versions`

- use `version`, not `version_key`.
- active model: `v0.2-prelaunch`.

### `prediction_versions`

- has `model_version_id`, not `model_version`.
- does not have `updated_at` in current live schema.
- public/internal distinction is `run_scope`.
- no formal lineage field exists yet.
- refresh appends a replacement `public_product` row rather than updating older rows in place.

### `prediction_markets`

- use `market` and `selection`.
- do not assume `market_key` or `outcome_key`.
- markets remain a future access-tier/premium decision.

### `matches`

- MVP 1 first publication changes `access_scope` from `admin_only` to `public` via RPC.
- exact refresh for already-public fixtures does not mutate `matches.access_scope`.

## Current open decisions

- Access tiers for prediction detail: anonymous vs free authenticated vs premium.
- Whether probable score should be public, free-authenticated, or premium.
- Whether top scorelines / BTTS / Over-Under should be premium-only.
- How to calibrate scoreline generation, which currently leans too often toward `1-1`.
- How to add real signal enrichment: FIFA/Elo snapshots, recent form, attack/defense, source/provenance dates.
- When/if to add DB-native lineage from public prediction to internal source prediction.
- Which payment gateway/tournament pass path to use.
- How/when to show verified real match results and aggregate public transparency.

## Next recommended conversation/task

Start E09 access tiers.

Recommended objective:

- inspect public detail/card data currently available;
- decide what anonymous users see;
- decide what registered-free users see;
- decide what future premium users see;
- avoid `prediction_results` exposure;
- avoid payment implementation in this slice;
- design the smallest safe UI/query/data change.

Recommended Codex use:

- use Codex for read-only recognition after ChatGPT planning;
- do not spend Codex tokens rewriting docs when ChatGPT has the context. Yes, apparently that needed saying.

## Branch and command discipline

User runs PowerShell commands. Be explicit when a command is for the user.

Before implementation:

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

Do not implement on `main`.

## Migration discipline

Supabase migrations are manual.

Rules:

- create migration files in repo;
- apply manually in Supabase SQL Editor only after review;
- verify live DB objects after application;
- never edit already-applied migrations;
- add new migration for new DB changes;
- coordinate migration numbers in parallel work.

## Hard no-go list

Until explicitly approved:

- broad World Cup apply;
- broad friendlies apply;
- automatic publication;
- batch publication;
- service-role in app routes;
- public exposure of `prediction_results`;
- provider predictions;
- betting odds as hidden model input;
- large model rewrite;
- payment implementation outside Epic G;
- editing applied migrations.
