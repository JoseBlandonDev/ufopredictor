# OPEN DECISIONS — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

## D01 — Public vs Internal Scope

Current decision:

- `internal_lab` remains internal.
- `public_product` powers public product views.
- `/predictions` uses only public/product-safe data.
- `/matches/[slug]` now uses only public/free-safe data through explicit public views.

Status: Mostly resolved for public/free surfaces. Still relevant for premium projections.

## D02 — Supabase Migration Workflow

Decision:

Supabase CLI local is not configured.

Codex creates migration SQL files but does not apply remote migrations.

The user applies every remote migration manually in Supabase SQL Editor.

Every migration must include manual validation queries.

Status: Resolved as operating rule.

## D03 — Beta/Freemium Strategy

Decision:

Run a controlled organic beta/freemium phase before the World Cup.

The beta should:

- show useful free value;
- avoid giving away all premium data;
- avoid mass advertising until validation improves;
- use finals, friendlies, and pre-World Cup fixtures for learning.

Status: Current product direction.

## D04 — Plans vs Permissions

Decision:

Use few visible commercial plans and granular internal permissions.

Possible visible plans:

- Free
- 10 Match Pack
- World Cup Pass
- Team Pass
- Semifinals / Final Pass
- Premium Monthly later

Internal permission models:

- competition entitlement;
- stage entitlement;
- team entitlement;
- match unlock;
- quantity / pack consumption.

Status: Direction accepted; exact entitlement-to-match mapping remains open.

## D05 — Entitlement To Match Resolver

Open question:

How should each entitlement type translate to actual match access?

Possible rules:

- `competition` covers all matches in a competition.
- `stage` covers matches in a given stage.
- `team` covers matches involving a team.
- `match` covers one exact match.
- `quantity` supports match-pack consumption.

Status: Open, likely needed in C04/C05.

## D06 — Pack Consumption Model

Open question:

For a 10 Match Pack, should the system:

1. store a quantity entitlement and decrement usage, or
2. create explicit `user_match_unlocks` when the user chooses matches?

Current recommendation:

Use explicit `user_match_unlocks` after the user selects matches, because it is clearer and auditable.

Status: Open.

## D07 — Premium Content Boundaries

Open question:

Which fields are free and which are premium?

Known premium candidates:

- prediction markets;
- narratives;
- scorelines;
- expected goals;
- model vs market;
- Golden Hour Delta;
- deeper confidence/risk explanations;
- post-result evaluation.

Status: Open. Must be resolved before serving premium match details.

## D08 — Sports Data Provider

Open question:

Which sports API provider should be used?

Criteria:

- World Cup coverage;
- fixture quality;
- results speed;
- pricing;
- quotas;
- reliability.

Status: Not selected.

## D09 — Odds Provider

Open question:

Whether to integrate odds, and with which provider.

Status: Not selected.

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

Not during early beta unless product readiness and demand justify it.

Status: Deferred.

## D12 — Staging / Production Readiness

Open question:

When to create final staging and production release infrastructure.

Status: Deferred until public beta scope is clearer.

## D13 — Tool Usage / Codex Prompt Discipline

Decision:

ChatGPT is the planning, direction, review, and documentation layer.

Codex is the controlled repository execution layer.

Antigravity and OpenCode are auxiliary tools used to save capacity and use the right tool for the right job. They do not replace Codex for repository execution.

Every ChatGPT-generated prompt for Codex must include the execution card:

```txt
USO RECOMENDADO:
- Herramienta:
- Modelo/intensidad:
- Modo:
- Motivo:
- Riesgo:
- Scope permitido:
- No tocar:
- Validaciones:
- Debo volver a ChatGPT cuando:

PROMPT PARA CODEX:
...
```

Status: Resolved operating rule.
