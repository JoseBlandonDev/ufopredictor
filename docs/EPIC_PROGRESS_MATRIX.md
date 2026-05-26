# EPIC PROGRESS MATRIX — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

## Completed Milestones

| Code | Epic / Task | Status | Notes |
|---|---|---|---|
| B06a | Lab Fixture Review Actions | Done | Admin review fields/actions for Lab fixtures. |
| B06b | Lab Match Result Actions | Done | Admin can create/edit match results. |
| B06-pre | Seed Internal Lab Prediction Markets | Done | Internal Lab prediction markets seeded/readable. |
| B06c | Lab Evaluation Persistence | Done | Persist/update prediction_results using model evaluation. |
| C01 | Public Predictions From DB | Done | `/predictions` reads public_product data from Supabase. |
| C02 | Plans & Entitlements Backend | Done | `/pricing` and `/dashboard` read real plan/access data. |
| C03 | Match Detail Public From DB | Done | `/matches/[slug]` reads real public/free-only match detail from Supabase; public projection hardening added in `0013`. |

## Recent PR Mapping

| PR | Scope | Status |
|---:|---|---|
| #18 | Persist Lab evaluations | Done |
| #19 | Update project context after Lab Admin Flow | Done |
| #20 | Read public predictions from DB | Done |
| #21 | Add plans entitlements backend | Done |
| #22 | Update project context after C02 | Done |
| #23 | Read public match detail from DB | Done |

## Current Foundation

| Area | Status |
|---|---|
| Supabase schema | Present through migration `0013` remotely applied manually |
| Lab Admin Flow | Operational |
| Public predictions listing | Real DB-backed via `public_prediction_summaries` |
| Public match detail | Real DB-backed via `public_match_details` + `public_prediction_summaries` |
| Pricing catalog | Real DB-backed |
| Dashboard access summary | Real DB-backed |
| Entitlement pure logic | Implemented and tested |
| Public projection hardening | Implemented for `anon` via explicit public views |
| Premium content enforcement | Not implemented |
| Payments | Not implemented |
| Workers | Mock/not real |
| Sports API | Not implemented |
| Odds | Not implemented |
| LLM | Not implemented |

## Active / Next Epic

| Code | Epic | Recommended Branch | Status |
|---|---|---|---|
| C04 | Premium Access Enforcement Skeleton | `feature/premium-access-enforcement-skeleton` | Next |

## C04 Recommended Scope

Create a server-side skeleton for premium access enforcement before serving premium match detail.

Allowed:

- inspect C02 entitlement logic;
- inspect C03 public projections;
- define free vs protected boundaries;
- create or refine pure access helpers/tests;
- prepare server-only filtering patterns;
- keep premium data closed.

Not allowed:

- public `prediction_markets` access;
- public `prediction_narratives` access;
- public `prediction_results` access;
- actual premium content UI unless explicitly approved;
- payments;
- odds;
- LLM;
- workers;
- sports API.

## Future Epics Candidate Queue

| Candidate | Description | Dependency |
|---|---|---|
| Match Detail Premium Sections | Premium markets/narratives/results with entitlements | Premium enforcement skeleton |
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
- Every ChatGPT-to-Codex prompt must include the execution card.
- No premium data should travel to the frontend without backend entitlement filtering.
- Visual locks are not authorization.
- `premium_user` role does not unlock everything.
- Active subscription alone does not unlock protected content.
