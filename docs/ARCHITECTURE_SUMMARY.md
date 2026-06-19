# Architecture Summary - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Core architecture

UFO Predictor separates:

- public product prediction data;
- premium public-safe projections;
- internal Lab/evaluation data;
- exact fixture ingest/operations;
- payment/entitlement state.

Public surfaces never read `prediction_results` or raw internal payloads.

## Public prediction surfaces

- `/predictions`: public prediction summaries and verified results.
- `/matches/[slug]`: public match detail.
- Protected premium projection: expected goals, top scorelines, BTTS, O/U 2.5, confidence/risk.

Verified final scores come from public-safe projections after admin verification.

## Model architecture

### Static national-team signals

Runtime uses committed TypeScript/static signal sources. Raw FIFA/Elo/results files and normalized Codex inputs are audit artifacts only.

SIGNAL04 is the current accepted pack. It uses reviewed FIFA/Elo and aggregate fields, not raw recent-match arrays.

### Prediction generation

The current expected-goals formula remains unchanged. DRAW01 runs as a conservative post-market reconciliation over 1X2 probabilities and draw-shaped score evidence.

### Evaluation separation

Fair reporting uses stored pre-match prediction rows. Current-signal historical recomputations are diagnostic and must be labeled accordingly.

## Admin operations

Preferred focused paths:

- `/admin/real-fixture-result-review-queue`;
- `/admin/real-fixture-evaluation-queue`;
- `/admin/real-fixture-publish-queue`;
- Torneo export admin route.

Real Fixture Lab exact-detail remains a separate stack-overflow follow-up and is not required for routine publication/result operations.

## API-Football operations

Use exact fixture read -> dry-run -> apply. Result flow runs only after provider final status. Publication remains a separate admin action.

## Payment and premium architecture

The accepted production baseline includes Wompi checkout/payment confirmation, automatic premium entitlement activation, premium-active UX, and admin pricing/payment controls.

Payment details and secrets remain server-side. Dedicated runbooks are authoritative. Frontend/PWA work must not alter webhook, payment confirmation, entitlement activation, or sensitive migrations.

## Torneo Mundialista

Admin export is implemented as a public-safe integration surface. Torneo human picks do not feed the UFO model.

## UIHISTORY01 recognition

Current `/predictions` architecture loads and separates all history in memory. Recommended next slice:

- query-level bounded recent history;
- 4 cards on `/predictions`;
- `/predictions/history` with URL pagination, 12 per page;
- verified finished rows only;
- no public data contract change for MVP.

## Signal refresh pipeline

```text
raw FIFA/Elo/results sources
-> normalized 48-team package
-> source manifest
-> quality report
-> Codex recognition
-> reviewed implementation
-> fair overlay + diagnostic recompute
-> tests
```

Raw/normalized files remain outside runtime imports.

## Hard boundaries

No public internal evaluations, service-role app routes, provider predictions/odds as model inputs, Torneo human picks as model inputs, client payment secrets, or broad unknown fixture apply.
