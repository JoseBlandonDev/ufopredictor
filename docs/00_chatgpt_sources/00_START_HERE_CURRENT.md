# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-23 after MVP1 closeout planning and MVP2 branch analysis._

## Current truth

UFO Predictor has a commercially usable production MVP1 and a separate, unmerged Prediction Intelligence v2 development track.

Production currently supports:

- public World Cup prediction pages;
- anonymous, registered-free, premium, and admin experiences;
- Wompi checkout and approved-webhook entitlement activation;
- premium scenario/xG/BTTS/over-under detail;
- result ingestion, verification, public history, and internal evaluation persistence;
- admin review and Torneo Mundialista export tooling.

The current production probability layer remains the v1-compatible baseline. Prediction Intelligence v2 is not live and must not be described as live.

## Repository baselines

Production baseline after the MVP1 lifecycle merge:

```text
origin/main: e0191607d46484d13d0771b4508da3b05722dcb5
PR #108: merged - polished freemium MVP1 experience
PR #109: merged - public match lifecycle classification
```

Documentation reorganization work currently exists on:

```text
branch: docs/adopt-2026-06-23-project-source-refresh
commit: 43fb1dc3957afd0b8356edd4766396f7338e9afb
```

Prediction Intelligence v2 currently exists on the older branch:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
```

PR #106 must remain Draft. It is a preservation/reference branch until the v2 work is normalized onto current `main`.

## Branch divergence decision

As audited on 2026-06-23, `main` and the old v2 branch are materially diverged:

- `main` has 12 commits not present on the v2 branch;
- the v2 branch has 9 commits not present on `main`;
- their merge base is `1dca9bf91000c089927452941a009117b622103f`.

Do not continue feature work directly on the stale branch and do not blanket-merge or blanket-cherry-pick all nine commits.

The approved normalization strategy is:

1. preserve the old v2 branch and Draft PR #106 as evidence/reference;
2. merge the documentation refresh first;
3. create `integration/prediction-intelligence-v2` from the then-current `origin/main`;
4. audit and selectively port the nine v2 commits by concern;
5. validate the current MVP1 build/tests after each bounded import;
6. open a replacement Draft PR from the integration branch;
7. mark PR #106 superseded only after parity/preservation proof.

## Environment map

```text
ufopredictor.com       -> Railway production  -> production Supabase
stage.ufopredictor.com -> Railway development -> separate Supabase stage
```

Stage already exists. Do not create another Railway service, Supabase project, or Docker-based replacement. Stage Auth works, but its application schema/data still require controlled synchronization.

## MVP1 operational state

Recent verified/public results include:

- France 3-0 Iraq;
- Argentina 2-0 Austria;
- Norway 3-2 Senegal;
- Jordan 1-2 Algeria.

The associated evaluation queue was cleared in the latest operator pass.

Public lifecycle behavior is kickoff-derived with verified-result precedence:

- future kickoff -> upcoming;
- kickoff passed and inside a conservative three-hour window -> in progress;
- outside the window without verified final result -> awaiting official update;
- verified final result -> results/history only.

Fixture refresh, result verification, and evaluation persistence are still operator-driven.

## Immediate product priority

Do not wait for v2 before maintaining World Cup coverage.

The immediate production sequence is:

1. discover and store the remaining group-stage fixture IDs and official schedule links;
2. publish upcoming predictions with the current production model where needed;
3. keep result verification and evaluation current once or twice per day;
4. allow later immutable replacement/versioning only for not-started fixtures after v2 is approved;
5. never rewrite a prediction after kickoff.

## Parallel workstreams

### Track A - MVP1 production continuity

Runs from `main` in short branches:

- fixture publication and result refresh;
- operational safeguards;
- small UI/UX, accessibility, copy, and mobile improvements;
- non-v2 admin ergonomics.

### Track B - Prediction Intelligence v2 integration

Runs from `integration/prediction-intelligence-v2`:

- branch/data recovery;
- migration 0038 and stage synchronization;
- normalized source persistence;
- signal snapshots;
- immutable development predictions;
- v1/v2 stage comparison and promotion decision.

### Track C - operations automation

May proceed independently where it uses stable MVP1 contracts:

- batch fixture discovery and storage;
- scheduled relevant-fixture status refresh;
- terminal-score ingest into `pending_review`;
- admin notifications and run logs;
- idempotent batch evaluation assistance.

The first automation release must not auto-verify results or rewrite predictions.

### Track D - later internationalization

English is the first future language. Internationalization starts after the v2 data/model path is stable and merged to `main`. Portuguese remains optional and later.

## Local source snapshot truth

The original prepared v2 source workspace has not been lost. It exists outside the repo at:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

The repo also contains committed equivalents under `data/`, `artifacts/prediction-intelligence-v2/`, `lib/prediction-intelligence-v2/`, and `scripts/prediction-intelligence-v2/`.

Keep the external workspace until stage import, idempotency, lineage, and checksum validation are complete. Do not commit raw local source material merely to make Codex see it.

## Product truth

```text
The statistical model calculates.
The analysis layer explains.
Probabilities are not certainties.
```

The gated v2 probability candidate is near statistical parity with exact v1. The strongest v2 gain is the intelligence layer: evidence, recency, provenance, representative scenarios, reliability, localization, and post-match evaluation.

## Hard boundaries

- no production writes from Task 3B;
- no post-result prediction rewriting;
- no post-kickoff evidence in pre-match calculations;
- no secrets in docs, prompts, screenshots, logs, or artifacts;
- no service-role key in browser/runtime;
- no merge of Draft PR #106;
- no blanket merge of the stale v2 branch;
- no claim that v2 is already a material accuracy breakthrough;
- no unnecessary reopening of Docker/local-container work;
- no full internationalization or second payment provider before the v2 production path is stable.
