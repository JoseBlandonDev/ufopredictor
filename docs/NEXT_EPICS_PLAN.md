# Next Epics Plan - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Immediate priority

### Data Ops 01 - Load/publish next World Cup prediction batch

Reason: the latest visible batch has been completed, verified, and evaluated. `/predictions` may currently show only historical results until more future fixtures are published.

Scope: identify next fixtures, generate/refine predictions, publish public rows, ensure premium `model_detail` readiness, verify public list/detail pages, and maintain current safety boundaries.

## Product/discovery priority

### TM01 - Admin JSON Export for Torneo Mundialista

Goal: use Torneo Mundialista as a discovery surface for UFO Predictor.

Recommended V0: admin-only export from Real Fixture Lab, complete public-safe prediction package, JSON first, Torneo controls display/reveal, no endpoint-first integration.

## Premium/Product next

### Premium v2 - Post-match demo policy

Decide whether registered-free users should see full premium model detail after verified result. This can demonstrate premium value without giving pre-match edge.

## Data/Model next

### Scoreline calibration review

Recent fixtures show useful calibration cases: Sweden 5-1 Tunisia, Germany 7-1 Curacao, Netherlands 2-2 Japan. Review scoreline/extreme-goal calibration after more results accumulate.

### Signal refresh strategy

Define refresh cadence and operational boundaries.

### Venue/stadium metadata

Add trusted venue/stadium display when provider support is reviewed.

## Epic G parallel plan

G03 production smoke test, G04 plans/pricing, G05 payment provider spike, G06 entitlement model, G07 premium gate shell/CTA, G08 trust/legal copy.

Keep Epic G separate from product/data/model tasks unless explicitly coordinated.
