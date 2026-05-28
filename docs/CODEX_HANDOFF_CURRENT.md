# CODEX HANDOFF CURRENT — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

Use this document to hand off the current repo state to Codex.

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


## Current branch expectation

Start from clean `main`.

```bash
git checkout main
git pull origin main
git status
git log --oneline -8
```

Expected recent commits include:

- `feat: add registered free value wall (#26)`
- `feat: add premium match access enforcement skeleton (#25)`

## Completed work since previous docs baseline

### PR #25 / C04

Premium access enforcement skeleton:

- `PremiumMatchResource`
- `resolvePremiumMatchAccess()`
- canonical `stageAccessKey`
- server-only helper
- tests

No SQL, no RLS/grants, no premium payload.

### PR #26 / C05 Gate 1

Registered Free value wall:

- Spanish public copy
- anonymous/authenticated messaging on `/predictions` and `/matches/[slug]`
- dashboard free value messaging
- pricing roadmap/free-now/premium-later messaging

No SQL, no RLS/grants, no data boundary change, no premium payload.

## Next Codex task should be recognition first

```text
C05 Gate 2 — Data Boundary: Anonymous vs Registered Free
```

Do not implement first. Inspect and recommend.

## Scope for C05 Gate 2 recognition

Inspect:

- `app/page.tsx`
- `app/predictions/page.tsx`
- `app/matches/[slug]/page.tsx`
- `app/pricing/page.tsx`
- `app/dashboard/page.tsx`
- `components/public-prediction-card.tsx`
- `components/plan-card.tsx`
- `lib/supabase/public-prediction-queries.ts`
- `lib/supabase/public-match-detail-queries.ts`
- `lib/supabase/viewer-access-queries.ts`
- `lib/permissions/entitlements.ts`
- `types/database.ts`
- migrations `0011`, `0012`, `0013`

Answer:

- what anonymous sees today;
- what Registered Free sees today;
- what should remain public;
- what should move behind free registration;
- what should be reserved for World Cup premium packages;
- whether SQL/RLS/new views are required;
- risks to premium data boundaries.

## Product decisions added in this refresh

### User funnel

The active product funnel is:

```text
Anonymous → Registered Free → World Cup premium packages → post-World Cup monthly subscriptions
```

There is no separate `beta/free expanded` plan. `Registered Free` is the permanent free authenticated user state.

### Registered Free

Registered Free exists before, during, and after the World Cup. What changes is the amount of preview access granted by product/editorial policy:

- Pre-World Cup: more generous selected previews to validate the model, UX, and user interest.
- World Cup: free users still receive value beyond anonymous users, but premium package value is protected.
- Post-World Cup: free remains useful for discovery and retention while monthly subscriptions become relevant for recurring league coverage.

### World Cup monetization

Premium packages are intended for the World Cup phase. Candidate products include:

- World Cup Full Pass
- 10 Match Pack
- Single Match Unlock
- Country/Team Pass
- Group Pass
- Stage Pass, including semifinals/final style passes

Monthly subscriptions are expected after the World Cup for American and European leagues and recurring coverage.

### Language

- Public UI now remains Spanish until an i18n pass is planned.
- Future public UI should support English and Spanish.
- Internal data, keys, identifiers, types, slugs, and model terminology should prefer canonical English.
- Do not mix new public copy into accidental Spanglish.


## Security rules

- Visual locks, blur, and teaser cards are not authorization.
- Premium payload must not be sent to the browser unless access has been authorized server-side.
- `premium_user` alone does not unlock protected content.
- Active subscription alone does not unlock protected content.
- `quantity` / `match_pack` does not grant direct access without explicit match unlock materialization.
- `trustedBetaFreeMatchIds` must be assembled server-side; never from client/query params.
- `stageAccessKey` must be canonical and server-derived, for example `competitionId:stage`.
- Do not use service role for normal product UI.


## Codex prompt format rule

ChatGPT must separate execution guidance from the copyable Codex prompt.

### EJECUCIÓN RECOMENDADA

This block is for the user. It should include:

- tool
- model
- intelligence level
- task size
- risk
- reason
- whether PowerShell/manual work is enough

### PROMPT LIMPIO PARA CODEX

This block is the only block intended to be copied into Codex. It should contain the task instructions and must not be polluted with model/tool meta-commentary.

Use manual PowerShell for simple `git status`, `git diff`, validations, commit, push, and PR flow when the user is already comfortable doing it. Use Codex for code/doc changes, and reserve GPT-5.5 or high intelligence for SQL, RLS, auth, entitlements, server-side access, premium filtering, and other sensitive security work.

