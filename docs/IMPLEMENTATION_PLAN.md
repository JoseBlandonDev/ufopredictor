# Implementation Plan - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Completed implementation blocks

- Public prediction MVP.
- Protected premium prediction detail.
- Registered-free probable-score gate.
- Result Review and Evaluation queues.
- Real Fixture Publish Queue.
- Torneo Mundialista admin export.
- Wompi checkout/payment activation.
- Automatic premium entitlement.
- Premium-active UX.
- Admin price/payment controls.
- SIGNAL04 and DRAW01 through PR #94.

## Current implementation freeze

Do not reopen model code during the documentation closeout. `expected-goals.ts` remains unchanged. SIGNAL04/DRAW01 are accepted for the current operational cycle.

## Next focused implementation candidates

### Data Ops 05

Exact-fixture result processing and next-runway publication. No broad apply.

### UIHISTORY01

Likely files:

- `app/predictions/page.tsx`;
- `app/predictions/history/page.tsx`;
- `lib/supabase/public-prediction-queries.ts`;
- focused tests.

No public contract or card redesign required for MVP.

### G09 Mobile/Responsive

Visual-only and test scope. Coordinate navbar/account/pricing/payment presentation ownership.

### G10 PWA Installability

Manifest/icons/metadata only for MVP. Avoid service-worker caching of auth, admin, API, Supabase, Wompi, premium, or dynamic predictions.

### G12 Accessibility/Performance

Audit and targeted fixes without model/payment business logic changes.

### G13 Production Smoke

Role/device matrix including payment and premium activation.

### Real Fixture Lab cleanup

Separate admin bug/refactor. Do not couple to runway publication.

## Validation expectations

Code slices:

```bash
git diff --check
npm run test -- <targeted-tests>
npm run lint
npm run build
git status --short
```

Docs slices:

- docs-only diff;
- stale contradiction search;
- cross-document metric/status consistency;
- no protected runbook edits unless assigned.
