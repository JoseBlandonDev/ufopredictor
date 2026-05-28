# CURRENT PROJECT STATUS — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


## Executive Summary

UFO Predictor has completed the internal Lab Admin Flow, public predictions from DB, plans/entitlements backend, public/free match detail from DB, a premium access enforcement skeleton, a registered-free value wall, and a first presentation-level separation between Anonymous and Registered Free.

Current baseline:

```txt
main includes PR #27: docs update project context after C05 Gate 1
current working branch includes C05 Gate 2A presentation boundary changes pending commit/PR
```

The project now has:

- internal Lab workflow using Supabase;
- public predictions listing from Supabase;
- public/free match detail from Supabase;
- public beta plans catalog from Supabase;
- authenticated dashboard access summary from Supabase;
- pure entitlement logic with tests;
- server-only premium access decision skeleton;
- public projection hardening for anonymous users;
- UI/copy value wall for Registered Free;
- presentation-level Gate 2A differentiation between Anonymous and Registered Free;
- manual Supabase migrations applied through `0013`.

The next recommended decision is:

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

## Recent PRs / Milestones

| PR / Gate | Title | Status |
|---:|---|---|
| #18 | `feat: persist lab evaluations` | Done |
| #19 | `docs: update project context after lab admin flow` | Done |
| #20 | `feat: read public predictions from db` | Done |
| #21 | `feat: add plans entitlements backend` | Done |
| #22 | `docs: update project context after c02` | Done |
| #23 | `feat: read public match detail from db` | Done |
| #24 | `docs: update project context after c03` | Done |
| #25 | `feat: add premium match access enforcement skeleton` | Done |
| #26 | `feat: add registered free value wall` | Done |
| #27 | `docs: update project context after c05 gate 1` | Done |
| C05 Gate 2A | Presentation Boundary sin SQL | Implemented in current working branch, pending commit/PR |

## Supabase Remote State

Remote Supabase has been updated manually through:

```txt
0013_public_match_detail_projection_hardening.sql
```

Important applied migrations:

| Migration | Purpose | Remote Applied |
|---|---|---|
| `0011_public_prediction_reads.sql` | Public read policies for public predictions | Yes, manually |
| `0012_plans_entitlements_backend.sql` | Plans and own-row entitlement reads | Yes, manually |
| `0013_public_match_detail_projection_hardening.sql` | Public projection views and anon hardening | Yes, manually |

No C04/C05 Gate 1/Gate 2A SQL migrations were added.

## Supabase Migration Rule

Supabase CLI local is not configured as the normal workflow.

Codex does not apply migrations to remote Supabase.

Codex may create SQL migration files, but the user must apply them manually in Supabase SQL Editor.

Do not treat a migration as active until manual application and validation are confirmed.

Required validation after migration:

1. Inspect SQL.
2. Apply in Supabase SQL Editor.
3. Validate policies in `pg_policies`.
4. Validate grants.
5. Validate `anon` and `authenticated` behavior.
6. Validate UI.
7. Run `npm run test`, `npm run lint`, and `npm run build`.
8. Restore `next-env.d.ts` if modified by build.

## Tool Usage Rule

ChatGPT-generated Codex work must be separated into:

1. `EJECUCIÓN RECOMENDADA` for the user: tool, model, intelligence, risk, scope, and rationale.
2. `PROMPT LIMPIO PARA CODEX` for direct copy/paste into Codex.

Codex is used for controlled repo execution. ChatGPT plans, reviews, scopes, documents, and generates prompts. Antigravity and OpenCode are auxiliary tools only. Manual user steps remain required for Supabase SQL Editor, GitHub UI, and remote validations.

## Current Route Status

| Route | Status |
|---|---|
| `/` | Public landing page; still may contain simulated/static featured predictions |
| `/predictions` | Real public predictions from Supabase via `public_prediction_summaries`; Gate 2A presentation split by session |
| `/matches/[slug]` | Real public/free-only match detail from Supabase via public views; Gate 2A presentation split by session |
| `/pricing` | Real active/beta catalog from Supabase; no checkout/payment |
| `/dashboard` | Authenticated viewer access summary from Supabase + free value messaging |
| `/admin` | Admin shell, partially mock |
| `/admin/beta-lab` | Internal Lab workflow operational |
| `/transparency` | Still simulated transparency metrics |
| `/login`, `/register`, `/auth/callback` | Auth foundation present |

## `/admin/beta-lab`

Current real capabilities:

- reads Lab fixtures from Supabase;
- supports fixture review;
- supports match result creation/editing;
- reads internal `prediction_markets`;
- persists/updates `prediction_results`;
- displays readiness and persisted evaluation metrics.

Still mock:

- worker runs.

This area should not be touched while working on public freemium surfaces unless explicitly requested.

## `/predictions`

Implemented by C01, hardened by C03, updated by C05 Gate 1 and Gate 2A.

Reads public predictions from Supabase using:

```txt
public_prediction_summaries
```

Safety constraints:

- only public product competitions;
- only public matches;
- only public product prediction versions;
- no Lab data;
- no premium markets;
- no premium narratives;
- no prediction results;
- no premium analysis.

Gate 2A behavior:

- Anonymous keeps match metadata + complete 1X2 probabilities.
- Anonymous sees confidence/risk as a basic teaser/presentation signal.
- Registered Free sees confidence/risk fully rendered with more account context.
- This is not a DB boundary because the same public view is still used.

Relevant files:

- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `lib/supabase/public-prediction-queries.ts`
- `supabase/migrations/0013_public_match_detail_projection_hardening.sql`

## `/matches/[slug]`

Implemented by C03, updated by C05 Gate 1 and Gate 2A.

Reads real public/free-only match detail from Supabase using:

```txt
public_match_details
public_prediction_summaries
```

Shows:

- competition;
- match;
- teams;
- venue;
- kickoff;
- status/stage;
- public 1X2 prediction basics if available.

Behavior:

- public match with prediction: shows metadata + public 1X2;
- public match without prediction: shows empty state;
- nonexistent or non-public slug: 404.

Gate 2A behavior:

- Anonymous keeps metadata + complete public 1X2 probabilities.
- Anonymous sees confidence/risk as basic teaser/presentation signal.
- Registered Free sees confidence/risk fully and account-active messaging.
- Preview signals remain placeholder/teaser.

Relevant files:

- `app/matches/[slug]/page.tsx`
- `lib/supabase/public-match-detail-queries.ts`
- `supabase/migrations/0013_public_match_detail_projection_hardening.sql`

## `/pricing`

Implemented by C02 and updated by C05 Gate 1.

Reads active visible plans and public plan features from Supabase.

Current constraints:

- no checkout;
- no payments;
- no Stripe;
- no purchase flow;
- plan features are treated as public catalog/marketing values.

Pricing should frame current Free Account access and future World Cup premium packages, not active checkout.

## `/dashboard`

Implemented by C02 as a real access summary and updated by C05 Gate 1/Gate 2A as a value surface for Registered Free.

Reads:

- current profile role;
- active subscriptions;
- current entitlements;
- current match unlocks.

It does not serve premium prediction content.

## Entitlements Foundation / C04

C02 added pure access logic. C04 strengthened the server-side premium access skeleton.

Access sources:

- `public_basic_access`
- `beta_free_access`
- `entitlement_access`
- `admin_access`
- `none`

Important rules:

- `premium_user` role does not unlock all content by itself.
- Active subscription does not unlock protected content by itself.
- Protected access requires entitlement or match unlock unless an explicit admin/beta rule applies.
- `quantity/match_pack` does not directly grant access; selected matches should become explicit unlocks.
- Beta free access must be assembled server-side, never from client input.
- `stageAccessKey` must be canonical/server-derived.
- `trustedBetaFreeMatchIds` must come from trusted server-side context.

Tests:

- `lib/permissions/entitlements.test.ts`

## Product Strategy

UFO Predictor is preparing for a beta/freemium organic phase before the World Cup.

The beta should:

- show useful free value;
- avoid giving away all premium data;
- avoid mass advertising until the model, UX, infrastructure, and costs are validated;
- allow organic testing with finals, friendlies, and pre-World Cup fixtures;
- capture Registered Free users before World Cup premium package sales.

Infrastructure may begin on free tiers, but costs are expected later for:

- Supabase;
- Railway;
- sports data APIs;
- odds APIs;
- LLM usage if added;
- workers and cron.

## Plans Strategy

The product should avoid too many public-facing plans.

Visible commercial options should be understandable. Internal access can stay granular.

World Cup package candidates:

- Free Account;
- 10 Match Pack;
- World Cup Full Pass;
- Country/Team Pass;
- Group Pass;
- Stage Pass;
- Semifinals / Final Pass;
- Single Match Unlock.

Post-World Cup candidates:

- Premium Monthly;
- competition/league subscriptions;
- recurring coverage for American/European leagues.

Internal access should be granular:

- competition entitlement;
- stage entitlement via canonical `stageAccessKey`;
- team entitlement;
- match unlock;
- quantity / pack consumption materialized into unlocks.

## Not Implemented Yet

Still missing:

- C05 Gate 2B real data boundary;
- Registered Free capture foundation: favorites/watchlist/preferences/events;
- final premium enforcement against real payload;
- entitled/premium match detail sections;
- public/premium-safe `prediction_markets`;
- public/premium-safe `prediction_narratives`;
- public/premium-safe `prediction_results`;
- payments;
- Stripe;
- checkout;
- odds;
- LLM;
- real workers;
- sports API;
- Google Auth;
- Supabase CLI local workflow;
- staging final;
- i18n EN/ES.

## Recommended Next Work

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

Goal:

Decide whether C05 should formalize the Anonymous vs Registered Free split with:

- separate views/projections;
- RLS;
- RPC;
- server-only query shaping;
- or deferred until premium projection.

Do not treat Gate 2A as a security boundary. Gate 2A is presentation-only and does not replace backend authorization controls.
