# Start Here for New Conversations - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Current baseline

Start every new task from updated `main`:

```bash
git checkout main
git pull origin main
git status --short
```

Expected status: clean.

PR #94 is merged. The accepted model state is:

- SIGNAL04 national-team strength refresh: retained.
- DRAW01 conservative draw top-outcome reconciliation: retained.
- `expected-goals.ts`: unchanged after XG01A ablation.
- `Cape Verde Islands` resolves to the canonical Cabo Verde runtime team.
- Publish Queue remains available in the admin Ops menu.

The current production baseline also includes Wompi checkout/payment activation, automatic premium entitlement activation, premium-active UX polish, and admin price/payment controls. Dedicated payment and entitlement runbooks remain authoritative for implementation details.

## Model closeout

The final fair stored-prediction sample contains 28 unique launch-safe World Cup fixtures, deduped to the latest evaluated `internal_lab` + `pre_match_24h` row per fixture.

| Metric | Result |
|---|---:|
| 1X2 direction | 16/28 (57.1%) |
| Exact score | 7/28 (25.0%) |
| BTTS | 16/27 (59.3%) |
| Over/Under 2.5 | 16/28 (57.1%) |
| Average total-goal error | 1.821 |
| Actual draws | 10 |
| Stored top-draw predictions | 0 |

Important interpretation:

- The 28-fixture table is a fair report of stored pre-match predictions.
- It does not retroactively prove SIGNAL04 or DRAW01 because most stored predictions predate those changes.
- A fair DRAW01 overlay over 26 stored fixtures improved 1X2 from 14/26 to 15/26, captured one additional real draw, and introduced zero false top draws.
- Current-model recomputation using refreshed signals is diagnostic only because it contains post-period information.

See `MODEL_CALIBRATION_CLOSEOUT_PR94.md` for the full evidence and rejected experiments.

## Latest operational closure

Result Review Queue: `0` pending.

Evaluation Queue: `0` pending.

Latest newly verified/evaluated results:

| API-Football fixture | Match | Result |
|---:|---|---:|
| 1489387 | Canada vs Qatar | 6-0 |
| 1489388 | Mexico vs South Korea | 1-0 |

Current public upcoming runway: 4 fixtures.

- United States vs Australia
- Scotland vs Morocco
- Brazil vs Haiti
- Türkiye vs Paraguay

Use exact-fixture operations only. Do not broad-apply unknown fixtures.

## Current product state

Operational product capabilities include:

- public prediction list and match detail;
- verified final-result display;
- protected premium model detail;
- registered-free probable-score gating;
- Wompi payment flow and automatic premium activation;
- premium-active presentation;
- admin payment/price controls;
- Result Review Queue;
- Evaluation Queue;
- Real Fixture Publish Queue;
- Torneo Mundialista admin export.

Real Fixture Lab exact-detail remains a known stack-overflow risk. Focused queues are the preferred operational paths.

## Signal refresh workflow

A future conversation may receive:

- FIFA ranking CSV;
- Elo ranking HTML;
- Elo results HTML.

It must not edit the runtime immediately. It must first generate and validate a normalized 48-team local source package, source manifest, machine-readable quality report, and Codex recognition/implementation prompts under the ignored `codex-inputs/signal-refresh/` workspace.

Required future artifacts:

- `ufo-national-team-signal-refresh-<date>-vN.json`
- `ufo-national-team-signal-refresh-<date>-vN.csv`
- `ufo-signal-refresh-source-manifest-<date>-vN.json`
- `ufo-signal-refresh-quality-report-<date>-vN.json`
- `codex-signal-refresh-recognition-<date>-prompt.txt`
- `codex-signal-refresh-implementation-<date>-prompt.txt`

These are local generated audit artifacts, not runtime dependencies and not required tracked repository assets. See `SIGNAL_REFRESH_PLAYBOOK.md`.

## UIHISTORY01

Recognition is complete, implementation is paused.

Recommended scope:

- keep `/predictions` focused on active/upcoming fixtures;
- show only 4 recent verified results;
- add `Ver historial completo`;
- create `/predictions/history` with server-side `?page=` pagination and page size 12;
- reuse `PublicPredictionCard` for the first MVP;
- no filters, search, infinite scroll, model changes, migrations, or payment changes.

## Immediate next work

1. Merge this documentation refresh.
2. Update the ChatGPT project sources with the refreshed files.
3. Start a new conversation from the refreshed baseline.
4. Continue exact result monitoring for the four public fixtures.
5. Load/publish the next approved runway only after sanity review.
6. Run frontend/mobile/PWA launch work in parallel under the Epic G ownership rules.

## Hard boundaries

Do not expose `prediction_results`, raw Lab/admin/evaluation payloads, provider odds/predictions as model inputs, Torneo human picks as model inputs, service-role keys in app routes, payment secrets in client runtime, or raw source packages as runtime dependencies.
