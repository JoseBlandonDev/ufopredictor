# Epic Progress Matrix - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

| Epic / Track | Status | Notes |
|---|---|---|
| MVP 0 Lab foundation | Done | Internal Lab and prediction/evaluation foundation exist. |
| D05/D06/D07 controlled pilot path | Done | Exact fixture controlled operations established. |
| E03-E07 public fixture publication path | Done | Public basic prediction flow exists. |
| E09A authenticated probable score | Done | Probable score gated for authenticated context. |
| E10B canonical 48-team snapshots | Done | Canonical World Cup team coverage baseline. |
| E10C signal enrichment | Done | FIFA/Elo/history/recent metadata for 48 teams. |
| E10D xG/scoreline calibration | Done | Reduced fallback `1-1` behavior, more meaningful xG separation. |
| Finished fixture public result verification | Done | Public-safe verified result projection exists. |
| Prelaunch finished fixture refresh | Done | Exact admin-only append refresh for scheduled/finished public fixtures. |
| Public prediction priority UI | Done | Active/upcoming first, finished historical section. |
| Real Fixture Lab active filters/usability | Done | Active filters, legacy collapse, pending/loading controls. |
| Premium prediction detail MVP | Next main product epic | Top scorelines, xG, BTTS, O/U, factors. |
| Epic G G01 - Auth/account UX | Done | Google login, email/password registration, confirmation, callback, check-email, and account UX are complete. |
| Epic G G02 - Production config audit | In progress / documented | Dev/prod env separation and manual config checklist live in `docs/PRODUCTION_READINESS.md`; G03 smoke test is still pending. |
| Epic G G03 - Production smoke test | Pending | Must verify `ufopredictor.com` end to end before launch. |
| Epic G G04-G08 - Product platform follow-up | Planned parallel track | Plans/pricing, payment spike, entitlement proposal, premium gate shell, trust/legal copy. |
| Venue/stadium metadata | Open | Source/storage/display not finished. |
| Signal refresh strategy | Open | Daily/semi-manual first; workers later. |
| Lineup/injury context | Open | `lineupContextScore` still neutral. |
| Market context | Open | `marketScore` still neutral; no hidden odds. |
| Worker/cron automation | Future | For controlled refresh/check tasks, not broad blind writes. |
| Docs/source rebaseline | Current | This refresh updates project sources before next conversation. |

## Current MVP readiness read

MVP 1 basic public fixture operations are functional for selected fixtures. The next visible product gap is premium detail content.

## Recommended next work

Primary:

1. Premium prediction detail MVP.

Parallel-safe:

2. Epic G - continue from G03 production smoke test or G04 plans/pricing, depending on launch priority.

Secondary:

3. venue/stadium metadata;
4. signal refresh strategy;
5. continued exact fixture operations.
