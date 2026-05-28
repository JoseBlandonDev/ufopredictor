# PROJECT STATUS FOR MEETING — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


## One-Line Status

UFO Predictor now has internal Lab evaluation, public predictions from DB, public/free match detail from DB, plans/entitlements, a premium access skeleton, a registered-free value wall, and a first presentation-level split between anonymous and registered-free users.

## Recently Completed

- PR #20 — Public predictions from DB.
- PR #21 — Plans and entitlements backend.
- PR #23 — Public match detail from DB with public projection hardening.
- PR #25 — Premium access enforcement skeleton.
- PR #26 — Registered free value wall.
- PR #27 — Documentation refresh after C05 Gate 1.
- C05 Gate 2A — Presentation boundary without SQL, pending commit/PR if not merged yet.

## What Works

- `/admin/beta-lab` internal workflow.
- `/predictions` public listing from Supabase.
- `/matches/[slug]` public/free match detail from Supabase.
- `/pricing` active/beta plans from Supabase.
- `/dashboard` authenticated access summary from Supabase.
- Server-side/pure premium access decision skeleton.
- Public UI messaging for registered-free value.
- Presentation-level anonymous vs registered-free differentiation.

## What Is Still Mock Or Deferred

- Worker runs.
- Transparency metrics.
- Landing featured predictions may still be simulated.
- C05 Gate 2B real data boundary.
- Registered free capture: favorites/watchlist/preferences.
- Premium match detail.
- Actual premium payload projection.
- Payments/Stripe.
- Odds.
- LLM.
- Sports API.
- i18n EN/ES.

## Product Strategy

Controlled beta/freemium before the World Cup.

Show enough free value to learn and build trust, but do not give away all premium data.

No mass promotion until results, UX, costs, and infrastructure are validated.

Current funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World Cup monthly subscriptions
```

## Commercial Direction

Use few visible plans/packages and granular internal permissions.

World Cup package candidates:

- Free Account.
- Pack of 10 matches.
- World Cup Full Pass.
- Single Match Unlock.
- Country/Team Pass.
- Group Pass.
- Semifinals / Final Pass.

Monthly subscriptions are expected after the World Cup for recurring league coverage.

## Key Risks

- Premium data leakage if frontend-only locks are used.
- Treating Gate 2A as real data security when it is presentation only.
- Costs when scaling beyond free tiers.
- Sports/odds API provider cost and reliability.
- Model reputation if beta is promoted too aggressively before validation.
- Broad authenticated grants eventually need review without breaking Lab/Admin.

## Next Recommended Work

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

Decide whether to formalize anonymous vs registered-free separation at DB/query level before moving into capture foundation or premium package work.
