# PROJECT STATUS FOR MEETING — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

## One-Line Status

UFO Predictor now has internal Lab evaluation, public predictions from DB, public/free match detail from DB, and a backend foundation for plans/entitlements. Next step is premium access enforcement skeleton.

## Recently Completed

- PR #20 — Public predictions from DB.
- PR #21 — Plans and entitlements backend.
- PR #22 — Documentation refresh after C02.
- PR #23 — Public match detail from DB with public projection hardening.

## What Works

- `/admin/beta-lab` internal workflow.
- `/predictions` public listing from Supabase.
- `/matches/[slug]` public/free match detail from Supabase.
- `/pricing` active plans from Supabase.
- `/dashboard` authenticated access summary from Supabase.

## What Is Still Mock Or Deferred

- Worker runs.
- Transparency metrics.
- Landing featured predictions may still be simulated.
- Premium match detail.
- Premium access enforcement.
- Payments/Stripe.
- Odds.
- LLM.
- Sports API.

## Product Strategy

Controlled beta/freemium before the World Cup.

Show enough free value to learn and build trust, but do not give away all premium data.

No mass promotion until results, UX, costs, and infrastructure are validated.

## Commercial Direction

Use few visible plans and granular internal permissions.

Possible plans:

- Free
- Pack of 10 matches
- World Cup Pass
- Team Pass
- Semifinals / Final
- Premium monthly later

## Key Risks

- Premium data leakage if frontend-only locks are used.
- Costs when scaling beyond free tiers.
- Sports/odds API provider cost and reliability.
- Model reputation if beta is promoted too aggressively before validation.
- Broad authenticated grants eventually need review without breaking Lab/Admin.

## Next Recommended Work

```txt
feature/premium-access-enforcement-skeleton
```

Create server-side premium enforcement patterns before serving premium data.
