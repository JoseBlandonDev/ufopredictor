# UFO Predictor — Open Decisions

Last refreshed: after PR #40.

## Immediate decisions

### D06 pilot fixture list

Status: open.

Need select 3-5 exact adult national-team friendlies for pre-World-Cup calibration.

Criteria:

- before World Cup official matches;
- enough time before kickoff to save prediction;
- API-Football coverage;
- exact fixture ID;
- adult national team friendly;
- varied enough to test model behavior.

### D06 evidence threshold

Status: open.

Need decide what evidence is enough to proceed into World Cup launch MVP.

Suggested minimum:

- at least 3 internal predictions saved;
- at least 1-3 post-match evaluations if results are available;
- clear model v0.1 error notes;
- no major flow blocker.

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

- first choice: Epic G recognition/design for auth, paywall, PayPal/payment gateway, entitlement;
- second choice: Epic F public UX/trust layer.

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

### Model v0.2 changes

Status: blocked until D06 evidence.

Possible areas:

- confidence/risk tuning;
- top scoreline distribution;
- friendly uncertainty;
- neutral venue behavior;
- weighting defaults.

Do not perform large model rewrite before pilot evidence.

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

### Service-role in app routes

Status: closed.

No service-role in app routes.
