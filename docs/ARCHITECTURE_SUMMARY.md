# ARCHITECTURE SUMMARY — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

This is a secondary architecture reference. Active project state is defined by `START_HERE_FOR_NEW_CONVERSATIONS.md`, `CURRENT_PROJECT_STATUS.md`, and `CODEX_HANDOFF_CURRENT.md`.

## High-Level Architecture

UFO Predictor is a Next.js application backed by Supabase.

Major layers:

- App Router pages;
- Supabase server client factories;
- database migrations and RLS/grants policies;
- explicit public projection views;
- deterministic prediction engine;
- Lab evaluation utilities;
- entitlement/permission logic;
- future AI explanation layer.

## Current Implemented Surfaces

- `/admin/beta-lab` — internal Lab Admin Flow.
- `/predictions` — public predictions from DB via `public_prediction_summaries`.
- `/matches/[slug]` — public/free match detail from DB via `public_match_details` + `public_prediction_summaries`.
- `/pricing` — active plan catalog from DB.
- `/dashboard` — authenticated viewer access summary from DB.

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

## Still Mock Or Not Implemented

- Worker runs remain mock.
- Transparency metrics remain simulated.
- Landing featured predictions may still be simulated.
- Payments/Stripe not implemented.
- Odds not implemented.
- LLM not implemented.
- Sports API not implemented.
- Premium access enforcement not implemented.
- Premium match detail not implemented.

## Database / Supabase

Remote Supabase has manual migrations applied through:

```txt
0013_public_match_detail_projection_hardening.sql
```

Supabase CLI local is not configured.

All remote migrations are applied manually in Supabase SQL Editor.

## Access Architecture

C02 introduced entitlement foundations.

Rules:

- roles are not enough for premium content;
- subscriptions alone are not enough;
- protected content requires entitlement or unlock;
- beta access must be server-controlled;
- premium data must be filtered before reaching the browser.

C04 should create the premium enforcement skeleton.

## Prediction Architecture

The model calculates probabilities.

AI explanations can later explain model outputs but must not replace deterministic model calculations.

## Recommended Next Architecture Step

Implement premium access enforcement skeleton.

This should reuse C02 entitlements and C03 projection discipline while keeping premium data closed.
