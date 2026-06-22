# Start Here for New Conversations - UFO Predictor

_Last refreshed: Prediction Intelligence v2 Task 3A handoff (2026-06-22)._

## Read this first

The current work is not on production `main`. It is on:

```text
feature/prediction-intelligence-v2-data-foundation
```

Latest implemented Task 3A commit:

```text
6967fd6b22a49e23ab9963345f1a1437b1d6b668
```

The branch is pushed to origin. Do not switch branches, rebase, merge, push, or open a PR unless the task explicitly requires it.

## Current truth in one paragraph

UFO Predictor has a production v1 baseline and an unmerged Prediction Intelligence v2 branch. The v2 branch now contains a durable football-data foundation, historical replay coverage, a conservative gated probability candidate, a richer analysis/scenario layer, immutable publication planning, and a dry-run operational release flow. The probability engine is near statistical parity with v1 rather than a decisive improvement. The main gain is better evidence, recency, provenance, scenarios, localization, venues, and explainability. The next task is Task 3B: audit and synchronize the remote Supabase `stage` environment, load non-sensitive data idempotently, persist signals, and create development-only immutable prediction versions. Production must remain untouched.

## Confirmed environment map

```text
Railway production  -> ufopredictor.com       -> production Supabase
Railway desarrollo  -> stage.ufopredictor.com -> Supabase stage
```

Authentication against Supabase `stage` has been verified with an independent development user. Public predictions are currently unavailable in stage because its application schema and data have not yet been synchronized.

Task 3B requires a local Git-ignored administrative credential file when an operator runs it:

```text
.env.task3b.development.local
```

Its presence and structure are local operator state, not repository state, and must be revalidated before every execution. Never print, commit, paste, or document its values.

## Prediction Intelligence v2 completed work

### Task 1 / 1.1 / 1.2 - data foundation and replay readiness

- durable source snapshots;
- canonical aliases and localizations;
- FIFA and Elo rating snapshots;
- historical match facts and correction lineage;
- official World Cup schedule and venues;
- score-independent match identity;
- API-Football/product linking;
- strict pre-kickoff cutoffs;
- 36/36 completed product fixtures replay-ready.

Stable coverage:

| Coverage | Count |
|---|---:|
| Historical match facts | 1,392 |
| Historical Elo timeline entries | 3,028 |
| Elo teams | 244 |
| FIFA ranking rows | 211 |
| Official World Cup matches | 104 |
| Group-stage links | 72/72 |
| Knockout placeholders | 32 |
| Venues | 16/16 |
| World Cup runtime teams | 48/48 |
| Completed replay fixtures ready | 36/36 |

### Task 2 / 2.1 / 2.2 / 2.3 - Model 2.0 research and release candidate

- first unrestricted challengers did not beat v1;
- neutral-site handling and replay parity were corrected;
- candidate selection and scenario evaluation were corrected;
- selected bounded probability candidate: `v1_plus_high_confidence_signals`;
- selected release candidate: `gated_v2_probability_v2_analysis`;
- v2 analysis layer approved for development release;
- gated v2 probability layer approved only as a conservative development candidate.

Do not claim a material accuracy breakthrough. Exact-v1 and gated-v2 holdout results were effectively near parity.

### Task 3A - dry-run operational layer

Implemented:

- environment authorization guard;
- migration planner;
- idempotent import planner;
- signal-persistence planner;
- immutable publication planner;
- Torneo Mundialista export dry-run;
- production-write denial;
- focused tests.

Not yet executed:

- remote migration;
- remote seed/import;
- physical database validation;
- persisted stage signals;
- development prediction-version creation.

Latest documented Task 3A release set: 8 future fixtures at its recorded cutoff.

## Exact next task: Task 3B

Task 3B begins with a read-only remote audit of Supabase `stage`:

1. compare stage schema/migration history with `supabase/migrations`;
2. identify missing migrations, drift, and manually created objects;
3. confirm the existing Auth user is not endangered;
4. generate an ordered synchronization plan;
5. keep production denied.

Only after human review:

1. synchronize stage with the canonical migration chain;
2. apply `0038_prediction_intelligence_v2_data_foundation.sql`;
3. load non-sensitive reference/history data idempotently;
4. rerun the import and prove zero duplicates;
5. persist signal snapshots;
6. create immutable development prediction versions only for not-started fixtures;
7. generate the Torneo Mundialista development export;
8. validate RLS, public views, localization, venues, and stage UI.

## Product interpretation

UFO is not a fortune teller. Three scorelines are representative terminal states of scenario families, not three guesses designed to claim an accidental hit.

Premium-oriented output should show:

- general statistical reading;
- structural advantage and main risk;
- principal, risk/coverage, and alternate scenarios;
- exact-score probability and family probability;
- supporting and contradicting evidence;
- current form and opponent quality;
- attack, defense, conversion, FIFA, and Elo;
- reliability/sample warnings;
- source provenance and cutoff;
- additional plausible scores from the full distribution.

## Hard boundaries

- no post-result prediction rewrite;
- no post-kickoff evidence in pre-match predictions;
- no production writes from Task 3B;
- no provider odds/predictions as hidden model truth;
- no Torneo user picks as model input;
- no service-role key in browser/runtime;
- no secrets in docs, artifacts, screenshots, logs, or prompts;
- no claim that v2 is already live in production;
- no claim that stage is already schema-compatible.
