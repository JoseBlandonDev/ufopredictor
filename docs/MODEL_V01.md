# MODEL V01 — UFO Predictor

_Last updated: post C07 / pre C08_

Current baseline: `main` is post PR #32 (`Feature/c07 premium match projection`). C01–C07 are functionally closed. Next major block: C08 — Trust / Transparency Real v0.1.


## Product Principle

```txt
The statistical model calculates.
The AI explains.
```

The model, not an LLM narrative layer, must be the source of prediction probabilities.

## Current Prediction Surface

The current public product exposes:

- match metadata;
- public 1X2 probabilities;
- confidence/risk for Registered Free;
- confidence/risk teaser for Anonymous.

After C05 Gate 2B, Anonymous users do not receive confidence/risk fields in the shaped UI DTO.

## Current Public Prediction Data Path

Public predictions are read from:

```txt
public_prediction_summaries
```

This view contains public prediction summary columns. UI shaping determines what each viewer receives.

## Current Match Detail Data Path

Public match details are read from:

```txt
public_match_details
```

This view now includes `match_id` only to support saved matches server-side resolution for public matches.

## Model Outputs Currently Public

Public/free product may show:

- home win probability;
- draw probability;
- away win probability.

Registered Free may also see:

- confidence score;
- risk level.

## Premium Candidate Outputs

Potential future premium outputs include:

- scorelines;
- expected goals;
- BTTS;
- over/under;
- Model vs Market;
- Golden Hour Delta;
- deeper narratives;
- post-result evaluation details;
- historical/trust explanations beyond public summary.

These must not be exposed until a protected premium projection is implemented.

## LLM Narrative Rule

LLMs may eventually help explain model output, but must not invent prediction probabilities.

Narratives should be constrained by persisted model output and product-safe fields.

## Trust / Transparency

Current `/transparency` remains simulated/mock.

Future trust work must distinguish:

- internal Lab evaluation;
- beta calibration;
- public trust-eligible performance.

Do not use early or internal calibration data as finished public trust evidence.

## Premium Projection Model Boundary After C07

C07 does not change the core model principle:

```txt
The model calculates. The AI explains.
```

C07 only changes how authorized users can receive deeper product projection data.

Allowed premium v1 projection:

- selected premium markets;
- selected premium narrative fields.

Still excluded:

- `prediction_results`;
- internal lab evaluation metrics;
- raw/debug fields.

C08 may introduce real trust/transparency, but must decide a safe product-facing abstraction instead of dumping internal evaluation tables.


---

## Post C07 Baseline Update

Current merged baseline:

```txt
main includes PR #31 — Feature/c06 world cup package foundation
main includes PR #32 — Feature/c07 premium match projection
Completed: C01–C07
Next: C08 — Trust / Transparency Real v0.1
Supabase remote manually applied through: 0016_premium_match_projection.sql
```

### C06 Closure Summary

C06 — World Cup Premium Package Foundation is complete.

Implemented:

- C06B: World Cup package mapping helpers.
- C06D: World Cup 2026 pricing preview without checkout.
- C06E: pure package intent materialization simulation without DB writes.
- C06G: canonical World Cup access keys.
- C06C: explicitly resolved as a defer decision, not forgotten.

C06C decision:

- No DB package catalog yet.
- No `plans` / `plan_features` seeds for World Cup packages yet.
- No `package_catalog` table yet.
- No 10 Match Pack ledger yet.

Reason: World Cup packages are still flexible commercial templates, not final persisted products. The project needs room for team-only passes, group passes, stage passes from octavos/cuartos/semis/final, semifinals/final bundles, single-match unlocks, flexible match packs, and other demand-based combinations.

### C07 Closure Summary

C07 — Entitled Premium Match Projection is complete.

Implemented:

- C07A: `PremiumMatchResource` contract and canonicalization.
- C07B.1: public-safe match access context SQL.
- C07B.2: server-side premium access gate context.
- C07C: premium projection contract and shaping helper.
- C07D: `premiumProjection` wired into match detail DTO.
- C07E.1: allowed premium payload selectors.
- C07E.2: protected premium match projection RPC.
- C07E.3: protected premium query integration and minimal authorized rendering.

C07 security boundary:

- Premium payload is queried only when `premiumAccess.status === "authorized"`.
- `locked` and `unavailable` never call the premium RPC and never contain payload.
- Authorized null/error responses become `authorized_unavailable`.
- Premium payload is filtered through selectors/whitelists before DTO output.
- `prediction_results` remains excluded from product premium projection.
- No service role is used for normal UI.
- No checkout, PayPal, Stripe, or payments were implemented.
- No entitlement/unlock inserts were implemented.

### C07 SQL Applied Manually

Remote Supabase was manually updated through:

```txt
0016_premium_match_projection.sql
```

New C07 migrations applied manually and validated:

- `0015_public_match_access_context.sql`
  - extends `public_match_details` with public-safe access context:
    `competition_id`, `competition_access_key`, `home_team_id`, `away_team_id`.
- `0016_premium_match_projection.sql`
  - creates `public.get_premium_match_projection(p_match_id uuid)`.
  - `SECURITY DEFINER` with safe `search_path`.
  - `anon` cannot execute.
  - `authenticated` can execute.
  - `auth.uid()` is required.
  - returns only allowed premium markets/narratives after DB-side authorization.
  - does not expose `prediction_results`.

### Payments / Provider Decision

Do not assume Stripe.

Because the project/user is Colombia-based, Stripe should not be assumed available directly without a supported-country structure such as an LLC/company in a supported country.

PayPal is currently a likely candidate. Other Colombia-compatible payment gateways must be evaluated before checkout/fulfillment.

No checkout, PayPal integration, Stripe integration, or payments were implemented in C06/C07.

### Workflow Decisions To Preserve

SQL/migrations:

- Codex may create SQL files/migrations.
- The user applies SQL manually in Supabase SQL Editor.
- Never assume a migration is applied remotely until the user confirms validation results.
- SQL validation queries must be provided with migrations.
- Current remote is manually applied through `0016_premium_match_projection.sql`.

Git:

- The user handles simple Git manually.
- During an epic/feature branch, use small local commits per logical subtask.
- Do not push for every subtask.
- Push/PR when the full functional block is ready for review/merge, unless backup/review requires earlier push.
