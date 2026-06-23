# Codex Handoff Current - UFO Predictor

_Last refreshed: 2026-06-22, Task 3B stage-sync handoff._

## Repo state

Repository:

```text
C:\Users\jonat\Documents\ufo-predictor
```

Branch:

```text
feature/prediction-intelligence-v2-data-foundation
```

Latest Task 3A commit:

```text
6967fd6b22a49e23ab9963345f1a1437b1d6b668
```

The branch is pushed to origin. Stay on this branch. Do not switch to `main`, merge, rebase, push, or open a PR unless explicitly requested.

## Current environment contract

```text
Railway production  -> ufopredictor.com       -> production Supabase
Railway desarrollo  -> stage.ufopredictor.com -> Supabase stage
```

Stage Auth has been verified with an independent test user.

Task 3B expects a local ignored credential file when supplied by the active operator:

```text
.env.task3b.development.local
```

Do not infer that it exists from repository state. Validate its presence and structure immediately before execution. Never print its values. Never use unqualified production variables for writes.

Docker local is out of scope for this phase.

## Implemented v2 modules

Primary area:

```text
lib/prediction-intelligence-v2/
```

Operational scripts:

```text
scripts/prediction-intelligence-v2/
```

Foundation migration:

```text
supabase/migrations/0038_prediction_intelligence_v2_data_foundation.sql
```

Task 2 release candidate:

```text
gated_v2_probability_v2_analysis
```

Probability candidate:

```text
v1_plus_high_confidence_signals
```

Replay entrypoint:

```ts
buildPredictionIntelligenceV2ReplayInput({
  cutoffAt,
  homeTeamKey,
  awayTeamKey,
  historicalFacts,
  aliases,
  eloCurrent,
  eloStart2026,
  fifaRanking,
  localizations,
  schedule,
})
```

## Stable data coverage

- historical facts: 1,392;
- Elo timeline: 3,028;
- Elo teams: 244;
- FIFA rows: 211;
- schedule: 104;
- group links: 72/72;
- knockout placeholders: 32;
- venues: 16/16;
- World Cup teams: 48/48;
- replay-ready completed fixtures: 36/36.

## Honest model verdict

The gated v2 engine is near parity with exact v1. It is not a demonstrated material predictive improvement.

Promotable in development:

- richer analysis layer;
- evidence and provenance;
- controlled high-confidence residuals;
- scenario families;
- current-form signals;
- localization and venues;
- immutable publication.

Not allowed:

- claims of decisive outperformance;
- uncontrolled probability shifts;
- production promotion without stage validation.

## Task 3A baseline

Implemented:

- safe-target guard;
- migration/import/signal/publication plans;
- Torneo export dry-run;
- production denial;
- focused tests.

Not executed:

- remote DDL;
- remote seed/import;
- stage validation;
- persisted signals;
- development prediction versions.

## Exact next task: Task 3B

### Phase 1 - read-only audit

- load `.env.task3b.development.local` without printing values;
- verify stage host/ref and authorization flags;
- inspect remote migration history/schema only;
- compare against `supabase/migrations`;
- classify missing migrations, drift, and manual objects;
- assess impact on the existing Auth user;
- produce an ordered execution plan;
- no file edits, no writes, no commit.

### Phase 2 - authorized stage write, only after human approval

- synchronize canonical migrations;
- apply 0038;
- import non-sensitive reference/history data;
- rerun and prove idempotency;
- persist signal snapshots;
- create immutable development prediction versions only for not-started fixtures;
- generate Torneo development export;
- validate RLS/public queries/localization/venues/UI;
- keep production denied.

## Product contract for scenarios

Each featured scenario needs:

- family/role: principal, risk/coverage, alternate;
- representative exact score;
- exact-score probability;
- family probability;
- supporting evidence;
- contradicting evidence;
- required match script;
- reliability/sample warning;
- source IDs and cutoff.

Do not mechanically force local/draw/away representation. A strong favorite may occupy two or three featured scenarios. Draw/underdog scenarios require concrete evidence.

## Hard boundaries

- no broad repo rediscovery;
- no recalibration in Task 3B;
- no frontend changes in Task 3B;
- no production writes;
- no secrets in logs/artifacts/docs;
- no post-kickoff leakage;
- no overwrite of historical prediction versions;
- reject started/live/completed fixtures;
- no claim that v2 is already live.
