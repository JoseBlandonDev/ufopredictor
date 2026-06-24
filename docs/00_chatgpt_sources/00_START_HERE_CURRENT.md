# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-24 after PR #111, PR #112, Matchday 3 publication, and Torneo export validation._

## Current truth

UFO Predictor has a commercially usable production MVP1 and a separate, unmerged Prediction Intelligence v2 development track.

Production currently supports:

- public World Cup prediction pages;
- anonymous, registered-free, premium, and admin experiences;
- Wompi checkout and approved-webhook entitlement activation;
- premium scenario, xG, BTTS, and over/under detail where available;
- exact fixture registration and publication operations;
- trusted-provider result refresh, automatic verification, public history, and internal evaluation persistence;
- admin operational queues;
- a public-safe Torneo Mundialista JSON export.

The production probability layer remains the v1-compatible baseline. Prediction Intelligence v2 is not live and must not be described as live.

## Repository baseline

Current production baseline:

```text
origin/main: 130ffc8b6728ccccfdb9f29ecc4244ec1cd019b6
PR #111: merged - World Cup group-stage fixture registry flow
PR #112: merged - trusted World Cup result refresh flow
```

Prediction Intelligence v2 remains preserved on:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
```

PR #106 remains a preservation/reference branch. Do not continue implementation directly on it.

## Branch normalization decision

The latest read-only comparison recorded:

- current `main` has 19 commits not present on the old v2 branch;
- the old v2 branch has 9 commits not present on `main`;
- merge base: `1dca9bf91000c089927452941a009117b622103f`.

Approved strategy:

1. preserve the old v2 branch and Draft PR #106;
2. create `integration/prediction-intelligence-v2` from current `origin/main`;
3. audit the nine v2-only commits by concern;
4. selectively port valid data, migration, model, replay, script, artifact, and test work;
5. exclude stale frontend, shared-runtime, and documentation changes;
6. validate MVP1 behavior after each bounded group;
7. open a replacement Draft PR;
8. perform Task 3B stage work only after normalization.

Do not blanket-merge or blanket-cherry-pick the old branch.

## Environment map

```text
ufopredictor.com       -> Railway production  -> production Supabase
stage.ufopredictor.com -> Railway development -> separate Supabase stage
```

Stage already exists. Do not create another Railway service, Supabase project, or Docker replacement.

Production and stage have separate Auth, users, sessions, roles, entitlements, data, and secrets.

## World Cup operational state

Matchday 3 is operationally complete under the current v1 model:

- 24/24 group-stage Matchday 3 fixtures are stored;
- 20 new fixtures were registered in four exact allowlist batches;
- every batch passed dry-run, apply, and idempotency checks;
- 24/24 Matchday 3 predictions are published;
- the Real Fixture Publish Queue is empty;
- the validated Torneo export contains 24 unique fixtures;
- the partner contract is `torneo-ufo-export-v1`;
- JSON, not PDF, is the approved Torneo Mundialista delivery artifact.

PR #111 provides:

```text
npm run ops:world-cup-group-stage-fixture-registry
```

It is dry-run by default and supports bounded selection, exact allowlists, conflict reporting, and idempotent fixture creation/update.

## Trusted result policy

API-Football is the approved operational authority for stored World Cup fixture status and final scores when identity and score checks pass.

PR #112 provides:

```text
npm run ops:world-cup-result-refresh
```

Normal valid flow:

```text
stored exact fixture
-> API-Football FT result
-> trusted automatic verification
-> public verified result
-> idempotent internal evaluation
```

Apply mode requires an exact allowlist.

The Result Review Queue is now exception-oriented rather than a mandatory step for every normal final score.

A real production run:

- selected 15 exact Matchday 2 fixtures;
- found 15 terminal results in the successful apply;
- recognized 14 results/evaluations as already identical;
- created and verified Colombia 1-0 Congo DR;
- created its evaluation;
- produced zero duplicate writes on the second apply.

`provider_fixture_not_found` may be transient. It is not automatically an identity conflict and must not erase or downgrade an already stored verified result.

Next operational hardening:

- retry and backoff;
- distinguish transient provider absence from persistent reconciliation failure;
- poll only recent pending/relevant fixtures;
- scheduler and operator notifications;
- avoid repeatedly querying completed historical batches.

## Torneo Mundialista export

Validated file scope:

```text
schemaVersion: torneo-ufo-export-v1
range: 2026-06-24 to 2026-06-30
fixtures: 24
unique fixtureId: 24
unique externalId: 24
duplicates: 0
```

The export is public-safe and includes:

- fixture/provider identity;
- public match URL;
- kickoff and stage;
- 1X2 probabilities;
- confidence and risk;
- most likely score;
- expected goals;
- top scorelines;
- display guidance.

Torneo Mundialista should join by `fixtureId` or `externalId`, not localized team names.

## Immediate product priority

The next core engineering task is:

```text
M2-01 - Prediction Intelligence v2 integration normalization
```

Immediate sequence:

1. create the new integration branch from current `main`;
2. preserve PR #106 and the old v2 branch unchanged;
3. port the nine v2-only commits selectively;
4. restore the v2 data/model/replay path on the current product baseline;
5. open a replacement Draft PR;
6. perform Task 3B read-only stage audit;
7. synchronize stage only after approval;
8. compare v1 and v2 under identical cutoffs;
9. release a tournament candidate only after stage gates.

Production v1 operations continue while this work happens.

## MVP2 release framing

Planned release sequence:

```text
Prediction Intelligence v2.0 Tournament Candidate
Prediction Intelligence v2.1 Knockout Context
MVP2 Tournament Release
```

Possible production modes after evidence review:

- v1 probabilities + v2 analysis;
- gated v2 probabilities + v2 analysis.

No accuracy claim is allowed until supported by a larger fair sample.

## MVP2 intelligence scope

Priority signal families now include:

- structural Elo and FIFA strength;
- recent 5/10-match form;
- goals for/against and scoring behavior;
- opponent quality;
- tournament-current form;
- group table position;
- qualification/elimination pressure;
- supporting and contradicting evidence;
- representative scenario families;
- provenance, reliability, and exact cutoff.

Final-group qualification pressure is no longer deferred to a distant v3 idea. It is part of the immediate tournament-context design, implemented only with pre-kickoff information.

## Prediction versioning and replay

Published predictions remain immutable.

A new pre-kickoff version may be created only when:

- the fixture has not started;
- a new model/feature version is approved;
- the information cutoff is explicit;
- lineage to the prior version is preserved.

Finished fixtures may receive a `historical_replay` version for fair v1/v2 comparison, using only evidence available before the original kickoff. Historical replay must never replace the original publication.

## Internationalization decision

Core target languages are:

```text
ES
EN
PT
```

Spanish remains the current production language. English and Portuguese are first-class roadmap targets.

Canonical identities, data contracts, signal keys, and model outputs must be locale-neutral now. French and German are later possibilities, not current MVP2 scope.

## Local source snapshot truth

The prepared v2 source workspace remains at:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Committed equivalents remain under `data/`, `artifacts/prediction-intelligence-v2/`, `lib/prediction-intelligence-v2/`, and `scripts/prediction-intelligence-v2/`.

Keep the external workspace until stage import, checksums, lineage, and idempotency are proven.

## Product truth

```text
The statistical model calculates.
The analysis layer explains.
Probabilities are not certainties.
```

The strongest current v2 value is the intelligence layer: evidence, recency, provenance, scenarios, reliability, localization, and post-match learning.

## Hard boundaries

- no production writes from Task 3B;
- no post-result prediction rewriting;
- no post-kickoff evidence in a pre-match version;
- no secrets in docs, prompts, screenshots, logs, or artifacts;
- no service-role key in browser/runtime;
- no merge of Draft PR #106;
- no blanket merge of the stale v2 branch;
- no claim that v2 is already a material accuracy breakthrough;
- no new stage or Docker environment;
- no full frontend redesign, player-prop system, odds integration, or second payment provider in the immediate v2 release;
- no routine manual verification for normal trusted `FT` results;
- no broad unguarded production apply.
