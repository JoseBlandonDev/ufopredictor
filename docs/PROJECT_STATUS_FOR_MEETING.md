# PROJECT STATUS FOR MEETING — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

## One-Line Status

UFO Predictor now has internal Lab evaluation, public predictions from DB, and a backend foundation for plans/entitlements. Next step is real public match detail.

## Recently Completed

- PR #20 — Public predictions from DB.
- PR #21 — Plans and entitlements backend.

## What Works

- `/admin/beta-lab` internal workflow.
- `/predictions` public listing from Supabase.
- `/pricing` active plans from Supabase.
- `/dashboard` authenticated access summary from Supabase.

## What Is Still Mock

- `/matches/[slug]`.
- Worker runs.
- Transparency metrics.
- Landing featured predictions.

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

## Next Recommended Work

`feature/match-detail-public-from-db`

Connect `/matches/[slug]` to DB with public/free-only data.

Do not expose premium yet.
