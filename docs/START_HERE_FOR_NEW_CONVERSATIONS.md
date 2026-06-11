# START HERE — UFO Predictor

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

This file is the entry point for new ChatGPT/Codex conversations. Use it to avoid inventing a new roadmap every time a conversation starts. The project has already suffered enough from humans, branches, and RLS policies trying to be clever.

## Current position

UFO Predictor is in **MVP 1 World Cup Launch**.

The public product now has four real World Cup 2026 fixtures visible through the controlled MVP 1 path:

| Match | API-Football fixture | Public state | Notes |
|---|---|---|---|
| Mexico vs South Africa | `api-football:fixture:1489369` | `public` | Published first, later refreshed after MVP 1 fallback signals. |
| South Korea vs Czech Republic | `api-football:fixture:1538999` | `public` | Published second, later refreshed after MVP 1 fallback signals. |
| Canada vs Bosnia & Herzegovina | `api-football:fixture:1539000` | `public` | Published with MVP 1 fallback signals active. |
| USA vs Paraguay | `api-football:fixture:1489370` | `public` | Published with MVP 1 fallback signals active. |

The proven path is still manual and exact-fixture based:

```text
exact API-Football World Cup fixture
-> exact guarded ingest apply
-> Real Fixture Lab internal prediction
-> manual public prediction publication
-> public match/prediction visibility
```

A second operational path is now also proven:

```text
already-public API-Football fixture
-> exact admin Real Fixture Lab load
-> regenerated internal_lab evidence
-> appended replacement public_product prediction
-> public views pick latest public_product row
```

## Completed foundations

- Epic A — project/app foundation: complete.
- Epic B — public prediction foundation: complete.
- Epic C — registered/premium foundation: complete.
- Epic D — Real Data & Calibration Lab: complete for MVP 0.
- D06 — 5-fixture friendly pilot: complete.
- D07 — `v0.2-prelaunch` model sanity: complete/frozen for launch.
- F01 — MVP 1 UI polish: complete.
- E03/E04 — exact World Cup ingest foundations: complete.
- E05 — manual public prediction publication: runtime pass.
- E06/F02 — public launch QA / mock cleanup: complete for MVP 1 baseline.
- E07 — next World Cup fixture expansion and public refresh: complete / PR #61 merged.

## Recent important PRs

- PR #58 — public launch surface real-fixture safe.
- PR #61 — E07 next World Cup fixture publication and public refresh path.

PR #61 included:

- MVP 1 static fallback signals for immediate World Cup teams;
- exact admin refresh support for already-public API-Football fixtures;
- migration `0030_real_fixture_lab_public_refresh_rls.sql`;
- public refresh of Mexico and South Korea predictions;
- publication of Canada and USA fixtures with fallback signals active.

## Active model state

Active model:

- `v0.2-prelaunch`

MVP 1 fallback signals now cover the first launch-window teams:

- Mexico;
- South Africa;
- South Korea / Korea Republic;
- Czech Republic / Czechia;
- Canada;
- Bosnia & Herzegovina / Bosnia and Herzegovina;
- USA / United States;
- Paraguay.

The model now avoids full default-signal collapse for the first public fixtures. It is still not a full real-time model. Scoreline generation remains conservative and tends too often toward `1-1`; that is future calibration work, not something to quietly hack into the current launch path because apparently one bug is never enough.

## Immediate next work

Recommended next epic:

```text
E09 — Access Tiers for Prediction Detail + Scoreline Visibility
```

Goal:

- define what anonymous users see;
- define what free authenticated users see;
- define what future premium users see;
- decide whether probable score is public, registered-free, or premium;
- keep `prediction_results` internal;
- do not implement payments yet.

Suggested next branch:

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/e09-access-tiers-prediction-detail
git status --short
git branch --show-current
```

Likely following epic:

```text
E10 — Scoreline Calibration + Real Signal Enrichment Plan
```

Goal:

- inspect expected-goals / scoreline generation;
- reduce over-conservative `1-1` behavior;
- plan real data enrichment using FIFA/Elo-style snapshots, recent form, attack/defense, and provenance.

## Branch discipline

Never work directly on `main`.

After every PR merge, the user should run:

```bash
git checkout main
git pull origin main
git status --short
git log --oneline -5
git branch -d <merged-branch>
git push origin --delete <merged-branch>
git status --short
```

If remote branch deletion says the remote ref does not exist, it usually means GitHub already deleted it. Not a blocker. Humanity survives.

## Codex usage rules

Prompts to Codex must be in English.

Codex is an executor/inspector. ChatGPT handles planning, review, and coordination.

Default recognition constraints:

- do not modify files;
- do not commit;
- do not push;
- do not open PRs;
- do not run SQL;
- do not apply migrations;
- do not perform DB writes;
- do not run `--apply true`.

Implementation prompts must clearly say what Codex may modify.

## Commands clarity rule

When ChatGPT gives commands, it must say whether they are:

- **For you to run in PowerShell**, or
- **For Codex as instruction/context only**.

No mysterious command blocks floating around like cursed fortune cookies.

## Migration rules

Supabase migrations are manual.

Process:

1. migration file is created in repo;
2. migration is reviewed;
3. PR is merged;
4. user applies SQL manually in Supabase SQL Editor;
5. live objects are verified;
6. runtime action is tested;
7. docs are updated.

Rules:

- do not edit applied migrations;
- add new migration for corrections;
- coordinate migration numbers;
- do not assume migrations auto-deploy.

## Current key runtime notes

Manual first publication uses:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `publish_real_fixture_match_access_scope(target_match_id, target_match_slug)`

Exact public refresh uses:

- `0030_real_fixture_lab_public_refresh_rls.sql`
- admin-only RLS helper/policy expansion for already-public scheduled API-Football public-product fixtures.

Do not replace the stable RPC/manual publication flow with direct `matches.update(...)` unless a future task explicitly requires it.

## Current MVP-stage roadmap

### MVP 0 — Pre-World-Cup Calibration Lab

Status: complete.

### MVP 1 — World Cup Launch MVP

Status: active / public launch baseline established.

Current focus:

- E09 — access tiers and scoreline visibility;
- E10 — scoreline calibration and real signal enrichment planning;
- result verification after public fixtures finish;
- controlled exact-fixture expansion only.

### MVP 1.5 — Live World Cup Iteration

Future.

Likely epics:

- H — live evaluation/model iteration;
- I — workers lite/automation;
- J — product/monetization iteration.

### MVP 2 — Post-World-Cup Sustainable Product

Future.

## Hard no-go list

Until explicitly approved:

- broad friendlies apply;
- broad World Cup apply;
- automatic publication;
- batch publication;
- provider predictions;
- betting odds as hidden model input;
- public exposure of Lab/internal outputs;
- public exposure of `prediction_results`;
- service-role in app routes;
- score-editing UI;
- manual result creation UI;
- full workers before manual flow evidence;
- large model rewrite before planned calibration;
- payment implementation outside a defined Epic G slice.
