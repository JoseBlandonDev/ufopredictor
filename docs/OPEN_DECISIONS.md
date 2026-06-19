# Open Decisions - UFO Predictor

_Last refreshed: post PR #99 documentation rebaseline (2026-06-19)._

## Closed decisions

### Model calibration

Closed through PR #94:

- SIGNAL04 retained;
- DRAW01 retained;
- expected-goals unchanged;
- stored pre-match rows remain the fair report.

### Reproducible signal baseline

Closed through PR #97:

- tracked 2026-06-19 source snapshot;
- deterministic generator;
- quality gates;
- runtime static pack.

### Prediction review architecture

Closed through PR #98:

- separate review tables;
- immutable shadow/decision lineage;
- provider revalidation;
- no fake AI fallback.

### Matchday 2 and Torneo export

Closed through PR #99:

- 24/24 fixtures;
- batch idempotence;
- final `torneo-ufo-export-v1` delivered.

## Open decisions

### Final World Cup Pass price

Owner must confirm the intended commercial amount and label.

Resolve consistency across:

- DB COP amount;
- USDT label;
- public pricing;
- admin pricing;
- checkout.

### Signal refresh cadence

Choose a repeatable trigger and owner.

Candidate triggers:

- official ranking release;
- completed matchday;
- meaningful result batch.

### Review Gate AI provider

Decide whether to connect one concrete provider. No provider is connected now.

### Reviewed-xG publication policy

Preview exists. Publication remains disabled.

Decide later:

- whether publication is allowed;
- bounds by competition;
- required human reason and audit;
- whether AI may only propose, never decide.

### Refund/revocation operations

Define:

- support workflow;
- entitlement revocation;
- refund/cancellation policy;
- audit expectations;
- future automation threshold.

### Home content strategy

Choose dynamic source for:

- featured match;
- active coverage count;
- current tournament stage.

Avoid hardcoded opening-match messaging.

### Public language strategy

Choose Spanish display names and translated operational labels while keeping provider/database identities in English.

### Venue metadata

Open pending provider quality review.

### Real Fixture Lab exact-detail

Decide whether to fix, replace, or retire it after focused queues have proven sufficient.

### PWA offline scope

Default remains no dynamic/auth/payment/admin caching. Decide whether any service worker ships after smoke testing.
