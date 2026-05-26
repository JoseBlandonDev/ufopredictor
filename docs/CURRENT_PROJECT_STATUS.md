# CURRENT PROJECT STATUS — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

## Executive Summary

UFO Predictor has completed the internal Lab Admin Flow, public predictions from DB, plans/entitlements backend, and public/free match detail from DB.

Current baseline:

```txt
main includes PR #23: feat: read public match detail from db
```

The project now has:

- internal Lab workflow using Supabase;
- public predictions listing from Supabase;
- public/free match detail from Supabase;
- public beta plans catalog from Supabase;
- authenticated dashboard access summary from Supabase;
- pure entitlement logic with tests;
- public projection hardening for anonymous users;
- manual Supabase migrations applied through `0013`.

The next recommended feature is:

```txt
feature/premium-access-enforcement-skeleton
```

## Recent PRs

| PR | Title | Status |
|---:|---|---|
| #18 | `feat: persist lab evaluations` | Done |
| #19 | `docs: update project context after lab admin flow` | Done |
| #20 | `feat: read public predictions from db` | Done |
| #21 | `feat: add plans entitlements backend` | Done |
| #22 | `docs: update project context after c02` | Done |
| #23 | `feat: read public match detail from db` | Done |

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

## Supabase Migration Rule

Supabase CLI local is not configured.

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

Every ChatGPT-generated Codex prompt must include the execution card.

Codex is used for controlled repo execution. ChatGPT plans, reviews, scopes, documents, and generates prompts. Antigravity and OpenCode are auxiliary tools only. Manual user steps remain required for Supabase SQL Editor, GitHub UI, and remote validations.

## Current Route Status

| Route | Status |
|---|---|
| `/` | Prototype landing page, still contains simulated featured predictions |
| `/predictions` | Real public predictions from Supabase via `public_prediction_summaries` |
| `/matches/[slug]` | Real public/free-only match detail from Supabase via public views |
| `/pricing` | Real active plans catalog from Supabase |
| `/dashboard` | Authenticated viewer access summary from Supabase |
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

## `/predictions`

Implemented by C01 and hardened by C03.

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

Relevant files:

- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `lib/supabase/public-prediction-queries.ts`
- `supabase/migrations/0013_public_match_detail_projection_hardening.sql`

## `/matches/[slug]`

Implemented by C03.

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

- public match with prediction: shows metadata + 1X2/confidence/risk;
- public match without prediction: shows empty state;
- nonexistent or non-public slug: 404.

Relevant files:

- `app/matches/[slug]/page.tsx`
- `lib/supabase/public-match-detail-queries.ts`
- `supabase/migrations/0013_public_match_detail_projection_hardening.sql`

## `/pricing`

Implemented by C02.

Reads active visible plans and public plan features from Supabase.

Current constraints:

- no checkout;
- no payments;
- no Stripe;
- no purchase flow;
- plan features are treated as public catalog/marketing values.

## `/dashboard`

Implemented by C02 as a real access summary.

Reads:

- current profile role;
- active subscriptions;
- current entitlements;
- current match unlocks.

It does not serve premium prediction content.

## Entitlements Foundation

C02 added pure access logic.

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
- Beta free access must be assembled server-side, never from client input.

Tests:

- `lib/permissions/entitlements.test.ts`

## Product Strategy

UFO Predictor is preparing for a beta/freemium organic phase before the World Cup.

The beta should:

- show useful free value;
- avoid giving away all premium data;
- avoid mass advertising until the model, UX, infrastructure, and costs are validated;
- allow organic testing with finals, friendlies, and pre-World Cup fixtures.

Infrastructure may begin on free tiers, but costs are expected later for:

- Supabase;
- Railway;
- sports data APIs;
- odds APIs;
- LLM usage if added;
- workers and cron.

## Plans Strategy

The product should avoid too many public-facing plans.

Visible plans should be few and understandable.

Potential plan types:

- Free
- 10 Match Pack
- World Cup Pass
- Team Pass
- Semifinals / Final Pass
- Premium Monthly later

Internal access should be granular:

- competition entitlement;
- stage entitlement;
- team entitlement;
- match unlock;
- quantity / pack consumption.

Future work must define how those entitlements translate into access to concrete matches.

## Not Implemented Yet

Still missing:

- final premium enforcement;
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
- Supabase CLI local;
- staging final.

## Recommended Next Epic

```txt
feature/premium-access-enforcement-skeleton
```

Goal:

Create the backend skeleton for safe premium access enforcement before exposing premium data.

Allowed:

- inspect and strengthen entitlement resolver patterns;
- define premium-safe server projection boundaries;
- keep premium data filtered server-side;
- add pure tests where useful.

Not allowed:

- public premium tables;
- final paywall;
- payments;
- odds;
- LLM;
- workers;
- API sports integration.
