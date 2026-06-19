# Data Dictionary - UFO Predictor

_Last refreshed: post PR #99 / Prediction Review Gate schema / Torneo export completion (2026-06-19)._

## Core fixture and prediction entities

### `matches`

Canonical real fixture row.

Important concepts:

- provider fixture identity;
- canonical English team identity;
- kickoff;
- status;
- competition/stage;
- access scope such as `admin_only` or `public`.

Do not rename provider/database identities for presentation. Use display-name mapping.

### `prediction_versions`

Immutable prediction version.

Typical scopes include internal and public products. New reviewed or refreshed publication creates a new row; existing versions are not rewritten.

### `prediction_markets`

Markets belonging to one exact `prediction_version_id`.

Includes public-safe market data such as:

- 1X2;
- BTTS;
- O/U 2.5;
- scoreline distribution or top scorelines where represented.

Exports must join markets to the exact selected prediction version.

### `match_results`

Stored real result and verification state.

### `prediction_results`

Internal evaluation/result linkage. Never expose publicly.

### `model_versions`

Model/version metadata. Signal refresh provenance must not be confused with a new model formula unless explicitly versioned.

## Prediction Review Gate

### `prediction_review_cases`

One review case per match.

Purpose:

- identify the fixture under review;
- preserve review status and match linkage;
- avoid uncontrolled duplicate cases.

### `prediction_review_snapshots`

Immutable review artifacts.

Snapshot kinds may include:

- current reference;
- shadow prediction;
- reviewed-xG preview.

These are not normal public prediction versions.

### `prediction_review_ai_executions`

Structured AI execution audit.

Current production state: no supported AI provider is connected.

### `prediction_review_decisions`

Human/admin decision audit.

Supported decision semantics include:

- keep current;
- publish refreshed;
- hold;
- reviewed-xG proposal handling.

Publication lineage links the selected review snapshot and any newly created public prediction version.

## Payments and entitlements

### `wompi_payment_events`

Webhook/event persistence and processing state.

### `entitlement_grants`

Activation ledger and idempotency/audit source.

### `user_entitlements`

Runtime competition/package access.

### `user_match_unlocks`

Runtime match-specific access where supported.

### `subscriptions`

Commercial/status context only. Not a direct authorization source.

## Torneo export contract

Contract:

```text
torneo-ufo-export-v1
```

Public-safe fields include:

- fixture ID;
- kickoff;
- teams;
- UFO public URL;
- 1X2;
- xG;
- modal/top scorelines;
- confidence/risk;
- BTTS;
- O/U 2.5;
- public result state when appropriate.

Excluded:

- `prediction_results`;
- raw evaluations;
- review snapshots;
- private/admin payloads;
- provider odds/predictions;
- payment/auth secrets.

## Signal source artifacts

Tracked source snapshot:

```text
data/prediction-engine/national-team-signals/2026-06-19/
```

Key files:

- `source.json`;
- `source-manifest.json`;
- `quality-report.json`;
- `fixture-elo-coherence.json`;
- `team-display-names-es-en.json`.

Runtime consumes the generated static TypeScript pack, not these source artifacts directly.
