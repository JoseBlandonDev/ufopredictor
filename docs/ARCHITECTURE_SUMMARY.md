# ARCHITECTURE SUMMARY — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


This is a secondary architecture reference. Active project state is defined by `START_HERE_FOR_NEW_CONVERSATIONS.md`, `CURRENT_PROJECT_STATUS.md`, and `CODEX_HANDOFF_CURRENT.md`.

## High-Level Architecture

UFO Predictor is a Next.js application backed by Supabase.

Major layers:

- App Router pages;
- Supabase server/client factories;
- database migrations and RLS/grants policies;
- explicit public projection views;
- deterministic prediction engine;
- Lab evaluation utilities;
- entitlement/permission logic;
- future premium projection layer;
- future AI explanation layer.

## Current Implemented Surfaces

- `/admin/beta-lab` — internal Lab Admin Flow.
- `/predictions` — public predictions from DB via `public_prediction_summaries`.
- `/matches/[slug]` — public/free match detail from DB via `public_match_details` + `public_prediction_summaries`.
- `/pricing` — active/beta plan catalog from DB.
- `/dashboard` — authenticated viewer access summary from DB.
- `/` — public landing/value surface, still may include static/mock featured matches.
- `/transparency` — simulated transparency surface.

## Public Projection Architecture

C03 introduced `0013_public_match_detail_projection_hardening.sql`.

It created:

- `public_match_details`
- `public_prediction_summaries`

These views are the approved public/free anonymous read interface for prediction listing and match detail.

Security posture:

- `anon` reads the public views only;
- `anon` does not read base public product tables directly;
- premium-sensitive tables remain closed;
- `authenticated` grants needed by Lab/Admin are intentionally preserved for now.

## C05 Gate 2A Presentation Architecture

C05 Gate 2A added presentation-level differentiation using existing public fields.

It did not add:

- SQL;
- RLS;
- migrations;
- new views;
- query changes;
- premium tables;
- premium payload.

Therefore Gate 2A is not a true backend/data boundary.

If future fields are sensitive, they must be filtered before reaching the browser.

## Premium Access Architecture

C04 created a premium access enforcement skeleton.

Rules:

- roles are not enough for premium content;
- subscriptions alone are not enough;
- protected content requires entitlement or unlock;
- beta access must be server-controlled;
- `stageAccessKey` must be canonical;
- `match_pack` quantity must materialize unlocks;
- premium data must be filtered before reaching the browser.

C07 should later consume this access layer for actual premium projections.

## Still Mock Or Not Implemented

- Worker runs remain mock.
- Transparency metrics remain simulated.
- Landing featured predictions may still be simulated.
- Payments/Stripe not implemented.
- Odds not implemented.
- LLM not implemented.
- Sports API not implemented.
- C05 Gate 2B real data boundary not implemented.
- Premium match detail not implemented.
- i18n EN/ES not implemented.

## Database / Supabase

Remote Supabase has manual migrations applied through:

```txt
0013_public_match_detail_projection_hardening.sql
```

Supabase CLI local is not configured as the normal workflow.

All remote migrations are applied manually in Supabase SQL Editor.

## Prediction Architecture

The model calculates probabilities.

AI explanations can later explain model outputs but must not replace deterministic model calculations.

## Recommended Next Architecture Step

Decide C05 Gate 2B: whether Anonymous vs Registered Free separation needs real backend projection/RLS/RPC/server-only shaping before C06/C07.
