# START HERE FOR NEW CONVERSATIONS — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

Use this file first when starting a new ChatGPT conversation inside the UFO Predictor project.

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


## What was completed since the previous docs refresh

### C04 — Premium Access Enforcement Skeleton ✅

Merged as PR #25.

Implemented:

- `PremiumMatchResource`
- `resolvePremiumMatchAccess()`
- canonical `stageAccessKey`
- server-only access decision helper
- pure tests for match, competition, team, stage, global, unlock, beta grant, admin bypass, and denial cases

C04 did not:

- create SQL
- change RLS/grants
- touch Supabase remote
- open premium tables
- serve premium payload

### C05 Gate 0 — Anonymous vs Registered Free Product Audit ✅

Completed as recognition/product decision, not code.

Main finding: registering free did not yet create enough visible value beyond the anonymous experience. The product funnel was clarified.

### C05 Gate 1 — Registered Free Value Wall ✅

Merged as PR #26.

Implemented UI/copy improvements in Spanish:

- `/` now explains public value, registered free previews, and premium later.
- `/predictions` has anonymous vs authenticated messaging.
- `/matches/[slug]` has anonymous vs authenticated preview messaging.
- `/dashboard` communicates free user value, not only technical access state.
- `/pricing` clarifies free account now, premium packages/catalog preview later, and no checkout/payment yet.

Gate 1 did not change data boundaries, SQL, RLS, Supabase remote, or premium payload.

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


## Current next step

Next recommended work:

```text
C05 Gate 2 — Data Boundary: Anonymous vs Registered Free
```

Purpose:

- decide what anonymous users can see;
- decide what Registered Free users can see;
- decide what must be reserved for World Cup premium packages;
- determine whether new views/projections, SQL, or RLS are required;
- keep premium base tables closed.

Do not jump directly to premium payload before Gate 2 is decided.

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


## Recommended first prompt for the next ChatGPT conversation

```text
We are continuing UFO Predictor from baseline post PR #26 / C05 Gate 1.

Main is expected to include:
- PR #25: feat: add premium match access enforcement skeleton
- PR #26: feat: add registered free value wall

Current task is to plan C05 Gate 2 — Data Boundary: Anonymous vs Registered Free.
Do not implement yet. First review the updated docs, summarize current status, confirm open decisions, and prepare a Codex recognition prompt with execution recommendation separated from the clean prompt.

Important product decisions:
- User funnel: Anonymous → Registered Free → World Cup premium packages → post-World Cup monthly subscriptions.
- Registered Free is permanent, not a separate beta plan.
- Pre-World Cup selected previews are used to validate the model/UX and capture registrations.
- World Cup monetization is expected to be package/pass based.
- Monthly subscriptions are expected after the World Cup for recurring league coverage.
- Public UI is currently Spanish; future i18n EN/ES is planned but not implemented.
- Internal data/keys/types should prefer canonical English.

Security rules:
- Visual locks are not authorization.
- Do not open prediction_markets, prediction_narratives, or prediction_results.
- Do not send premium payload to the browser without server-side authorization.
```
