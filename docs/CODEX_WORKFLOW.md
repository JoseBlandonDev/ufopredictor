# Codex Workflow - UFO Predictor

_Last reviewed in this refresh: post PR #77. Workflow remains the same._

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

## Hard boundaries

Codex should not expose or introduce public `prediction_results` usage, raw evaluation payloads, service-role app routes, provider odds/prediction inputs, or payment/checkout work outside Epic G.
