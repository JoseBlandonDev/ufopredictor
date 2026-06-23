# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-23._

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

## Current repository state

Production baseline after the latest MVP1 lifecycle merge:

```text
main: e0191607d46484d13d0771b4508da3b05722dcb5
PR #108: merged - polished freemium MVP1 experience
PR #109: merged - public match lifecycle classification
```

Prediction Intelligence v2:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
```

PR #106 must remain Draft until Task 3B stage synchronization and validation pass.

## Environment map

```text
ufopredictor.com       -> Railway production  -> production Supabase
stage.ufopredictor.com -> Railway development -> separate Supabase stage
```

Stage already exists. Do not create another Railway service, Supabase project, or Docker-based replacement. Stage Auth works, but its application schema/data still require controlled synchronization.

## MVP1 operational state

The latest result cycle verified and published final results including:

- France 3-0 Iraq;
- Argentina 2-0 Austria;
- Norway 3-2 Senegal;
- Jordan 1-2 Algeria.

The internal evaluation queue was also cleared for the reviewed fixtures. Result refresh and evaluation are still operator-driven and should be automated later.

Public match lifecycle no longer depends only on stale stored status:

- future kickoff -> upcoming;
- kickoff passed and inside a conservative three-hour window -> in progress;
- outside the window without verified final result -> awaiting official update;
- verified final result -> results/history only.

## Routine admin workflow boundaries

Preferred operational surfaces are:

- Prediction Review Gate for selected anomalies and human review decisions;
- Real Fixture Publish Queue for exact publication work;
- Result Review Queue for provider results awaiting verification;
- Evaluation Queue for post-match persistence;
- Torneo Export for the partner-facing public-safe payload.

Real Fixture Lab exact-detail is not required for routine operations. It remains a deeper diagnostic surface, not a prerequisite for normal publication, result verification, or evaluation.

## Exact next sequence

1. Keep MVP1 production operations healthy: upcoming publication, exact fixture/status refresh, result verification, evaluation persistence, and public-history checks.
2. Automate fixture/result synchronization incrementally without weakening exact guards, human verification, or immutable-prediction rules.
3. Resume Prediction Intelligence v2 through Task 3B, beginning with a read-only audit of the existing Supabase stage environment.
4. After human review, apply migration 0038 and idempotent non-sensitive data synchronization in stage only.
5. Validate v2 data, signals, immutable predictions, RLS, localization, venues, and UI before deciding any production promotion.

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
- no merge of Draft PR #106 before stage exit gates pass;
- no claim that v2 is already a material accuracy breakthrough;
- no unnecessary reopening of Docker/local-container work.
