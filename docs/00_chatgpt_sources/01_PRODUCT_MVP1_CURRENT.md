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

## Public experience delivered by PR #108

- dynamic World Cup homepage;
- Spanish public presentation;
- freemium account segmentation;
- premium scenario explanations and glossary;
- Pase Mundial 2026 commercial page;
- clearer dashboard, transparency, and match-detail surfaces;
- anonymous pricing CTA routed through Auth;
- final terminology cleanup.

## Match lifecycle delivered by PR #109

The public UI derives lifecycle from kickoff time plus verified-result truth instead of trusting stored status alone.

This prevents:

- kicked-off `scheduled` fixtures disappearing;
- stale `live` rows staying live indefinitely;
- finished-but-unverified fixtures falling into an invisible gap.

## Verified-result and historical product behavior

A verified final result is shown as historical truth while the original pre-match prediction remains immutable.

For eligible premium historical details:

- the full pre-match analysis may remain visible;
- an exact scenario match may be highlighted as `Escenario cumplido`;
- when no scenario matches exactly, the UI says so honestly;
- the product must never rewrite old scenarios after the result.

## Commercial proof already completed

A controlled production purchase flow has already been tested through premium activation and persistence. It should not be repeated merely to satisfy documentation work.

## Current launch-safe caveats

- venue enrichment can remain deferred where provider/official mapping is not yet available;
- some frontend polish can continue after MVP1;
- result refresh and evaluation persistence are still manual operations;
- dedicated legal/terms/privacy decisions remain an owner-level follow-up;
- secondary payment methods are not part of MVP1.

## Secondary payment roadmap

Potential future additions:

- PayPal Business as a direct secondary checkout option;
- another regional gateway only if it offers clean webhook and entitlement integration;
- Hotmart only if the product strategy intentionally shifts toward marketplace/course-style distribution.

No second provider should be added before defining:

- canonical product and pricing source;
- webhook truth;
- idempotency and duplicate-purchase rules;
- refund/revocation behavior;
- reconciliation and support ownership.

## MVP1 verdict

The product is commercially usable now. Remaining work should be treated as operational hardening, incremental UX improvement, automation, and the separate v2 intelligence rollout, not as a reason to reopen the entire MVP1.
