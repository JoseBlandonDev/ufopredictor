# Codex Workflow - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Standard task flow

1. Start from updated `main`.
2. Confirm clean worktree.
3. Create a focused branch.
4. Keep one coherent scope.
5. Run targeted tests, lint, and build for code changes.
6. Verify docs-only diff for documentation changes.
7. Push/PR only when the slice is coherent.

## Model/data evidence rules

- Fair performance uses stored pre-match predictions.
- A fair overlay may apply a new deterministic rule to stored output without later information.
- Current-signal recomputation over completed fixtures is diagnostic only.
- Never rewrite historical predictions using known results.
- Never mix signal refresh, xG changes, draw logic, and publication in one implementation slice.

## Signal refresh workflow

When ChatGPT receives FIFA CSV, Elo ranking HTML, and Elo results HTML:

1. inspect source date/shape;
2. normalize exactly 48 canonical teams;
3. validate aliases, duplicates, invalid/future dates, missing rows, and incomplete recent lists;
4. generate normalized JSON/CSV;
5. generate source manifest;
6. generate machine-readable quality report;
7. stop if verdict is `fail` unless owner approves an exception;
8. generate Codex recognition prompt;
9. review recognition;
10. generate implementation prompt;
11. update committed static signal modules/tests only;
12. run fair overlay and diagnostic recompute separately.

Raw source/normalized packages remain local ignored audit inputs under `codex-inputs/signal-refresh/` and are not runtime dependencies or required tracked repository assets.

## Documentation refresh workflow

1. ChatGPT updates existing canonical sources, not parallel replacements.
2. User copies the provided files into `docs/`.
3. Codex verifies docs-only scope and stale contradictions.
4. User commits/PRs the coherent docs refresh.
5. User updates ChatGPT project sources.

## Documentation ownership lock

Parallel frontend/mobile/PWA branches must not modify `docs/` or canonical project-source documents unless explicitly assigned.

Protected documents include:

- `START_HERE_FOR_NEW_CONVERSATIONS.md`;
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`;
- `CURRENT_PROJECT_STATUS.md`;
- `ROADMAP_AND_BACKLOG.md`;
- `EPIC_PROGRESS_MATRIX.md`;
- `MODEL_V01.md`;
- `CODEX_HANDOFF_CURRENT.md`;
- `SIGNAL_REFRESH_PLAYBOOK.md`;
- `MODEL_CALIBRATION_CLOSEOUT_PR94.md`.

Parallel contributors report documentation impacts in their handoff; the main owner applies them later.

## Parallel launch ownership

Safe by default:

- visual components;
- responsive CSS;
- public layouts;
- metadata/manifest/icons;
- UI tests;
- accessibility/performance.

Owner-locked unless explicitly assigned:

- prediction engine/signals;
- API-Football ingest;
- result review/evaluation;
- `prediction_results`;
- Supabase migrations/RLS;
- Wompi webhook/payment confirmation;
- entitlement activation;
- canonical docs.

Coordinate exact files before work, especially navbar, pricing, account, premium, and checkout presentation.

## Operational note

Use exact fixture workflows and focused admin queues. Do not broad-apply unknown fixtures or use Real Fixture Lab exact-detail as a required path.

## Hard boundaries

No public internal evaluation data, no provider odds/predictions as inputs, no Torneo human picks as inputs, no service-role app routes, no client payment secrets, and no unsafe PWA caching of dynamic/sensitive routes.
