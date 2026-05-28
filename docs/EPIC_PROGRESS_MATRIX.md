# EPIC PROGRESS MATRIX — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


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
| C04 | Premium Access Enforcement Skeleton | Done | Server-side/pure access skeleton, no premium payload opened. |
| C05-G0 | Anonymous vs Registered Free Product Audit | Done | Product decision/audit; no code. |
| C05-G1 | Registered Free Value Wall | Done | Spanish UI/copy value wall; no data boundary change. |
| C05-G2A | Presentation Boundary sin SQL | Done / pending PR if active branch | Presentation-only split between Anonymous and Registered Free using existing public fields. |

## Recent PR Mapping

| PR | Scope | Status |
|---:|---|---|
| #18 | Persist Lab evaluations | Done |
| #19 | Update project context after Lab Admin Flow | Done |
| #20 | Read public predictions from DB | Done |
| #21 | Add plans entitlements backend | Done |
| #22 | Update project context after C02 | Done |
| #23 | Read public match detail from DB | Done |
| #24 | Update project context after C03 | Done |
| #25 | Add premium match access enforcement skeleton | Done |
| #26 | Add registered free value wall | Done |
| #27 | Update project context after C05 Gate 1 | Done |

## Current Foundation

| Area | Status |
|---|---|
| Supabase schema | Present through migration `0013` remotely applied manually |
| Lab Admin Flow | Operational |
| Public predictions listing | Real DB-backed via `public_prediction_summaries` |
| Public match detail | Real DB-backed via `public_match_details` + `public_prediction_summaries` |
| Pricing catalog | Real DB-backed, no checkout |
| Dashboard access summary | Real DB-backed |
| Entitlement pure logic | Implemented and tested |
| Premium access skeleton | Implemented server-side/pure, no payload opened |
| Public projection hardening | Implemented for `anon` via explicit public views |
| Registered Free value wall | Implemented UI/copy |
| Anonymous vs Registered Free presentation boundary | Implemented without SQL/query changes |
| Real data boundary anon vs registered free | Not implemented; Gate 2B decision pending |
| Premium content projection | Not implemented |
| Payments | Not implemented |
| Workers | Mock/not real |
| Sports API | Not implemented |
| Odds | Not implemented |
| LLM | Not implemented |
| i18n | Not implemented |

## Active / Next Epic

| Code | Epic | Recommended Branch | Status |
|---|---|---|---|
| C05-G2B | Real Data Boundary / Projection Decision | `feature/registered-free-data-boundary` or planning only | Next decision |
| C05-G3 | Registered Free Capture Foundation | TBD | Future |
| C06 | World Cup Premium Package Foundation | TBD | Future |
| C07 | Entitled Premium Match Projection | TBD | Future |

## C05 Gate 2A Scope Summary

Done/pending merge:

- Anonymous retains metadata + full public 1X2.
- Anonymous sees confidence/risk as basic signal/teaser.
- Registered Free sees confidence/risk complete and more context.
- Preview signals remain placeholder/teaser.
- Dashboard reinforces value of free account.

Not done:

- no SQL;
- no RLS;
- no migrations;
- no new views;
- no query changes;
- no premium tables;
- no premium payload;
- no real data boundary.

## Future Epics Candidate Queue

| Candidate | Description | Dependency |
|---|---|---|
| C05 Gate 2B | Real anon vs registered-free data boundary decision | Gate 2A complete |
| C05 Gate 3 | Favorites/watchlist/interest capture | Product decision + likely SQL/RLS |
| C06 | World Cup package foundation | Product/package mapping |
| C07 | Premium match projection | Premium package + access resolver |
| C08 | Trust/Transparency real v0.1 | Evaluation data and eligibility rules |
| Data Intake / Sports API | Real fixtures/results provider | Cost/provider decision |
| Workers Runtime | Real scheduled jobs | Data provider + infra |
| Odds Integration | Model vs market comparisons | Odds provider decision |
| LLM Explanations | Narrative explanation layer | Model outputs + premium rules |
| Payments / Stripe | World Cup package checkout and later subscriptions | Product/pricing decision |
| Google Auth | Social login | Auth decision |
| i18n EN/ES | Public bilingual site | Translation/router decision |
| Staging | Deployment/staging hardening | Infra readiness |

## Important Project Rules

- The model calculates.
- The AI explains.
- Supabase migrations are applied manually in SQL Editor.
- Codex creates SQL files but does not apply remote migrations.
- ChatGPT-to-Codex instructions must separate `EJECUCIÓN RECOMENDADA` and `PROMPT LIMPIO PARA CODEX`.
- No premium data should travel to the frontend without backend entitlement filtering.
- Visual locks/blur/teasers are not authorization.
- `premium_user` role does not unlock everything.
- Active subscription alone does not unlock protected content.
- `match_pack` quantity does not grant access without explicit unlocks.
