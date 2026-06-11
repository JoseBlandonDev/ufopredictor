# START HERE — UFO Predictor

Last refreshed: post-E05 / first public World Cup fixture publication.

This file is the entry point for new ChatGPT/Codex conversations. Use it to avoid inventing a new roadmap every time a conversation starts. The project has already suffered enough from humans, branches, and RLS policies trying to be clever.

## Current position

UFO Predictor is in MVP 1 World Cup Launch.

The first real World Cup fixture is public:

- `api-football:fixture:1489369`
- Mexico vs South Africa
- match id: `00ce2fbc-4ac1-4a47-a97e-c345745e31ef`
- match slug: `world-cup-2026-mexico-vs-south-africa-2026-06-11`
- public prediction version id: `5787306d-ee3a-4167-88ab-ce669f1ed644`
- source internal prediction version id: `301a6ac4-b20c-4098-967e-9f124144f25f`
- active model: `v0.2-prelaunch`

The proven path is:

```text
exact API-Football World Cup fixture
-> exact guarded ingest apply
-> Real Fixture Lab internal prediction
-> manual public prediction publication
-> public match/prediction visibility
```

## Completed foundations

- Epic A — project/app foundation: complete.
- Epic B — public prediction foundation: complete.
- Epic C — registered/premium foundation: complete.
- Epic D — Real Data & Calibration Lab: complete for MVP 0.
- D06 — 5-fixture friendly pilot: complete.
- D07 — `v0.2-prelaunch` model sanity: complete/frozen.
- F01 — MVP 1 UI polish: complete.
- E03/E04 — first exact World Cup fixture ingest: complete.
- E05 — manual public prediction publication: runtime pass.

## Immediate next work

Start E06/F02.

Goal:

- audit public pages after first real fixture publication;
- clean or separate mock/preview content;
- verify Mexico vs South Africa public detail;
- improve high-uncertainty copy;
- keep Lab internals protected.

Recommended branch:

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/e06-public-launch-qa-mock-cleanup
git status --short
git branch --show-current
```

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

If remote branch deletion says the remote ref does not exist, it usually means GitHub already deleted it. Not a blocker.

Then create the next task branch from updated `main`.

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

No more mysterious command blocks floating around like cursed fortune cookies.

## Migration rules

Supabase migrations are manual.

Process:

1. migration file is created in repo;
2. migration is reviewed;
3. PR is merged;
4. user applies SQL manually in Supabase SQL Editor;
5. live objects are verified;
6. runtime action is tested.

Rules:

- do not edit applied migrations;
- add new migration for corrections;
- coordinate migration numbers;
- do not assume migrations auto-deploy.

## Current key runtime note

Manual publication originally failed through direct RLS updates. The stable path is:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `publish_real_fixture_match_access_scope(target_match_id, target_match_slug)`

Do not replace this with direct `matches.update(...)` unless a future task explicitly requires it.

## Current MVP-stage roadmap

### MVP 0 — Pre-World-Cup Calibration Lab

Status: complete.

### MVP 1 — World Cup Launch MVP

Status: active.

Active/next epics:

- E06/F02 — Public Launch QA and Mock Cleanup.
- E07 — Second exact World Cup fixture publication.
- G01 — Payment/tournament-pass discovery, optional parallel.

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
