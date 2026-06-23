# Frontend and Commercial Backlog

_Last refreshed: 2026-06-23._

## Completed MVP1 baseline

- polished landing/predictions/pricing/dashboard/transparency;
- Spanish terminology;
- anonymous registration and Auth-safe purchase CTAs;
- free/premium/admin separation;
- premium scenarios/xG/BTTS/over-under;
- verified-result history and scenario-hit highlighting;
- public lifecycle buckets;
- responsive baseline;
- production purchase/webhook/entitlement proof.

## Parallel MVP1 microreleases

These may ship from current `main` while v2 remains isolated:

- remaining spacing/hierarchy/blur/glow polish without redesigning architecture;
- mobile/accessibility pass;
- loading/empty/error states;
- reduced repeated copy;
- trusted venue display;
- CTA/conversion analytics;
- admin queue ergonomics;
- saved-match UX;
- historical premium demonstration clarity.

They must not depend on migration 0038 or v2 analytical tables.

## V2 UX

- general statistical reading;
- principal/risk/alternate scenario families;
- supporting and contradicting evidence;
- source/cutoff/reliability display;
- full score-distribution reveal;
- structured localization;
- post-match path/family evaluation;
- clear proprietary boundary.

## Internationalization

After v2 is stable and merged:

- extract translation keys;
- add English public/product copy;
- preserve locale-neutral canonical entities;
- test Spanish fallback/regression;
- defer Portuguese until later evidence/need.

## Commercial

- keep one Pase Mundial product until evidence justifies more;
- use historical premium examples as proof of depth;
- never imply guaranteed results;
- PayPal/other provider is a separate epic;
- Hotmart is a strategic channel decision, not a drop-in checkout.

## Deferred

- PWA/offline;
- broad redesign;
- full multi-language launch;
- second payment provider implementation;
- automatic result verification;
- v3 model branding.
