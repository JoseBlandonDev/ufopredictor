# TRACK D API-FOOTBALL HANDOFF — UFO Predictor

_Last updated: post C08 / Track D D04C (2026-06-05)_

This file is a focused handoff for the API-Football provider and beta fixture selection work. It complements the existing source docs and does not replace them.

## Current Branch

```txt
feature/d02-api-football-read-spike
```

## Completed Local Commits

```txt
04a2646 feat: add api-football read spike
9ac3510 feat: add api-football league discovery mode
02a1461 feat: add api-football rounds diagnostics
ed2799f feat: add beta fixture target selector
5649b91 feat: prioritize beta fixture candidates
5c3f757 feat: add beta shortlist report mode
```

## Provider Decision

API-Football Pro is selected and validated as the initial football data provider.

Why:

- Free plan allowed technical validation but blocked 2026 season access.
- Pro plan unlocked 2026 fixtures.
- The adapter/CLI was already implemented and validated.
- Sportmonks remains fallback only.

## Validated Competitions

| Competition | API-Football leagueId | Season | Fixture validation | Lab v0.1 decision |
|---|---:|---:|---|---|
| World Cup | `1` | 2026 | 72 fixtures | Include once tournament begins |
| Friendlies | `10` | 2026 | 488 fixtures | Include, adults by default |
| Colombia Primera A / Liga BetPlay | `239` | 2026 | 204 fixtures | Include |
| Copa Colombia | `241` | 2026 | 56 fixtures | Validated, but excluded from Lab v0.1 |

## Implemented Files

| File | Purpose |
|---|---|
| `lib/football-api/api-football-client.ts` | Read-only API-Football client. |
| `lib/football-api/api-football-types.ts` | Provider normalization types. |
| `lib/football-api/target-competitions.ts` | Target competition config, selector, prioritization, report builder. |
| `scripts/api-football-read-spike.ts` | CLI spike/read/diagnostic tool. |

## CLI Modes

The spike script supports:

- `date`
- `league`
- `fixture`
- `leagues`
- `rounds`
- `beta-candidates`

## `beta-candidates` Options

```txt
--competition world-cup|friendlies|colombia-primera-a|copa-colombia|all
--from YYYY-MM-DD
--to YYYY-MM-DD
--limit N
--includeYouth true|false
--prioritize true|false
--maxPerCompetition N
--report true|false
```

## Useful Commands

World Cup candidates:

```bash
npm run spike:api-football -- --mode beta-candidates --competition world-cup --from 2026-06-11 --to 2026-06-20 --limit 20 --prioritize true --report true
```

Friendlies candidates, adult fixtures by default:

```bash
npm run spike:api-football -- --mode beta-candidates --competition friendlies --from 2026-05-25 --to 2026-06-10 --limit 20 --prioritize true --report true
```

All current Lab-oriented candidates:

```bash
npm run spike:api-football -- --mode beta-candidates --competition all --from 2026-05-25 --to 2026-06-20 --limit 30 --prioritize true --maxPerCompetition 10 --report true
```

Colombia Primera A candidates:

```bash
npm run spike:api-football -- --mode beta-candidates --competition colombia-primera-a --from 2026-05-25 --to 2026-06-10 --limit 20 --prioritize true --report true
```

## Current Lab v0.1 Default Scope

Included:

1. Colombia Primera A / Liga BetPlay.
2. Adult Friendlies.
3. World Cup 2026 when active.

Excluded for now:

- Copa Colombia, despite successful provider validation.

## Security / Boundary Status

Track D so far is read-only.

No:

- SQL;
- migrations;
- Supabase writes;
- workers;
- cron;
- provider predictions;
- odds;
- API keys in output;
- `prediction_results` exposure;
- premium projection changes.

## Recommended Next Block

### D04D — optional no-DB bridge

Export shortlist/report output to a local artifact for manual operations.

Use if the user wants one more safe step before DB design.

### D05 — fixture ingestion/persistence design

Recommended if the project is ready for product progress.

Must start with:

- schema design;
- provider ID mapping strategy;
- upsert strategy;
- RLS/public/internal boundary;
- validation queries;
- manual Supabase SQL Editor workflow.

Do not create or apply migrations before D05A design is approved.

## Open Risks

- API request budget must be controlled during beta/Mundial.
- Provider IDs should not become product identity without a mapping plan.
- Fixture persistence must not weaken existing public/premium boundaries.
- `prediction_results` must remain internal unless explicitly reviewed later.
- Youth friendlies should stay excluded by default for Lab v0.1.
