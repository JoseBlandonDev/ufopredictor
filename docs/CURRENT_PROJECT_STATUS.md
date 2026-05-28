# CURRENT PROJECT STATUS — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

## Executive status

UFO Predictor is now past the first public DB-backed product surfaces and has completed the initial premium access skeleton and registered-free value wall.

## Current baseline

- `main` includes PR #25: `feat: add premium match access enforcement skeleton`.
- `main` includes PR #26: `feat: add registered free value wall`.
- Working tree expected after sync: clean `main`.
- Supabase remote has manual migrations applied through `0013_public_match_detail_projection_hardening.sql`.
- Supabase CLI local is still not part of the normal workflow.
- Premium base tables remain closed to public product surfaces:
  - `prediction_markets`
  - `prediction_narratives`
  - `prediction_results`


## Current completed milestones

- Foundation app and Supabase setup: complete enough for current beta work.
- Auth and roles: active.
- Internal Lab: active at `/admin/beta-lab`.
- Public predictions: DB-backed.
- Public match detail: DB-backed public/free-only.
- Plans/entitlements backend: in place.
- Premium access skeleton: in place.
- Registered Free value wall: in place.

## Latest merged PRs

| PR | Title | Impact |
|---:|---|---|
| #25 | `feat: add premium match access enforcement skeleton` | Adds server-side access decision skeleton and tests. |
| #26 | `feat: add registered free value wall` | Adds Spanish UI/copy value wall for anonymous vs Registered Free. |

## Current product funnel

```text
Anonymous → Registered Free → World Cup premium packages → post-World Cup monthly subscriptions
```

Registered Free is not a temporary plan. It is the permanent authenticated free tier.

## Current public/user states

### Anonymous

Can see public product surfaces and basic public prediction/match information. Should be shown enough value to understand the product, but not receive everything.

### Registered Free

Has authenticated free access. Currently receives clearer value messaging and dashboard context. Future selected previews before the World Cup should create additional value and help validate model/product interest.

### World Cup premium packages

Planned for the World Cup phase. Expected to be package/pass based rather than monthly subscription based.

### Post-World Cup subscriptions

Expected after the World Cup for recurring coverage of American/European leagues.

## Current technical boundaries

- C05 Gate 1 did not change the data boundary.
- Anonymous and Registered Free still read from the same public projections where applicable.
- Premium base tables remain closed.
- No checkout or payment flow is active.
- `/transparency` remains mock/simulated.

## Next work

```text
C05 Gate 2 — Data Boundary: Anonymous vs Registered Free
```

Plan first. Do not implement SQL/RLS until the boundary is approved.

## Security rules

- Visual locks, blur, and teaser cards are not authorization.
- Premium payload must not be sent to the browser unless access has been authorized server-side.
- `premium_user` alone does not unlock protected content.
- Active subscription alone does not unlock protected content.
- `quantity` / `match_pack` does not grant direct access without explicit match unlock materialization.
- `trustedBetaFreeMatchIds` must be assembled server-side; never from client/query params.
- `stageAccessKey` must be canonical and server-derived, for example `competitionId:stage`.
- Do not use service role for normal product UI.

