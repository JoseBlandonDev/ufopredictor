# EPIC PROGRESS MATRIX — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

## Completed Milestones

| Code | Epic / Task | Status | Notes |
|---|---|---|---|
| B06a | Lab Fixture Review Actions | Done | Admin review fields/actions for Lab fixtures. |
| B06b | Lab Match Result Actions | Done | Admin can create/edit match results. |
| B06-pre | Seed Internal Lab Prediction Markets | Done | Internal Lab prediction markets seeded/readable. |
| B06c | Lab Evaluation Persistence | Done | Persist/update prediction_results using model evaluation. |
| C01 | Public Predictions From DB | Done | `/predictions` reads public_product data from Supabase. |
| C02 | Plans & Entitlements Backend | Done | `/pricing` and `/dashboard` read real plan/access data. |

## Recent PR Mapping

| PR | Scope | Status |
|---:|---|---|
| #18 | Persist Lab evaluations | Done |
| #19 | Update project context after Lab Admin Flow | Done |
| #20 | Read public predictions from DB | Done |
| #21 | Add plans entitlements backend | Done |

## Current Foundation

| Area | Status |
|---|---|
| Supabase schema | Present through migration `0012` remotely applied manually |
| Lab Admin Flow | Operational |
| Public predictions listing | Real DB-backed |
| Pricing catalog | Real DB-backed |
| Dashboard access summary | Real DB-backed |
| Entitlement pure logic | Implemented and tested |
| Match detail | Mock |
| Premium content enforcement | Not implemented |
| Payments | Not implemented |
| Workers | Mock/not real |
| Sports API | Not implemented |
| Odds | Not implemented |
| LLM | Not implemented |

## Active / Next Epic

| Code | Epic | Recommended Branch | Status |
|---|---|---|---|
| C03 | Match Detail Public From DB | `feature/match-detail-public-from-db` | Next |

## C03 Recommended Scope

Connect `/matches/[slug]` to real DB data using public/free-only projection.

Allowed:

- match by slug;
- competition;
- teams;
- venue;
- kickoff;
- stage/status;
- public prediction basics if available.

Not allowed:

- `prediction_markets` public access;
- `prediction_narratives` public access;
- `prediction_results` public access;
- premium analysis;
- final paywall;
- payments;
- odds;
- LLM;
- workers;
- sports API.

## Future Epics Candidate Queue

| Candidate | Description | Dependency |
|---|---|---|
| Premium Access Enforcement | Server-side projection filtering for premium fields | C02, C03 |
| Match Detail Premium Sections | Premium markets/narratives/results with entitlements | Premium enforcement |
| Data Intake / Sports API | Real fixtures/results provider | Cost/provider decision |
| Workers Runtime | Real scheduled jobs | Data provider + infra |
| Odds Integration | Model vs market comparisons | Odds provider decision |
| LLM Explanations | Narrative explanation layer | Model outputs + premium rules |
| Payments / Stripe | Checkout/subscriptions | Product/pricing decision |
| Google Auth | Social login | Auth decision |
| Staging | Deployment/staging hardening | Infra readiness |

## Important Project Rules

- The model calculates.
- The AI explains.
- Supabase migrations are applied manually in SQL Editor.
- Codex creates SQL files but does not apply remote migrations.
- No premium data should travel to the frontend without backend entitlement filtering.
- Visual locks are not authorization.
- `premium_user` role does not unlock everything.
- Active subscription alone does not unlock protected content.
