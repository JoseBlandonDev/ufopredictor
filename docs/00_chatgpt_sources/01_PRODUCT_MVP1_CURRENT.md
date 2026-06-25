# Product and Commercial MVP1 - Current

_Last refreshed: 2026-06-24 after Prediction Intelligence v2 Task 2 checkpoint approval._

## Product

UFO Predictor is a football-intelligence product that publishes probabilistic World Cup readings. It is not a sportsbook, does not accept bets, and does not guarantee results.

## Production MVP1 status

The commercial loop is operational:

```text
visitor -> account -> checkout -> Wompi approval webhook -> entitlement -> premium access
```

The redirect after payment is informational. Premium activation is granted only by the validated server-side webhook and idempotent entitlement flow.

MVP1 remains live while Prediction Intelligence v2 is integrated and tested separately.

## Access tiers

### Anonymous

- limited public preview;
- public fixture browsing;
- responsible product explanation;
- authentication required before purchase.

### Registered free

- full published 1X2 probabilities;
- confidence and risk context;
- eligible public history;
- premium upgrade paths.

### Premium

- representative scenarios;
- xG and score-distribution context;
- BTTS and over/under where available;
- broader confidence/risk interpretation;
- full advanced detail where an advanced publication exists;
- no repurchase while the Pase Mundial entitlement remains active.

### Admin

- explicit protected operational routes;
- admin authorization remains separate from commercial premium access;
- approved server-side bypasses are administrative only.

## MVP1 features completed

- dynamic World Cup homepage;
- Spanish production presentation;
- freemium segmentation;
- premium scenario explanations and glossary;
- Pase Mundial 2026 commercial page;
- dashboard, transparency, prediction, history, and match-detail surfaces;
- anonymous pricing CTA through Auth;
- verified result history and scenario-hit highlighting;
- kickoff-derived public lifecycle classification;
- production Wompi purchase and webhook entitlement activation;
- exact fixture publication queue;
- Matchday 3 fixture registry and publication continuity;
- trusted-provider result refresh and automatic evaluation;
- public-safe Torneo Mundialista JSON export.

## Matchday 3 delivery

Current production v1 coverage:

- 24/24 Matchday 3 fixtures stored;
- 24/24 Matchday 3 predictions published;
- no pending rows in the exact publish queue;
- partner export generated with 24 unique fixtures and no duplicates.

The current v1 publications remain immutable historical versions even if a later v2 version is created before kickoff.

## Verified-result and historical behavior

A verified final result is shown as historical truth while the original pre-match prediction remains immutable.

Normal valid API-Football `FT` results may now be verified automatically when:

- the stored fixture and provider identity match;
- home and away scores are present;
- the state is supported;
- no duplicate or reconciliation conflict exists.

Human review is reserved for exceptions, not every normal result.

For eligible premium historical details:

- the full pre-match analysis may remain visible;
- an exact scenario match may be highlighted as `Escenario cumplido`;
- when no scenario matches exactly, the UI says so honestly;
- old scenarios are never rewritten after the result.

## Torneo Mundialista partner contract

The approved partner artifact is JSON:

```text
schemaVersion: torneo-ufo-export-v1
```

The validated Matchday 3 export includes 24 unique fixtures and public-safe prediction fields.

PDF is not required for the current integration.

Partner joins should use stable `fixtureId` or `externalId`, not localized team names.

## MVP1 closeout meaning

MVP1 is commercially usable. Its closeout does not freeze the product.

Allowed post-closeout work includes:

- current tournament operations;
- bounded UI/UX, accessibility, mobile, and conversion improvements;
- venue enrichment when trusted;
- safe operational automation;
- documentation maintenance;
- preparation of locale-neutral contracts;
- integration and stage validation of v2.

These are incremental releases, not reasons to reopen the entire MVP1 architecture.

## Production continuity while v2 is developed

- keep current v1 publications available;
- refresh only relevant recent fixture/result state;
- use exact allowlists for production apply;
- auto-verify trusted normal results;
- route anomalies to exception handling;
- create a replacement v2 prediction only before kickoff;
- preserve every published prediction version, cutoff, and lineage;
- use historical replay rather than rewriting finished fixtures.

## Premium direction for MVP2

The premium value should increasingly expose:

- evidence and source-backed context;
- recent and tournament form;
- opponent quality;
- supporting and contradicting signals;
- representative scenario families;
- expected goals and score distributions;
- group/qualification context;
- post-match explanation of what the model read correctly or missed.

The proprietary formula itself is not a public product requirement.

## Internationalization

Core target languages:

```text
ES
EN
PT
```

- Spanish remains the current production language;
- English and Portuguese are first-class roadmap targets;
- locale-neutral entities and contracts are required now;
- public translation rollout follows stable v2 contracts;
- French and German remain later possibilities.

## Commercial roadmap boundaries

Potential later additions:

- PayPal Business as a secondary direct checkout;
- another regional gateway with reliable webhook/refund/reconciliation behavior;
- Hotmart only if product strategy intentionally changes toward marketplace/course distribution.

A second payment provider is not an immediate v2 blocker.

## Current v2 integration boundary

Prediction Intelligence v2 Task 1 and Task 2 are normalized on Draft PR #114, but none of that work is live in production.

The integration track has not changed:

- the production v1 probability layer;
- Wompi/Auth/entitlement authority;
- public lifecycle behavior;
- trusted result operations;
- the production `torneo-ufo-export-v1` contract.

Task 3A remains planner/dry-run work. Stage and production writes are still unauthorized.

## MVP1 verdict

The product is commercially usable now. The next core release is not a rewrite of MVP1. It is an incremental MVP2 intelligence layer, stage-validated and versioned safely while current operations continue.
