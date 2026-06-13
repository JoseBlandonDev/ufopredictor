# START HERE — UFO Predictor

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

This file is the entry point for new ChatGPT/Codex conversations. Use it before proposing work. The project has already survived enough branches, RLS policies, and “small tweaks” pretending to be architecture.

## Current position

UFO Predictor is in **MVP 1 World Cup Launch**.

The app has a controlled public World Cup 2026 path and now has a stronger model-input foundation for all **48 canonical World Cup teams**.

Recent merged PRs changed the launch baseline:

| PR | Status | Meaning |
|---|---:|---|
| #63 `feat: gate probable score to authenticated match detail` | merged | authenticated users can see probable score on match detail; anonymous users see teaser; `prediction_results` remains internal |
| #64 `Feature/e10b real team strength snapshots` | merged | canonical World Cup 2026 catalog and complete national-team snapshot coverage foundation |
| #65 `feat: support public finished fixture result verification` | merged | Real Fixture Lab can verify finished public fixture results and persist internal evaluation safely |
| #66 `feat: enrich national team strength signals` | merged | E10C added real FIFA/Elo/recent-form signal enrichment for the 48 canonical teams |

## Public fixture baseline

The initial controlled public World Cup fixtures include:

| Match | API-Football fixture | Public state | Notes |
|---|---:|---|---|
| Mexico vs South Africa | `api-football:fixture:1489369` | public / finished | result verified 2-0 through Lab flow |
| South Korea vs Czechia | `api-football:fixture:1538999` | public / finished | result verified 2-1 through Lab flow |
| Canada vs Bosnia & Herzegovina | `api-football:fixture:1539000` | public / finished | result verified 1-1 through Lab flow |
| USA vs Paraguay | `api-football:fixture:1489370` | public | publication path proved; live/result handling depends on current match state |

The controlled publication path remains:

```text
exact API-Football World Cup fixture
-> exact guarded ingest apply
-> Real Fixture Lab internal prediction
-> manual public prediction publication
-> public match/prediction visibility
```

The finished-result verification path now also exists:

```text
public finished API-Football fixture
-> exact admin Real Fixture Lab load
-> pending_review result write
-> admin Verify result
-> internal evaluation persistence
-> public final status/result display without exposing prediction_results
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
- E09A — authenticated probable score gating: complete / PR #63 merged.
- E10B — canonical World Cup catalog + 48-team snapshot coverage: complete / PR #64 merged.
- H01A — public finished fixture result verification: complete / PR #65 merged.
- E10C — real signal enrichment for 48 national teams: complete / PR #66 merged.

## Active model state

Active model family:

```text
v0.2-prelaunch + E10C signal-enriched national-team snapshots
```

E10C added a generated static signal module:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

The snapshot layer now has real signal coverage for the 48 canonical World Cup teams:

- FIFA rank and FIFA points;
- Elo rank and Elo rating;
- historical Elo match stats;
- historical goals for/against and per-match derivatives;
- recent-form fields from 2025/2026 results;
- neutral placeholders for `marketScore` and `lineupContextScore`.

Important interpretation:

- E10C improved **model inputs**.
- E10C did **not** calibrate expected goals or scoreline distribution.
- `expected-goals.ts` and scoreline tuning remain E10D work.

## Immediate next work

Recommended next step before new implementation:

```text
Docs rebaseline post-E10C / PR #66
```

Recommended next implementation epic:

```text
E10D — xG and scoreline calibration using the new real signals
```

E10D should inspect and calibrate:

- expected-goals computation;
- draw probability behavior;
- most-likely-score distribution;
- overproduction of `1-1`;
- outputs such as `1-0`, `2-0`, `2-1`, `1-1` under realistic team-strength gaps.

E10D must not be a blind tweak. The whole point of E10C was to stop adjusting outputs while feeding the model fog.

## Branch discipline

Never work directly on `main`.

After every PR merge, run from PowerShell:

```powershell
git checkout main
git pull origin main
git status --short
git log --oneline -5
git branch -d <merged-branch>
git push origin --delete <merged-branch>
git status --short
```

If remote branch deletion says the remote ref does not exist, GitHub probably already deleted it. Annoying, but not a blocker. A rare moment where doing nothing is correct.

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

For E10D, the prompt must explicitly mention:

- E10C / PR #66 is already merged;
- do not touch publication/refresh/ingest/UI/Supabase unless explicitly scoped;
- use existing 48-team signal metadata;
- do not use provider predictions or betting odds as hidden model input;
- keep `prediction_results` internal.

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

Authenticated probable score uses:

- `0031_authenticated_public_match_probable_score.sql`
- authenticated-only access to `most_likely_score` on public match detail.

Finished public fixture verification uses:

- `0032_real_fixture_lab_public_finished_result_verification_rls.sql`
- admin-only verification/persistence path in Real Fixture Lab.

Do not replace stable RPC/manual publication flow with direct `matches.update(...)` unless a future task explicitly requires it.

## Current MVP-stage roadmap

### MVP 0 — Pre-World-Cup Calibration Lab

Status: complete.

### MVP 1 — World Cup Launch MVP

Status: active / public launch baseline established.

Current focus:

- result verification for finished public fixtures;
- model credibility improvements through real signals;
- E10D xG/scoreline calibration;
- access-tier polish and future premium value definition.

### MVP 1.5 — Live World Cup Iteration

Likely work:

- stronger scoreline calibration;
- better explanation copy using signal metadata;
- public-safe final-result presentation;
- optional accuracy dashboard once sample size exists.

## Red lines

- Keep `prediction_results` internal.
- Do not expose internal Lab/evaluation payloads publicly.
- Do not use betting odds/provider predictions as hidden model input.
- Do not run broad World Cup ingest/apply.
- Do not commit `codex-inputs/` or local source packs.
- Do not silently modify scoreline calibration outside E10D.
