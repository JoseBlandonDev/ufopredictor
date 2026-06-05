# OPEN DECISIONS — UFO Predictor

_Last updated: post C08 / Track D D04C (2026-06-05)_

Current baseline:

- `main` includes C08 Trust / Transparency Real v0.1 through PR #34.
- `feature/d02-api-football-read-spike` contains Track D read-only API-Football work through D04C.
- C01-C08 are functionally closed.
- D02-D04C are implemented locally on the Track D feature branch.
- API-Football Pro is validated as the initial football data provider.
- Next major block: D05 fixture ingestion/persistence design, unless D04D exportable shortlist/report is chosen first.

<!-- POST_C08_D04C_UPDATE -->
## Post C08 / Track D Decision Update

### Decisions Closed

#### Football data provider for initial beta/Mundial path

Decision: API-Football Pro is selected and validated as the initial provider.

Evidence:

- Free plan validated adapter mechanics but blocked 2026 access with season-limit errors.
- Pro plan unlocked 2026 data.
- World Cup 2026, Friendlies 2026, Colombia Primera A 2026, and Copa Colombia 2026 returned fixtures.

Current state: closed unless API-Football quality/cost/coverage becomes a blocker.

#### Copa Colombia in initial Lab

Decision: Do not include Copa Colombia in Lab v0.1 defaults.

Copa Colombia remains validated and mapped (`leagueId=241`) but should not be part of the initial Lab/beta competition set.

### Decisions Still Open

#### D04D before D05?

Decision needed: generate an exportable local shortlist/report artifact before designing persistence, or move directly to D05 fixture persistence design.

Recommended if the user wants one more no-DB step: D04D.

Recommended if the user wants product progress: D05A schema/RLS/upsert planning.

#### Fixture persistence timing

Decision needed: when to move from read-only provider spike to Supabase persistence.

Constraints:

- no SQL until schema is reviewed;
- no remote migration assumptions;
- user applies SQL manually in Supabase SQL Editor;
- no cron/worker until manual ingest path is proven.

#### API request budget policy

Decision needed: define daily request budget during beta and World Cup.

Initial guidance:

- Use league/season reads carefully.
- Prefer targeted date/range reads once ingest exists.
- Avoid odds/provider predictions until explicitly needed.
- Do not query every endpoint just because the provider exposes it.

## O01 — Anonymous vs Registered Free Real Data Boundary

Decision status: mostly resolved for current C05 scope.

Current decision:

- Anonymous keeps match metadata + complete public 1X2 probabilities.
- Anonymous sees confidence/risk as basic signal/teaser.
- Anonymous does not receive `confidenceScore` / `riskLevel` in shaped UI DTO.
- Registered Free receives confidence/risk fully rendered with additional context.
- No premium payload is introduced.

Remaining relevance:

If future sensitive fields are introduced, they must be protected at backend/query/projection level before reaching unauthorized users.

## D01 — Public vs Internal Scope

Current decision:

- `internal_lab` remains internal.
- `public_product` powers public product views.
- `/predictions` uses only public/product-safe data.
- `/matches/[slug]` uses only public/free-safe data through explicit public views.
- C05 saved matches added user-owned capture data without opening premium prediction tables.

Status: resolved for current public/free surfaces; still relevant for C07 premium projection.

## D02 — Supabase Migration Workflow

Decision:

Supabase CLI local is not configured as the normal workflow.

Codex creates migration SQL files but does not apply remote migrations.

The user applies every remote migration manually in Supabase SQL Editor.

Every migration must include manual validation queries.

Remote Supabase is currently applied manually through:

```txt
0016_premium_match_projection.sql
```

Status: resolved operating rule.

## D03 — Beta/Freemium Strategy

Decision:

Run a controlled organic beta/freemium phase before the World Cup.

Funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World-Cup monthly subscriptions
```

Registered Free is permanent, not a separate temporary beta/free expanded plan.

The beta should:

- show useful free value;
- avoid giving away premium data;
- avoid mass advertising until validation improves;
- use finals, friendlies, and pre-World-Cup fixtures for learning;
- capture Registered Free users before World Cup package monetization.

Status: current product direction.

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

Post-World-Cup commercial candidates:

- Premium Monthly;
- league/competition subscriptions;
- recurring American/European league coverage.

Internal permission models:

- competition entitlement;
- canonical stage entitlement;
- team entitlement;
- match unlock;
- quantity / pack consumption materialized as explicit unlocks.

Status: direction accepted; exact UI/product packaging remains iterative and is next for C06.

## D05 — Entitlement To Match Resolver

Decision status: partially resolved by C04.

C04 established the access skeleton:

- `competition` can cover matches in a competition.
- `stage` should use canonical `stageAccessKey`, not raw stage text.
- `team` can cover matches involving a team.
- `match` covers one exact match.
- explicit `user_match_unlocks` cover selected matches.
- `admin_access` is explicit.
- `beta_free_access` must be server-controlled.

Still open:

- exact production mapping for World Cup package variants;
- how a Group Pass maps to resource IDs;
- how semifinals/final package resources are represented in seeds/admin tooling;
- how premium payload projection consumes the resolver in C07.

Status: C04 skeleton done; C06 should refine production package mapping.

## D06 — Pack Consumption Model

Decision:

For a 10 Match Pack, do not treat `quantity/match_pack` as direct content authorization.

Recommendation:

1. User purchases or receives a match pack entitlement.
2. User selects concrete matches.
3. System creates explicit `user_match_unlocks`.
4. Premium access checks rely on unlocks/entitlements, not vague quantity alone.

Status: direction accepted; final UX/data flow remains open.

## D07 — Premium Content Boundaries

Open question:

Which fields are free, registered-free, World Cup package premium, and post-World-Cup subscription premium?

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

Current C05 boundary:

- Anonymous keeps 1X2 public.
- Anonymous does not receive confidence/risk DTO fields.
- Registered Free sees confidence/risk.
- Premium payload is not introduced.

Status: still open for true premium payload and C07 projection.

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

Status: not selected.

## D09 — Odds Provider

Open question:

Whether to integrate odds, and with which provider.

Status: not selected. Do not implement before product/legal/commercial readiness.

## D10 — LLM Narrative Strategy

Open question:

When to add LLM explanations and how much of them should be premium.

Current rule:

The model calculates. The AI explains.

Status: deferred.

## D11 — Payments

Open question:

When to implement payments/Stripe.

Current direction:

- No checkout during current C05/C06 planning unless explicitly approved.
- World Cup packages likely need payments before/during the World Cup.
- Monthly subscriptions are expected after the World Cup.

Status: deferred until package/product scope is explicit.

## D12 — Staging / Production Readiness

Open question:

When to create final staging and production release infrastructure.

Status: deferred until public beta and package scope are clearer.

## D13 — Tool Usage / Codex Prompt Discipline

Decision:

ChatGPT is the planning, direction, review, and documentation layer.

Codex is the controlled repository execution layer.

Manual PowerShell/Git should handle simple commands.

ChatGPT-generated Codex work must be split into two blocks:

```txt
EJECUCIÓN RECOMENDADA
...

PROMPT LIMPIO PARA CODEX
...
```

Status: resolved operating rule.

## D14 — Language / i18n Strategy

Decision:

- Current public UI: Spanish.
- Future public UI: EN/ES i18n.
- Internal identifiers, keys, types, slugs, entitlement types: prefer canonical English.
- Do not mix public copy into accidental Spanglish.

Status: direction accepted; i18n not implemented.

## D15 — Pre-World-Cup Beta Match Selection

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

Status: product direction accepted; specific match selection tooling not implemented.

## D16 — Saved Matches / Watchlist Foundation

Decision:

Registered Free users can save public matches and view them in dashboard.

Implementation:

- `public.user_saved_matches`;
- `match_id` FK to `public.matches`;
- `user_id` FK to `auth.users`;
- own-row RLS;
- save/remove from `/matches/[slug]`;
- minimal dashboard list.

Not implemented yet:

- save button in `/predictions` cards;
- notifications;
- analytics/interest events;
- favorite teams/competitions;
- advanced preferences.

Status: v1 implemented in PR #29; future enhancements optional.

## D17 — C06C Package Catalog Persistence

Decision: defer DB package catalog persistence.

C06C is resolved by explicit decision, not forgotten.

No package catalog migration was created in C06. No `plans` / `plan_features` seeds, no `package_catalog`, and no 10 Match Pack ledger were created.

Reason:

World Cup packages are still flexible commercial templates. The project needs flexibility for team-only passes, group passes, stage passes, semifinals/final bundles, single-match unlocks, flexible match packs, and other demand-based combinations.

Revisit when:

- package/pricing strategy is final enough;
- payment provider strategy is selected;
- checkout/fulfillment is scoped;
- 10 Match Pack ledger/consumption model is designed.

## D18 — Payment Provider Strategy

Decision: payment provider remains open.

Do not assume Stripe. The project/user is Colombia-based, so Stripe should not be assumed available directly without a supported-country legal/company structure such as an LLC/company in a supported country.

PayPal is currently a likely candidate. Other Colombia-compatible payment gateways must be evaluated before checkout/fulfillment.

No payments were implemented in C06/C07.

## D19 — Product Premium Projection Boundary

Decision: C07 opened premium product projection only behind an authorized server-side gate.

Allowed in C07:

- premium markets/narrative for authorized users;
- protected RPC with `auth.uid()` and DB-side authorization checks;
- DTO filtering through allowed selectors.

Still excluded:

- `prediction_results`;
- internal lab evaluation metrics;
- raw/debug fields;
- payment/checkout fulfillment.


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
