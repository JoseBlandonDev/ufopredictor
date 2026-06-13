# UFO Predictor — Current Project Status

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

## Executive status

UFO Predictor is in **MVP 1 World Cup Launch** with controlled real-fixture publication, authenticated probable-score gating, finished-result verification, and a new real signal foundation for all 48 World Cup teams.

The most recent functional milestone is:

```text
PR #66 — feat: enrich national team strength signals — merged
```

This was not scoreline calibration. It was the input-layer upgrade needed before scoreline calibration stops being ceremonial button-twisting.

## Latest merged work

### PR #63 — authenticated probable score

Merged.

- Added authenticated-only probable score visibility on public match detail.
- Anonymous visitors see teaser state.
- `prediction_results` remains internal.
- Migration: `0031_authenticated_public_match_probable_score.sql`.

### PR #64 — E10B canonical catalog / snapshots

Merged.

- Added canonical World Cup 2026 source coverage.
- Covered 48 teams, 12 groups, 16 venues, and group-stage fixtures.
- Expanded national-team strength snapshot foundation.
- Preserved legacy/test-only keys.

### PR #65 — H01 public finished fixture result verification

Merged.

- Added admin Real Fixture Lab support for finished public fixture result verification.
- Verified runtime path for:
  - Mexico 2-0 South Africa;
  - South Korea 2-1 Czechia;
  - Canada 1-1 Bosnia & Herzegovina.
- Public UI can show final status/result without exposing internal evaluation data.
- Migration: `0032_real_fixture_lab_public_finished_result_verification_rls.sql`.

### PR #66 — E10C real signal enrichment

Merged.

Changed files from implementation:

- `lib/prediction-engine/national-team-strength-signal-pack.ts`
- `lib/prediction-engine/national-team-strength-snapshots.ts`
- `lib/prediction-engine/national-team-strength-snapshots.test.ts`
- `lib/prediction-engine/real-fixture-adapter.test.ts`

What landed:

- generated static 48-team signal pack;
- FIFA rank/points integrated into snapshot metadata;
- Elo rank/rating integrated;
- historical Elo stats and goals integrated;
- recent-form fields integrated;
- neutral `marketScore: 50` and `lineupContextScore: 50` retained;
- legacy/test-only snapshots preserved.

What did **not** change:

- `expected-goals.ts`;
- scoreline calibration;
- publication/refresh flow;
- API-Football ingest behavior;
- UI/app routes;
- Supabase migrations/policies/helpers.

Validation reported by Codex:

- `git diff --check` passed;
- targeted Vitest passed;
- `npm run lint` passed;
- `npm run build` passed;
- `next-env.d.ts` was restored after build.

## Current model status

Active model family:

```text
v0.2-prelaunch + E10C enriched team-strength snapshots
```

The model now has materially better national-team input signals. It is no longer relying only on fallback/static intuition for World Cup teams. Progress, despite the best efforts of entropy.

Available runtime snapshot categories:

- FIFA ranking and points;
- Elo ranking and rating;
- Elo average rank/rating;
- derived historical goals for/against per match;
- recent-form availability/count from 2025/2026 source results;
- neutral placeholders for market and lineups.

Raw Elo match totals and fixture context/expectancy were source-preparation inputs, not active runtime snapshot fields in E10C.

Limitations:

- market signal remains placeholder;
- lineup/injury signal remains placeholder;
- source-label encoding cleanup remains a minor data-quality task;
- expected-goals and scoreline distribution remain uncalibrated after E10C.

## Current public/runtime status

The product has proven:

- exact fixture ingest;
- Real Fixture Lab internal prediction;
- manual public publication;
- authenticated probable score display;
- final result verification for public fixtures;
- internal evaluation persistence without public leakage.

Public surfaces must continue to avoid:

- raw `prediction_results`;
- internal evaluation payloads;
- provider predictions;
- betting odds;
- Lab internals.

## Local cleanup after PR #66

After merge, run:

```powershell
git checkout main
git pull origin main
git status --short
git branch -d feature/e10c-real-signal-enrichment
git push origin --delete feature/e10c-real-signal-enrichment
Remove-Item -Recurse -Force codex-inputs
git status --short
```

If remote branch deletion fails because GitHub already deleted it, ignore it.

## Recommended next work

### First

Docs rebaseline post-E10C.

### Then

```text
E10D — xG / scoreline calibration using real E10C signals
```

E10D should start with read-only inspection and output comparison. The goal is not “make USA 3-0 because one live match did it”; the goal is calibrated distributions that respond sensibly to team strength, form, attack/defense, and context.

### Later

- lineup/injury signal design;
- market signal decision under product/legal constraints;
- encoding/source-label cleanup;
- richer recent-form weighting;
- public-safe explanation improvements.
