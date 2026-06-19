# Implementation Plan - UFO Predictor

_Last refreshed: post PR #99 documentation rebaseline (2026-06-19)._

## Completed blocks

- Public prediction MVP.
- Prediction pagination/history PR #96.
- Premium prediction detail.
- Free probable-score gate.
- Result Review and Evaluation queues.
- Real Fixture Publish Queue.
- Wompi production payment flow.
- G06 entitlement activation.
- G07 premium active experience.
- Admin price controls.
- Model closeout PR #94.
- Reproducible signal refresh PR #97.
- Prediction Review Gate PR #98.
- Data Ops 06 Matchday 2 completion PR #99.
- Torneo Mundialista export and final 24-fixture delivery.

## Current freeze boundaries

Do not reopen model formulas during operational/frontend work.

Frozen by default:

- `expected-goals.ts`;
- DRAW01;
- Poisson logic;
- accepted SIGNAL04 score formulas;
- finished/kickoff-passed stored predictions.

## Immediate implementation slices

### Data operations

- monitor Matchday 2 provider final states;
- exact result apply;
- Result Review Queue;
- Evaluation Queue;
- next fixture runway.

### G04 P0 pricing truth

Confirm intended commercial price and align:

- DB COP amount;
- USDT label;
- `/pricing`;
- `/admin/payments`;
- checkout.

### G08 truthful model-status copy

Correct public copy that says calibration is active. Model calibration is closed; operational beta and signal refresh remain active.

### G09 frontend commercial readiness

Implement from `G09_FRONTEND_COMMERCIAL_READINESS_PLAN.md`.

First slices:

1. home freshness;
2. pricing/catalog simplification;
3. dashboard access-state clarity;
4. Review Gate copy/states;
5. Spanish presentation consistency.

### G03/G13 production smoke

Formal role/device matrix after the P0 frontend fixes.

## Deferred or separate

- Review Gate AI connection.
- Reviewed-xG publication.
- Real Fixture Lab exact-detail repair.
- Future xG research.
- Venue metadata.
- risky PWA offline caching.

## Validation

Code:

```bash
git diff --check
npx vitest run <focused-tests>
npm run lint
npm run build
```

Signal work:

```bash
npm run signal:check:national-team-pack
```

Docs:

- docs-only diff;
- stale contradiction search;
- no unsupported claims;
- no secrets.
