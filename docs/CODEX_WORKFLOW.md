# Codex Workflow - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Standard task flow

1. Start from updated `main`.
2. Confirm clean worktree.
3. Create a focused branch.
4. Keep scope narrow.
5. Run targeted tests, lint, build when code changes.
6. For docs-only refreshes, verify docs-only diff and stale contradictions.
7. Do not push/PR for every micro-step; push when a coherent slice is complete.

## Documentation refresh workflow

When ChatGPT generates updated docs:

1. User copies files into `docs/`.
2. Codex verifies docs-only scope.
3. Codex checks stale contradictions and scope claims.
4. User commits docs refresh.
5. User updates ChatGPT project sources.

## Current operational note

Use `/admin/real-fixture-publish-queue` as the current admin publication path. Do not rely on Real Fixture Lab exact-detail until the stack overflow follow-up is fixed.

## Hard boundaries

Codex should not expose or introduce public `prediction_results` usage, raw evaluation payloads, service-role app routes, provider odds/prediction inputs, payment/checkout work outside Epic G, or Torneo human-pick model inputs.
