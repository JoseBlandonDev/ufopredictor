# ARCHITECTURE SUMMARY — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

This is a secondary architecture reference. Active project state is defined by `START_HERE_FOR_NEW_CONVERSATIONS.md`, `CURRENT_PROJECT_STATUS.md`, and `CODEX_HANDOFF_CURRENT.md`.

## High-Level Architecture

UFO Predictor is a Next.js application backed by Supabase.

Major layers:

- App Router pages;
- Supabase server client factories;
- database migrations and RLS policies;
- deterministic prediction engine;
- Lab evaluation utilities;
- entitlement/permission logic;
- future AI explanation layer.

## Current Implemented Surfaces

- `/admin/beta-lab` — internal Lab Admin Flow.
- `/predictions` — public predictions from DB.
- `/pricing` — active plan catalog from DB.
- `/dashboard` — authenticated viewer access summary from DB.

## Still Mock Or Not Implemented

- `/matches/[slug]` remains mock.
- Worker runs remain mock.
- Transparency metrics remain simulated.
- Payments/Stripe not implemented.
- Odds not implemented.
- LLM not implemented.
- Sports API not implemented.

## Database / Supabase

Remote Supabase has manual migrations applied through:

```txt
0012_plans_entitlements_backend.sql
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

## Prediction Architecture

The model calculates probabilities.

AI explanations can later explain model outputs but must not replace deterministic model calculations.

## Recommended Next Architecture Step

Implement public/free-only match detail from DB.

This should reuse public scope constraints and avoid premium data entirely.
