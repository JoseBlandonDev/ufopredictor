# CHATGPT PROJECT SOURCE — UFO Predictor Current

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

This is the consolidated working source for ChatGPT conversations in the UFO Predictor project.

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


## Product thesis

UFO Predictor is a probabilistic football prediction product. It is not a sportsbook, does not take bets, and must not guarantee outcomes.

Permanent rule:

```text
The statistical model calculates. AI explains.
```

The product now focuses on a freemium conversion path:

```text
Anonymous → Registered Free → World Cup premium packages → post-World Cup monthly subscriptions
```

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


## Current product surfaces

- `/` — public landing, Spanish copy, selected preview/value messaging, still uses some mock featured match cards.
- `/predictions` — DB-backed public prediction board via `public_prediction_summaries`, now includes anonymous/authenticated free account messaging.
- `/matches/[slug]` — DB-backed public/free match detail via `public_match_details` and `public_prediction_summaries`, now includes anonymous/authenticated preview messaging.
- `/pricing` — reads active plans/catalog but clarifies free now, premium previews later, no checkout/payment yet.
- `/dashboard` — authenticated access surface, now explains Registered Free value and still shows access state/entitlements/unlocks.
- `/transparency` — still mock/simulated transparency metrics.
- `/admin/beta-lab` — internal admin Lab, not public product surface.

## Completed C-phase progress

| Epic/Gate | Status | Result |
|---|---:|---|
| C01 Public Predictions From DB | ✅ Done | `/predictions` uses `public_prediction_summaries`. |
| C02 Plans & Entitlements Backend | ✅ Done | `/pricing` and `/dashboard` read real plans/access summary. |
| C03 Match Detail Public From DB | ✅ Done | `/matches/[slug]` uses public DB projections. |
| C04 Premium Access Enforcement Skeleton | ✅ Done | Server-side access decision skeleton and tests, no premium payload. |
| C05 Gate 0 Product Audit | ✅ Done | Clarified anon/free/premium funnel. |
| C05 Gate 1 Registered Free Value Wall | ✅ Done | Spanish UI/copy value wall, no SQL/data boundary change. |

## Next C-phase work

### C05 Gate 2 — Data Boundary: Anonymous vs Registered Free

This is the next step. It should be recognition/planning first.

Questions:

- Should anonymous users continue seeing full 1X2 probabilities?
- What should Registered Free unlock beyond messaging?
- Which fields are public, free-authenticated, World Cup package, or post-World Cup subscription?
- Is a new Supabase projection needed?
- Is SQL/RLS required?
- What must remain reserved for World Cup premium packages?

### C05 Gate 3 — Registered Free Capture Foundation

Likely later. Potential scope:

- favorites
- watchlist
- team/competition preferences
- first-party engagement events
- beta preview interest signals

### C06 — World Cup Premium Package Foundation

Define package/pass products for the World Cup:

- Full World Cup Pass
- 10 Match Pack
- Single Match Unlock
- Country/Team Pass
- Group Pass
- Stage/Semifinals/Final Pass

### C07 — Entitled Premium Match Projection

Only after C05 Gate 2 and package boundary decisions. This serves premium payload through a safe projection/RPC/server-only query after C04 access enforcement.

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

