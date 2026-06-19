# Open Decisions - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Closed decisions

### Model refresh PR #94

Closed: retain SIGNAL04 and DRAW01. Keep expected-goals formula unchanged. Do not retry rejected candidates without new evidence.

### Model performance reporting

Closed: stored pre-match rows are the fair report. Refreshed-signal historical recomputations are diagnostic only.

### Payment gateway and entitlement

Closed operational baseline: Wompi payment confirmation activates premium access. Dedicated runbooks remain authoritative for implementation/security details.

### Torneo export

Closed: admin public-safe export exists. Torneo human picks are not UFO model inputs.

### Publication operations

Closed: focused Publish/Result Review/Evaluation queues are the normal operational paths while Real Fixture Lab exact-detail remains unstable.

## Open decisions

### UIHISTORY01 scheduling

Recognition is complete. Decide whether implementation runs before or in parallel with the next runway. It is a small UI slice and should not touch model/payments/migrations.

### Next runway cadence

Choose the next approved window after current four fixtures: next 2 days, matchday window, or manual set. Preserve sanity gating.

### Signal refresh trigger

Define meaningful trigger threshold: ranking release, complete matchday, or result batch. Do not refresh after every unexpected match.

### Future xG research

Open but deferred. Requires larger clean sample, explicit metrics, and isolated experiments.

### PWA scope

G10 installability is launch-safe. Decide whether G11 service-worker/offline behavior ships now or later. Default: defer risky caching.

### Mobile/PWA ownership

Assign exact files before parallel work. Canonical docs and sensitive payment/model paths remain owner-locked.

### Trust/legal final pass

Verify responsible-use, no-guarantee, and non-betting language across production surfaces.

### Venue metadata

Still open pending provider reliability review.
