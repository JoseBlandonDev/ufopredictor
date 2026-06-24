# Frontend and Commercial Backlog

_Last refreshed: 2026-06-24._

## Canonical-status note

This document is a derived backlog aid, not the source of live product truth.

Current scope, priorities, release state, and language decisions are owned by:

- `docs/00_chatgpt_sources/01_PRODUCT_MVP1_CURRENT.md`
- `docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md`
- `docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md`
- `docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md`

If this backlog conflicts with those shared canonical sources, the shared sources win.

## Completed MVP1 baseline

- polished landing, predictions, pricing, dashboard, and transparency views;
- Spanish production terminology;
- anonymous registration and Auth-safe purchase CTAs;
- free, premium, and admin separation;
- premium scenarios, xG, BTTS, and over/under presentation;
- verified-result history and scenario-hit highlighting;
- public lifecycle buckets;
- responsive baseline;
- production purchase, webhook, and entitlement proof;
- bounded fixture publication operations;
- trusted API-Football `FT` result refresh with exception handling.

## Parallel MVP1 microreleases

These may ship from current `main` while v2 remains isolated:

- remaining spacing, hierarchy, blur, and glow polish without redesigning architecture;
- mobile and accessibility pass;
- loading, empty, and error states;
- reduced repeated copy;
- trusted venue display;
- CTA and conversion analytics;
- admin queue ergonomics;
- saved-match UX;
- historical premium demonstration clarity.

They must not depend on migration `0038` or unfinished v2 analytical tables.

## V2 UX

- general statistical reading;
- principal, risk, and alternate scenario families;
- supporting and contradicting evidence;
- source, cutoff, provenance, and reliability display;
- full score-distribution reveal;
- structured localization;
- tournament-current form and qualification-pressure context;
- post-match path and family evaluation;
- clear proprietary boundary.

## Internationalization

Core product target languages are:

- Spanish (`ES`);
- English (`EN`);
- Portuguese (`PT`).

Implementation principles:

- keep canonical entities and prediction payloads locale-neutral;
- separate structured signal keys from translated copy;
- preserve Spanish regression coverage;
- add English and Portuguese through the same localization contracts;
- do not hardcode market, team, or scenario labels inside model outputs.

French and German are later expansion tracks, not part of the immediate MVP2 release.

## Commercial

- keep one Pase Mundial product until evidence justifies additional offers;
- use historical premium examples as proof of depth;
- emphasize evidence, scenarios, contradictions, provenance, and post-match explanation;
- never imply guaranteed results;
- PayPal or another payment provider remains a separate epic;
- Hotmart remains a strategic channel decision, not a drop-in checkout;
- international recurring subscription work follows product and legal validation.

## Deferred or separate tracks

- PWA and offline support;
- broad visual redesign;
- French and German localization;
- second payment-provider implementation;
- player-level scorer props;
- full lineup, injury, and news automation;
- market-odds integration pending product and legal review;
- v3 model branding.

Trusted automatic result verification is no longer deferred. It is part of the current production operations baseline, with human review reserved for exceptions and reconciliation.
