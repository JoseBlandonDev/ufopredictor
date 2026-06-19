# Codex Handoff Current - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Repo baseline

Start from updated `main`:

```bash
git checkout main
git pull origin main
git status --short
```

Expected status: clean after the documentation refresh PR is merged.

## Accepted current state

PR #94 is merged. Do not reopen model calibration by default.

Accepted:

- SIGNAL04 national-team signal refresh;
- DRAW01 conservative draw reconciliation;
- Cabo Verde alias fix;
- Publish Queue Ops navigation;
- unchanged expected-goals formula.

Production baseline also includes Wompi payment activation, automatic premium entitlement, premium-active UX, admin pricing/payment controls, and Torneo admin export.

## Final fair stored evaluation

Scope: latest evaluated `internal_lab` + `pre_match_24h` prediction per unique fixture.

- raw rows: 31;
- unique fixtures: 28;
- 1X2: 16/28;
- exact: 7/28;
- BTTS: 16/27;
- O/U: 16/28;
- average total-goal error: 1.821.

Latest closed fixtures:

- Canada 6-0 Qatar;
- Mexico 1-0 South Korea.

Pending result-review rows: 0.
Pending evaluation rows: 0.

## Model rules

- Stored pre-match metrics are the fair report.
- Refreshed-signal recomputation over completed fixtures is diagnostic only.
- Do not regenerate published/stored predictions using known results.
- Do not combine signal, xG, draw, and publication changes in one slice.
- Do not retry rejected SIGNAL04B/C/D/E or XG01A candidates without a new evidence plan.

See `MODEL_CALIBRATION_CLOSEOUT_PR94.md`.

## Signal refresh input workflow

When given FIFA CSV + Elo ranking HTML + Elo results HTML:

1. inspect and date sources;
2. normalize exactly 48 canonical teams;
3. resolve aliases;
4. generate source manifest and quality report;
5. stop on invalid/future dates or unresolved canonical teams;
6. generate Codex recognition prompt;
7. review before implementation prompt;
8. update committed static signal sources only when approved;
9. run fair overlay and diagnostic recompute separately.

Use the ignored local workspace under `codex-inputs/signal-refresh/`. Do not treat generated ZIP bundles, raw source files, or quality-report templates as required tracked repository assets. See `SIGNAL_REFRESH_PLAYBOOK.md`.

## Current public runway

Four upcoming public fixtures:

- United States vs Australia
- Scotland vs Morocco
- Brazil vs Haiti
- Türkiye vs Paraguay

Use exact-fixture operations only.

## UIHISTORY01

Recognition complete, implementation pending.

Target:

- 4 recent results on `/predictions`;
- `/predictions/history`;
- server pagination `?page=`;
- page size 12;
- verified finished rows only;
- reuse `PublicPredictionCard`.

## Parallel launch track

G09-G14 may run in parallel, but contributors must not touch:

- `docs/`;
- prediction engine/signal packs;
- API-Football ingest;
- result verification/evaluation;
- `prediction_results`;
- Supabase migrations/RLS;
- Wompi webhook/payment confirmation;
- entitlement activation.

Safe areas include visual components, responsive CSS, public layouts, metadata/manifest/icons, UI tests, accessibility, and performance.

## Hard boundaries

No public `prediction_results`, no raw internal payloads, no service-role app routes, no provider odds/predictions as inputs, no Torneo human picks as inputs, no raw refresh package as runtime dependency, and no client-side payment secrets.
