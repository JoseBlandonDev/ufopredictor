# Product and Commercial MVP1 - Current

_Last refreshed: 2026-06-23._

## Product

UFO Predictor is a football-intelligence product that publishes probabilistic World Cup readings. It is not a sportsbook, does not accept bets, and does not guarantee results.

## Production MVP1 status

The MVP1 commercial loop is operational:

```text
visitor -> account -> checkout -> Wompi approval webhook -> entitlement -> premium access
```

The redirect after payment is informational. Premium activation is granted only by the validated server-side webhook and idempotent entitlement flow.

## Access tiers

### Anonymous

- sees a limited public preview;
- is encouraged to create an account;
- can browse public fixtures and responsible product explanations;
- must authenticate before purchase.

### Registered free

- sees full published 1X2 probabilities;
- receives confidence/risk context;
- can save fixtures;
- can access eligible historical examples;
- sees clear premium upgrade paths.

### Premium

- receives representative scenarios;
- xG and score-distribution context;
- BTTS and over/under signals;
- broader confidence/risk interpretation;
- full premium detail where an advanced publication exists;
- does not repurchase while the Pase Mundial entitlement remains active.

### Admin

- uses explicit protected operational routes;
- admin status is separate from commercial premium access;
- may receive approved server-side bypasses for administrative work only.

## MVP1 features completed

- dynamic World Cup homepage;
- Spanish public presentation;
- freemium account segmentation;
- premium scenario explanations and glossary;
- Pase Mundial 2026 commercial page;
- clearer dashboard, transparency, and match-detail surfaces;
- anonymous pricing CTA routed through Auth;
- verified result history and exact scenario-hit highlighting;
- kickoff-derived public lifecycle classification;
- production Wompi purchase, webhook activation, entitlement persistence, and premium access proof.

## Verified-result and historical behavior

A verified final result is shown as historical truth while the original pre-match prediction remains immutable.

For eligible premium historical details:

- the full pre-match analysis may remain visible;
- an exact scenario match may be highlighted as `Escenario cumplido`;
- when no scenario matches exactly, the UI says so honestly;
- the product must never rewrite old scenarios after the result.

## MVP1 closeout meaning

MVP1 is commercially usable. Its closeout does not mean the product stops changing.

Allowed post-closeout work includes:

- remaining fixture/result operations;
- bounded UI/UX, accessibility, mobile, and conversion improvements;
- venue enrichment when trusted;
- operational automation that preserves human verification;
- documentation maintenance.

These are incremental releases, not reasons to reopen the entire MVP1 architecture.

## Production continuity while v2 is developed

- continue publishing fixtures with the current production model;
- discover and store the remaining group-stage fixture IDs early;
- verify results once or twice per day according to match density;
- persist evaluations in batches after verification;
- only generate a replacement v2 prediction for a not-started fixture;
- preserve every previously published prediction version and cutoff.

## Commercial roadmap boundaries

Potential later additions:

- PayPal Business as a direct secondary checkout option;
- another regional gateway only if it offers clean webhook, refund, and reconciliation behavior;
- Hotmart only if product strategy intentionally shifts toward marketplace/course-style distribution.

No second provider is part of the immediate MVP2 critical path. Before adding one, define:

- canonical product and pricing source;
- provider-neutral checkout/payment contract;
- webhook authority and idempotency;
- duplicate-purchase rules;
- refund/revocation behavior;
- reconciliation and support ownership.

## Internationalization

- Spanish remains the production language;
- English is the first planned expansion language;
- internationalization begins after the v2 data/model path is stable and merged;
- Portuguese is optional and later;
- canonical entities and internal contracts must remain locale-neutral now.

## MVP1 verdict

The product is commercially usable now. Remaining work should be treated as production continuity, operational hardening, incremental UX improvement, automation, and the separate v2 intelligence rollout.
