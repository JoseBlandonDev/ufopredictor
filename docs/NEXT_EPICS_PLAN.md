# NEXT EPICS PLAN — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

## Current position

Completed:

- C04 Premium Access Enforcement Skeleton
- C05 Gate 0 Product Audit
- C05 Gate 1 Registered Free Value Wall

Next:

```text
C05 Gate 2 — Data Boundary: Anonymous vs Registered Free
```

## Recommended sequence

### C05 Gate 2 — Data Boundary: Anonymous vs Registered Free

Recognition/planning first.

Decide:

- what anonymous sees;
- what Registered Free sees;
- what World Cup packages reserve;
- what post-World Cup subscriptions reserve;
- whether new projections/views are required;
- whether SQL/RLS is required.

### C05 Gate 3 — Registered Free Capture Foundation

Potential implementation after Gate 2.

Candidate features:

- favorites;
- watchlist;
- preferred teams;
- preferred competitions;
- preview interest/click events;
- onboarding preferences.

### C06 — World Cup Premium Package Foundation

Define and model World Cup products:

- World Cup Full Pass;
- 10 Match Pack;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage/Semifinals/Final Pass.

This may reuse C02 entitlements and C04 access resolver concepts.

### C07 — Entitled Premium Match Projection

Serve premium match payload only after authorization.

Options to evaluate:

- protected view;
- RPC;
- server-only query with C04 enforcement;
- a combination.

### C08 — Trust / Transparency Real v0.1

Replace mock transparency with real metrics, but separate:

- Lab/Internal results;
- Beta Calibration;
- Trust-Eligible predictions.

### D/E/F/G future tracks

- Sports API and workers.
- World Cup checkout/payment for packages.
- Post-World Cup monthly subscriptions.
- LLM explanation layer.
- i18n EN/ES.
- Google Auth.

## Security rules

- Visual locks, blur, and teaser cards are not authorization.
- Premium payload must not be sent to the browser unless access has been authorized server-side.
- `premium_user` alone does not unlock protected content.
- Active subscription alone does not unlock protected content.
- `quantity` / `match_pack` does not grant direct access without explicit match unlock materialization.
- `trustedBetaFreeMatchIds` must be assembled server-side; never from client/query params.
- `stageAccessKey` must be canonical and server-derived, for example `competitionId:stage`.
- Do not use service role for normal product UI.

