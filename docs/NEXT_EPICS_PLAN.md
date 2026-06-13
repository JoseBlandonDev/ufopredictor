# Next Epics Plan - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Current position

MVP 1 basic public fixture operations are functional. The public prediction list is readable, verified final results can be shown, and the admin Lab is usable for ongoing fixture operations.

The next work should avoid reopening closed foundations unless a bug appears.

## Recommended next main epic: Premium Prediction Detail MVP

### Goal

Give paid/authenticated users more value than the public basic prediction while preserving internal/public boundaries.

### Suggested scope

- Top 3 probable scorelines with probabilities.
- Expected goals for both teams.
- BTTS probability.
- Over/Under 2.5 probability.
- Key model factors.
- Confidence/risk explanation.
- Clear "probability, not certainty" copy.

### Non-goals

- Do not expose `prediction_results`.
- Do not expose raw Lab/admin payloads.
- Do not use odds/provider predictions.
- Do not add signal refresh automation.
- Do not add venue metadata unless separately scoped.

### Branch

```powershell
git checkout -b feature/premium-prediction-detail-mvp
```

## Recommended parallel epic: Epic G - Product Platform and Monetization Foundations

### Goal

Let another contributor work in parallel on account, plans, billing, and product shell foundations while model/data/fixture operations continue separately.

### Suggested scope

- G01 Google auth/account UX polish.
- G02 Plans/pricing page MVP.
- G03 Payment provider spike.
- G04 Subscription/entitlement model proposal.
- G05 Premium gate UI shell.
- G06 Trust/legal/product copy.

### Non-goals

- Do not touch prediction engine.
- Do not touch API-Football ingest/apply.
- Do not touch signal packs.
- Do not expose `prediction_results`.
- Do not change public prediction projections unless explicitly scoped.
- Do not implement real payments before provider decision.

### Branch

```powershell
git checkout -b feature/product-platform-foundations
```

## Recommended next epic 2: Venue/Stadium Metadata

### Goal

Replace "Sede por confirmar" with reliable stadium/city data where possible.

### Required decisions

- Use API-Football venue data, manual World Cup venue map, or both?
- Store venue IDs/names/cities in existing tables or new controlled mapping?
- How to handle provider uncertainty?

### Branch

```powershell
git checkout -b feature/world-cup-venue-metadata
```

## Recommended next epic 3: Signal Refresh Strategy

### Goal

Keep FIFA/Elo/recent-form signal data reasonably fresh during the tournament without per-match manual chaos.

### First version

- Manual or semi-manual daily refresh.
- Rebuild signal pack.
- Review diff.
- Commit safe generated artifacts.
- Avoid per-match panic updates.

### Later version

- Worker/cron.
- Audit trail.
- Admin freshness indicator.
- Controlled source snapshots.

### Branch

```powershell
git checkout -b feature/national-team-signal-refresh-workflow
```

## Recommended ongoing operations

Continue exact fixture operations:

1. Discover fixture IDs.
2. Exact dry-run.
3. Exact apply after approval.
4. Save internal prediction.
5. Publish public prediction.
6. Verify final results.
7. Persist internal evaluation.
