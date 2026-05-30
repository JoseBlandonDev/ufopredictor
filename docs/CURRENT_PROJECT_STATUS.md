# CURRENT PROJECT STATUS — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


## Executive Summary

UFO Predictor now has a working public/freemium foundation:

- public predictions from Supabase;
- public match detail from Supabase;
- plans and entitlements backend;
- premium access enforcement skeleton;
- Registered Free value wall;
- Anonymous vs Registered Free presentation and DTO boundary;
- saved matches/watchlist foundation for Registered Free.

The next major block is C06 — World Cup Premium Package Foundation.

## Latest PRs

| PR | Title | Status |
|---:|---|---|
| #25 | `feat: add premium match access enforcement skeleton` | Done |
| #26 | `feat: add registered free value wall` | Done |
| #27 | `docs: update project context after c05 gate 1` | Done |
| #28 | `feat: shape anonymous prediction payload server-side` | Done |
| #29 | `Feature/registered free saved matches` | Done |

## Current Supabase State

Remote Supabase is manually applied through:

```txt
0014_user_saved_matches.sql
```

Applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`
- `0013_public_match_detail_projection_hardening.sql`
- `0014_user_saved_matches.sql`

Supabase CLI local is not the normal workflow. The user applies migrations manually in Supabase SQL Editor.

## Current Product States

### Anonymous

Anonymous users can:

- view public match metadata;
- view complete public 1X2 probabilities;
- see confidence/risk teaser messaging;
- see registration CTAs;
- see CTA to save matches but cannot save them.

Anonymous users should not receive:

- `confidenceScore` / `riskLevel` in shaped UI DTO;
- premium payload;
- premium markets/narratives/results.

### Registered Free

Registered Free users can:

- view public metadata and complete 1X2 probabilities;
- receive confidence/risk in shaped DTO and UI;
- see richer context and preview messaging;
- save/remove public matches from match detail;
- view saved matches in dashboard.

Registered Free does not unlock premium payload.

### World Cup Premium User / Package Holder

Not implemented yet.

World Cup premium access is expected to be package/pass/unlock based and prepared in C06, with premium payload projection deferred to C07.

### Post-World-Cup Subscription User

Not implemented yet.

Monthly subscriptions are expected after the World Cup for recurring league coverage.

## Current Data Boundary

C05 introduced two layers:

1. Presentation boundary: anonymous sees teaser copy; registered free sees richer confidence/risk presentation.
2. Server-side DTO boundary: anonymous does not receive confidence/risk DTO fields; registered free does.

Current public views:

- `public_match_details` includes `match_id` for saved matches server-side resolution.
- `public_prediction_summaries` does not include `match_id`.

Premium/internal tables remain closed:

- `prediction_markets`
- `prediction_narratives`
- `prediction_results`

## Current Capture Foundation

C05 added:

```txt
public.user_saved_matches
```

Purpose:

- allow Registered Free users to save public matches;
- allow dashboard listing of saved matches;
- support future product interest signals and conversion without exposing premium payload.

Security posture:

- RLS enabled;
- own-row select/insert/delete;
- no update policy;
- `authenticated`: SELECT, INSERT, DELETE;
- `anon`: no access.

## Current Routes

| Route | Status |
|---|---|
| `/` | Public landing/value surface; may still include static featured cards |
| `/predictions` | Public predictions from DB; Anonymous DTO excludes confidence/risk |
| `/matches/[slug]` | Public match detail; saved match CTA/toggle |
| `/pricing` | DB-backed active plan catalog; no checkout |
| `/dashboard` | Access summary + saved matches list |
| `/admin/beta-lab` | Operational internal Lab/Admin flow |
| `/transparency` | Still simulated/mock |

## Completed Blocks

### C01 — Public Predictions From DB

Done.

### C02 — Plans & Entitlements Backend

Done.

### C03 — Match Detail Public From DB

Done.

### C04 — Premium Access Enforcement Skeleton

Done.

Key rules:

- `premium_user` alone does not unlock content.
- Active subscription alone does not unlock content.
- Pack quantity does not authorize content directly.
- Explicit entitlements/unlocks are the effective source of access.

### C05 — Anonymous vs Registered Free Freemium Boundary

Done.

Includes:

- Registered Free value wall;
- presentation boundary;
- server-side DTO shaping;
- saved matches/watchlist foundation.

## Next Block

```txt
C06 — World Cup Premium Package Foundation
```

Goal:

Prepare World Cup commercial packages/passes/unlocks without serving premium match payload yet.

Do not jump to C07 before C06 decisions are explicit.


## Context Preservation — Milestone History

This section intentionally preserves broader historical context so future ChatGPT/Codex handoffs do not lose why the current baseline exists.

| Phase / PR | What changed | Why it matters now |
|---|---|---|
| C01 / PR #20 | Public predictions read from Supabase | `/predictions` became DB-backed instead of mock-only. |
| C02 / PR #21 | Plans and entitlements backend | Created the commercial/access foundation used by pricing/dashboard and future C06 package work. |
| C03 / PR #23 | Public match detail from DB | `/matches/[slug]` became DB-backed through public-safe projections. |
| C03 hardening / `0013` | Explicit public views and anon hardening | `anon` reads approved views only, not base product tables directly. |
| C04 / PR #25 | Premium access enforcement skeleton | Introduced server-side resource/access logic without opening premium data. |
| C05 Gate 1 / PR #26 | Registered Free value wall | Differentiated Anonymous and Registered Free at UI/copy level. |
| C05 Gate 2A | Presentation boundary | Kept 1X2 public while changing confidence/risk presentation. |
| C05 Gate 2B / PR #28 | Server-side DTO shaping | Anonymous no longer receives `confidenceScore` / `riskLevel` in shaped UI payload. |
| C05 Gate 3 / PR #29 | Saved matches foundation | Registered Free users can save/remove public matches and see them in dashboard. |

## Active Public Surfaces

### `/predictions`

Current status:

- DB-backed from `public_prediction_summaries`.
- Anonymous receives metadata + complete 1X2 probabilities.
- Anonymous does not receive `confidenceScore` / `riskLevel` in the shaped DTO.
- Registered Free receives full confidence/risk presentation.
- No saved-match button in cards yet.
- No premium payload.

### `/matches/[slug]`

Current status:

- DB-backed from `public_match_details` and `public_prediction_summaries` as needed.
- Uses server-side viewer shaping for prediction confidence/risk.
- Shows saved-match CTA for Anonymous.
- Lets Registered Free save/remove public matches.
- Does not expose premium markets/narratives/results.

### `/dashboard`

Current status:

- Authenticated-only surface.
- Shows viewer access summary.
- Shows saved matches list from `user_saved_matches` + public match metadata.
- Does not serve premium prediction content.

### `/pricing`

Current status:

- Shows active catalog/plans from Supabase.
- No checkout/payments yet.
- World Cup premium packages remain future C06 work.

## Current Constraints Still In Force

- Do not use service role for normal UI paths.
- Do not serve premium payload until C07 or an explicitly approved premium projection gate.
- Do not treat visual locks, blurs, teasers, or CSS as authorization.
- Keep public UI copy Spanish for now.
- Prefer canonical English for internal keys/types/slugs/entitlement identifiers.
- Keep Supabase remote migration workflow manual unless explicitly changed.
