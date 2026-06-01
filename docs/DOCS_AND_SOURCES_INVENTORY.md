# DOCS AND SOURCES INVENTORY — UFO Predictor

_Last updated: post C07 / pre C08_

Current baseline: `main` is post PR #32 (`Feature/c07 premium match projection`). C01–C07 are functionally closed. Next major block: C08 — Trust / Transparency Real v0.1.


This inventory lists active documentation sources and how they should be used.

## Source Priority

Use these as active sources:

1. `START_HERE_FOR_NEW_CONVERSATIONS.md`
2. `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
3. `CURRENT_PROJECT_STATUS.md`
4. `CODEX_HANDOFF_CURRENT.md`
5. `EPIC_PROGRESS_MATRIX.md`
6. `NEXT_EPICS_PLAN.md`
7. `ROADMAP_AND_BACKLOG.md`
8. `OPEN_DECISIONS.md`
9. `DATA_DICTIONARY.md`
10. `CODEX_WORKFLOW.md`
11. `IMPLEMENTATION_PLAN.md`
12. `ARCHITECTURE_SUMMARY.md`
13. `MODEL_V01.md`
14. `PROJECT_CONTEXT_UFO_PREDICTOR.md`
15. `PROJECT_STATUS_FOR_MEETING.md`

Older prompt files should be treated as historical if they contradict active sources.

## Active Documents

### `START_HERE_FOR_NEW_CONVERSATIONS.md`

Primary onboarding document for new ChatGPT/Codex/handoff sessions.

Should contain:

- current baseline;
- Supabase remote state;
- workflow rules;
- current route state;
- next recommended block.

### `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`

Compact-but-complete project source for ChatGPT context.

Should contain:

- project identity;
- current funnel;
- key security rules;
- active route/data state;
- next block.

### `CURRENT_PROJECT_STATUS.md`

Status snapshot.

Should contain:

- latest PRs;
- completed blocks;
- current Supabase state;
- current product/user states;
- next block.

### `CODEX_HANDOFF_CURRENT.md`

Operational handoff for Codex.

Should contain:

- current repo baseline;
- what Codex may or may not touch;
- Supabase workflow;
- route/data state;
- validation expectations.

### `CODEX_WORKFLOW.md`

Tool/process rules.

Should contain:

- ChatGPT vs Codex vs manual PowerShell split;
- prompt format;
- Git/PR discipline;
- documentation refresh discipline;
- Supabase migration workflow.

### `DATA_DICTIONARY.md`

Current data objects and views.

Should include:

- public views;
- `user_saved_matches`;
- entitlement tables;
- premium/internal tables;
- key access concepts.

### `EPIC_PROGRESS_MATRIX.md`

Epic/gate completion matrix.

Should show C01–C05 done and C06 next.

### `NEXT_EPICS_PLAN.md`

Forward plan.

Should prioritize C06 and identify C07/C08 and later tracks.

### `ROADMAP_AND_BACKLOG.md`

Roadmap and backlog.

Should preserve future tracks D/E/F/G and avoid destructive summarization.

### `OPEN_DECISIONS.md`

Active and closed decisions.

Should preserve decisions around freemium, packages, permissions, saved matches, providers, payments, staging, i18n.

### `IMPLEMENTATION_PLAN.md`

Implementation sequencing.

Should preserve completed blocks and future implementation constraints.

### `ARCHITECTURE_SUMMARY.md`

Architecture-level overview.

Should describe current public product, Supabase boundaries, entitlements, saved matches, and future premium projection.

### `MODEL_V01.md`

Prediction model principles.

Should preserve that the statistical model calculates and AI explains.

### `PROJECT_CONTEXT_UFO_PREDICTOR.md`

Human-readable project context.

Useful for collaborators and broad overview.

### `PROJECT_STATUS_FOR_MEETING.md`

Meeting-ready status brief.

Should stay concise and non-technical enough for stakeholder discussion.

## Documentation Refresh Rule

Do not update docs after every small step.

Refresh docs when:

- closing a stage;
- changing conversation;
- preparing handoff;
- changing architecture/product decisions.

## Preservation Rule

Do not replace broad docs with tiny summaries.

When refreshing:

- update baseline;
- add new decisions;
- correct obsolete state;
- preserve historical/operational context;
- avoid deleting useful future backlog.

## Current Refresh Context

This refresh closes C05 and prepares C06.

It includes:

- PR #28;
- PR #29;
- C05 complete;
- Supabase up to 0014;
- saved matches foundation;
- updated workflow rules from C05.

## Current Refresh Context — Post C07

These docs now reflect:

- PR #31 — C06 World Cup Package Foundation.
- PR #32 — C07 Entitled Premium Match Projection.
- Supabase remote manually applied through `0016_premium_match_projection.sql`.
- Next block: C08 — Trust / Transparency Real v0.1.

Source priority remains unchanged: these project source docs should be treated as the shared context for ChatGPT and Codex.


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
