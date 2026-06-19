# Next Epics Plan - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Immediate sequence

### 1. Documentation closeout

Merge the post-PR94 documentation refresh, including model evidence, signal-refresh procedure, current monetization state, and launch ownership rules.

### 2. New conversation / Data Ops 05

Start from refreshed sources. Monitor the current four public fixtures and process exact final results. Load/publish the next runway only after fixture-level sanity review.

### 3. UIHISTORY01

Small focused UI slice:

- 4 recent results on `/predictions`;
- `Ver historial completo`;
- `/predictions/history`;
- verified finished rows only;
- server pagination, 12 per page;
- existing card reuse.

## Model/data next

### Signal refresh cadence

Trigger after a meaningful result/ranking batch, not after every surprise. Use the new quality-gated source-package workflow.

### Model monitoring

Track fair stored metrics. Do not use current-signal recomputations as fair backtests.

### Future xG project

Research structural scoreline compression only after a larger clean sample and a separate experimental plan.

## Launch-week Epic G parallel plan

### G09 Mobile/responsive polish

Fix layout, overflow, touch targets, cards, navbar, pricing/account/premium/payment presentation.

### G10 PWA installability

Manifest, icons, standalone metadata, Android/iOS installability. No dynamic/payment/auth caching.

### G11 Update/offline safety

Optional follow-up; defer if service worker creates launch risk.

### G12 Accessibility/performance

Lighthouse, keyboard/focus, contrast, responsive performance, CLS/LCP, console cleanup.

### G13 Cross-device smoke

Android Chrome, iOS Safari, desktop Chrome/Edge/Firefox, and anonymous/free/premium/admin/payment flows.

### G14 Ownership

Assign file ownership before work. Parallel UI/PWA branches must not edit canonical docs, model/ingest/results, migrations, Wompi webhook, or entitlement activation.

## Separate follow-ups

- Real Fixture Lab stack overflow cleanup.
- Venue/stadium metadata.
- G08 trust/legal final pass.
