# OPEN DECISIONS — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


## O01 — Anonymous vs Registered Free Real Data Boundary

Decision status: Open / C05 Gate 2B.

C05 Gate 2A implemented only a presentation boundary.

Current Gate 2A decision:

- Anonymous keeps match metadata + complete public 1X2 probabilities.
- Anonymous sees confidence/risk as basic signal/teaser.
- Registered Free sees confidence/risk fully rendered with additional context.
- Preview signals remain placeholder/teaser.
- No SQL/RLS/migrations/new views/query changes.
- No premium tables and no premium payload.

Open Gate 2B question:

Should this become a real backend/data boundary?

Options:

1. Keep current presentation boundary temporarily.
2. Create separate anonymous and registered-free projection views.
3. Use RPC/server-only query shaping.
4. Use RLS where appropriate.

This must be decided before adding any sensitive fields that should not reach Anonymous users.

## D01 — Public vs Internal Scope

Current decision:

- `internal_lab` remains internal.
- `public_product` powers public product views.
- `/predictions` uses only public/product-safe data.
- `/matches/[slug]` uses only public/free-safe data through explicit public views.
- C05 Gate 2A did not change the DB/data boundary.

Status: Mostly resolved for public/free surfaces. Still relevant for Gate 2B and premium projections.

## D02 — Supabase Migration Workflow

Decision:

Supabase CLI local is not configured as the normal workflow.

Codex creates migration SQL files but does not apply remote migrations.

The user applies every remote migration manually in Supabase SQL Editor.

Every migration must include manual validation queries.

Remote Supabase is currently applied manually through:

```txt
0013_public_match_detail_projection_hardening.sql
```

Status: Resolved as operating rule.

## D03 — Beta/Freemium Strategy

Decision:

Run a controlled organic beta/freemium phase before the World Cup.

Funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World Cup monthly subscriptions
```

Registered Free is permanent, not a separate temporary beta/free expanded plan.

The beta should:

- show useful free value;
- avoid giving away all premium data;
- avoid mass advertising until validation improves;
- use finals, friendlies, and pre-World Cup fixtures for learning;
- capture Registered Free users before World Cup package monetization.

Status: Current product direction.

## D04 — Plans vs Permissions

Decision:

Use few visible commercial plans/packages and granular internal permissions.

World Cup package candidates:

- Free Account;
- 10 Match Pack;
- World Cup Full Pass;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage Pass;
- Semifinals / Final Pass.

Post-World Cup commercial candidates:

- Premium Monthly;
- league/competition subscriptions;
- recurring American/European league coverage.

Internal permission models:

- competition entitlement;
- canonical stage entitlement;
- team entitlement;
- match unlock;
- quantity / pack consumption materialized as explicit unlocks.

Status: Direction accepted; exact UI/product packaging remains iterative.

## D05 — Entitlement To Match Resolver

Decision status: Partially resolved by C04.

C04 established the access skeleton:

- `competition` can cover matches in a competition.
- `stage` should use canonical `stageAccessKey`, not raw stage text.
- `team` can cover matches involving a team.
- `match` covers one exact match.
- explicit `user_match_unlocks` cover selected matches.
- `admin_access` is explicit.
- `beta_free_access` must be server-controlled.

Still open:

- exact production mapping for all World Cup package variants;
- how a Group Pass maps to resource IDs;
- how semifinals/final package resources are represented in seeds/admin tooling;
- how premium payload projection consumes the resolver in C07.

Status: C04 skeleton done; production package mapping remains open.

## D06 — Pack Consumption Model

Decision:

For a 10 Match Pack, do not treat `quantity/match_pack` as direct content authorization.

The current recommendation is:

1. User purchases or receives a match pack entitlement.
2. User selects concrete matches.
3. The system creates explicit `user_match_unlocks`.
4. Premium access checks rely on unlocks/entitlements, not vague quantity alone.

Status: Direction accepted; final UX/data flow remains open.

## D07 — Premium Content Boundaries

Open question:

Which fields are free, registered-free, World Cup package premium, and post-World Cup subscription premium?

Known premium candidates:

- prediction markets;
- narratives;
- scorelines;
- expected goals;
- model vs market;
- Golden Hour Delta;
- deeper confidence/risk explanations;
- post-result evaluation;
- historical/trust details beyond public summary.

Current C05 Gate 2A boundary:

- Anonymous keeps 1X2 public.
- Anonymous gets confidence/risk as basic signal/teaser.
- Registered Free sees confidence/risk fully rendered.
- Premium payload is not introduced.

Status: Still open for true premium payload and Gate 2B real boundary.

## D08 — Sports Data Provider

Open question:

Which sports API provider should be used?

Criteria:

- World Cup coverage;
- fixture quality;
- results speed;
- pricing;
- quotas;
- reliability;
- finals/friendlies coverage before the World Cup.

Status: Not selected.

## D09 — Odds Provider

Open question:

Whether to integrate odds, and with which provider.

Status: Not selected. Do not implement before product/legal/commercial readiness.

## D10 — LLM Narrative Strategy

Open question:

When to add LLM explanations and how much of them should be premium.

Current rule:

The model calculates. The AI explains.

Status: Deferred.

## D11 — Payments

Open question:

When to implement payments/Stripe.

Current direction:

- No checkout during current C05 gates.
- World Cup packages likely need payments before/during the World Cup.
- Monthly subscriptions are expected after the World Cup.

Status: Deferred until package/product scope is explicit.

## D12 — Staging / Production Readiness

Open question:

When to create final staging and production release infrastructure.

Status: Deferred until public beta and package scope are clearer.

## D13 — Tool Usage / Codex Prompt Discipline

Decision:

ChatGPT is the planning, direction, review, and documentation layer.

Codex is the controlled repository execution layer.

Antigravity and OpenCode are auxiliary tools used to save capacity and use the right tool for the right job. They do not replace Codex for repository execution.

ChatGPT-generated Codex work must be split into two blocks:

```txt
EJECUCIÓN RECOMENDADA
...

PROMPT LIMPIO PARA CODEX
...
```

Status: Resolved operating rule.

## D14 — Language / i18n Strategy

Decision:

- Current public UI: Spanish.
- Future public UI: EN/ES i18n.
- Internal identifiers, keys, types, slugs, entitlement types: prefer canonical English.
- Do not mix public copy into accidental Spanglish.

Status: Direction accepted; i18n not implemented.

## D15 — Pre-World Cup Beta Match Selection

Decision:

Before the World Cup, beta should use relevant near-term matches:

- league finals;
- national team friendlies;
- attractive/high-interest fixtures;
- matches useful for calibrating variables and confidence language.

Purpose:

- validate model outputs;
- improve formula/variables;
- validate UX;
- capture Registered Free users;
- demonstrate value before World Cup premium packages.

Status: Product direction accepted; specific match selection tooling not implemented.
