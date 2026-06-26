# Product and Commercial MVP1 - Current

_Last refreshed: 2026-06-26 after the Prediction Intelligence v2 Task 3B stage checkpoint._

## Product

UFO Predictor is a football-intelligence product that publishes probabilistic World Cup readings. It is not a sportsbook, does not accept bets, and does not guarantee results.

## Production MVP1 status

The commercial production loop remains operational:

```text
visitor -> account -> checkout -> Wompi approval webhook -> entitlement -> premium access
```

The payment return page is informational. Premium activation is granted only by the validated server-side webhook and idempotent entitlement flow.

MVP1 remains live while MVP2 is developed and validated separately.

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

## Matchday 3 production baseline

Current production v1 coverage:

- 24/24 Matchday 3 fixtures stored;
- 24/24 Matchday 3 predictions published;
- no pending rows in the exact publish queue at the recorded milestone;
- partner export generated with 24 unique fixtures and no duplicates.

These original V1 publications are immutable historical baselines. A later V2 candidate or replay never replaces them.

## Verified-result and historical behavior

A verified final result is shown as historical truth while the original pre-match prediction remains immutable.

Normal valid API-Football `FT` results may be verified automatically when:

- stored fixture and provider identity match;
- home and away scores are present;
- the state is supported;
- no duplicate or reconciliation conflict exists.

Human review is reserved for exceptions.

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

Partner joins use stable fixture or external IDs, not localized team names.

PDF is not required for the current integration.

## MVP1 closeout meaning

MVP1 is commercially usable. Its closeout does not freeze production.

Allowed bounded work includes:

- current tournament operations;
- UI/UX, accessibility, mobile, and conversion improvements;
- clearer use of information already stored by V1;
- safe operational automation;
- documentation maintenance;
- locale-neutral presentation contracts;
- integration and stage validation of V2.

These are incremental releases, not reasons to reopen MVP1 architecture.

## Parallel expert-experience work

A separate MVP2 epic may be assigned to another owner while the primary owner continues data and model work.

That parallel epic may improve production and stage by:

- inventorying V1 data that exists but is not displayed;
- converting probabilities, xG, BTTS, totals, confidence, and scenarios into understandable football language;
- presenting likely match scripts rather than three isolated exact scores;
- showing evidence, contradictions, freshness, and uncertainty;
- preparing components for tournament form, rankings, attack, defense, squads, and players;
- making components tolerant of missing data;
- preparing ES/EN/PT localization contracts.

It must not:

- change V1 calculations;
- generate V2;
- invent missing statistics;
- depend on unfinished stage-only tables for production rendering;
- duplicate the primary data/model workstream.

Independent production-safe UI improvements should branch from current `main`, merge through a normal PR, and then be incorporated into the V2 integration branch through normal Git history.

## MVP2 explanation-first direction

The product should not require users to understand betting terminology before receiving value.

The preferred public reading explains:

- who arrives stronger and why;
- tournament points and form;
- goals scored and conceded;
- offensive and defensive tendencies;
- rankings and opponent quality;
- plausible controlled, tight, open, or upset match scripts;
- what supports the primary reading;
- what could make it fail;
- how reliable and current the evidence is.

Probabilities remain available as quantitative support.

## Future squad and player intelligence

The product and data contracts should be prepared to receive later:

- tournament squads and call-ups;
- likely and confirmed lineups;
- injuries, suspensions, doubts, and expected minutes;
- top scorers and assists in the current tournament;
- percentage contribution to team goals;
- individual shots and xG when reliable;
- penalty and set-piece roles;
- offensive dependency;
- replacement quality;
- estimated impact of a key absence;
- likely scoring candidates.

This future capability should be represented as structured facts and localized explanations, not stored only as a Spanish paragraph.

It is not required to finish V2.0.

## Internationalization

Core target languages:

```text
ES
EN
PT
```

- Spanish remains the current production language;
- English and Portuguese are first-class roadmap targets;
- canonical football facts and identities remain locale-neutral;
- translation keys and localized renderers should be designed before broad rollout;
- French and German remain later possibilities.

## Stage product state

Task 3B completed the stage data foundation without changing production.

Stage currently has:

```text
model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

The publish queue and predictions page load successfully but are empty. The next task is to preserve and import the original Matchday 3 V1 baseline into stage.

## Commercial roadmap boundaries

A second payment provider remains later work.

Potential options include:

- PayPal Business for direct international checkout;
- another regional provider with reliable webhook, refund, and reconciliation behavior;
- Hotmart only if product strategy intentionally changes toward marketplace or course distribution.

A second payment provider is not a V2 blocker.

## MVP1 verdict

The production product remains commercially usable. MVP2 is an incremental intelligence and data release, not a replacement of the validated Auth, payment, entitlement, and publication foundations.
