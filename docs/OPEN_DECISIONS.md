# UFO Predictor — Open Decisions

Last refreshed: after D08A admin lab navigation cleanup.

## Immediate decisions

### Remaining D06 pilot completion

Status: open.

Need finish the remaining 3 pilot fixtures once final results are published:

- Saudi Arabia vs Senegal;
- Argentina vs Iceland;
- Iraq vs Venezuela.

Operational rule:

- continue exact post-match ingest, verification, and evaluation only as final results become available.

### D06 evidence threshold

Status: still open, but partially satisfied.

Current evidence already available:

- 5 internal predictions saved pre-match;
- 2 post-match evaluations persisted;
- early v0.2 sanity evidence from real fixtures;
- no major loop blocker in the Real Fixture Lab flow.

Still needed before closing D06 evidence:

- all 5 pilot fixtures evaluated if possible;
- final model error summary from the full pilot batch;
- final decision on whether any further D07/D08 follow-up is needed before MVP 1.

## Payment and monetization decisions

### MVP 1 payment provider

Status: open.

Do not assume Stripe.

Candidates:

- PayPal;
- selected local/available payment gateway;
- Stripe only if later confirmed available.

### MVP 1 monetization format

Status: open.

Recommended default: one-time World Cup package / tournament pass.

Options:

1. Free MVP + premium teaser.
2. Soft paywall.
3. Hard paywall.
4. Tournament pass / one-time package.

Current recommendation:

- soft paywall plus one-time tournament pass if implementation time allows.

### Recurring payments

Status: defer.

Recurring subscriptions are not required for MVP 1. They belong to post-World-Cup Epic L unless a gateway makes them trivial and safe.

## Parallel work decisions

### Second contributor lane

Status: open, recommended.

Recommended assignment:

- first choice: Epic F / F01 UI polish and product readiness;
- second choice: Epic G recognition/design for auth, paywall, PayPal/payment gateway, entitlement.

Avoid assigning second contributor to Epic D unless tightly coordinated, because Epic D touches API-Football, Real Fixture Lab, and model/evaluation surfaces.

## World Cup launch decisions

### World Cup ingest scope

Status: blocked until D06 evidence.

Need decide:

- exact competition/source config;
- selected fixtures only vs broader group;
- dry-run requirements;
- apply gates;
- rollback plan.

No broad World Cup apply yet.

### Public prediction publication rules

Status: open.

Need decide:

- what predictions can be public;
- what remains internal;
- whether publication is manual;
- whether premium gates apply;
- what confidence/risk copy is required.

## Model decisions

### Further model changes after v0.2-prelaunch

Status: blocked until full D06 evidence.

Current state:

- D07B fallback signals are already implemented.
- `v0.2-prelaunch` is active and saved for all 5 pilot fixtures.
- v0.1 remains preserved as baseline.

Rule:

- do not change the model again until all 5 pilot fixtures are evaluated.

Possible later areas, only if pilot evidence justifies them:

- confidence/risk tuning;
- top scoreline distribution;
- friendly uncertainty;
- neutral venue behavior;
- weighting defaults.

## Frontend/product decisions

### F01 MVP 1 UI Polish / Product Readiness

Status: open, recommended next workstream.

Scope should include:

- public/shared UI polish;
- encoding cleanup;
- CTA/button hover/focus/pointer state cleanup;
- `/pricing` and `/matches/[slug]` polish first.

Hard no-go inside F01:

- DB changes;
- model changes;
- auth logic changes;
- payment implementation;
- prediction-logic changes;
- migrations.

## Closed or settled decisions

### Result trust policy

Status: closed.

Evaluation persistence requires `match_results.verification_status = 'verified'`.

### Real Fixture Lab public exposure

Status: closed for now.

No public exposure of Lab outputs or `prediction_results` without future explicit publication rules.

### Provider predictions and odds

Status: closed for current MVP stages.

Do not read provider predictions or betting odds.

Clarification:

- odds may only be considered later as a separate benchmark/market-comparison layer, not as hidden model input.

### Service-role in app routes

Status: closed.

No service-role in app routes.

### Active admin lab surface

Status: closed for current stage.

- Real Fixture Lab is the active real-data admin lab.
- Beta Lab remains legacy/mock/internal calibration only.
