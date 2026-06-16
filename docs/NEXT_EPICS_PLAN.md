# Next Epics Plan - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Immediate product/integration priority

### TM01 - Admin JSON Export for Torneo Mundialista

Goal: use Torneo Mundialista as a discovery surface for UFO Predictor.

Recommended V0: admin-only JSON export from UFO Predictor, complete public-safe prediction package, JSON first, UFO match links, Torneo controls display/reveal, no endpoint-first integration.

The export should support Torneo showing UFO as a comparison/marketing layer, for example: 1X2 probabilities, confidence/risk, a link to the UFO match detail, and optional exact-score/top-scoreline reveal only after user pick or deadline.

## Operational priority

### Active fixture result monitoring

Monitor the 12 active/upcoming fixtures and process result verification/evaluation only after provider status is final. Do not verify live/unfinal fixtures.

### Real Fixture Lab stack overflow cleanup

The exact-detail route remains blocked with `RangeError: Maximum call stack size exceeded`. This is separate from TM01 and should not block ongoing publication because `/admin/real-fixture-publish-queue` is available.

## Data/Model next

### Scoreline calibration review

Recent fixtures show useful calibration cases: Germany 7-1 Curacao, Sweden 5-1 Tunisia, Spain 0-0 Cape Verde, Belgium 1-1 Egypt, Saudi Arabia 1-1 Uruguay, Iran 2-2 New Zealand. Review scoreline/extreme-goal calibration after more results accumulate.

### Signal refresh strategy

Define refresh cadence and operational boundaries.

### Venue/stadium metadata

Add trusted venue/stadium display when provider support is reviewed.

## Premium/Product next

### Premium v2 - Post-match demo policy

Decide whether registered-free users should see full premium model detail after verified result. This can demonstrate premium value without giving pre-match edge.

## Epic G parallel plan

- G03 production smoke test.
- G04 plans/pricing MVP.
- G05 Wompi payment integration spike/MVP.
- G06 entitlement model.
- G07 premium gate shell/CTA.
- G08 trust/legal/responsible-use copy.

Keep Epic G separate from product/data/model tasks unless explicitly coordinated.
