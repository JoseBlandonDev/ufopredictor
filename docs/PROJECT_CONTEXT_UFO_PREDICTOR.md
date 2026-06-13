# Project Context - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

UFO Predictor is a probabilistic World Cup 2026 football prediction product.

Current phase: MVP 1 controlled public fixture operations.

## Product boundaries

UFO Predictor does not:

- accept bets;
- guarantee results;
- use provider predictions/odds as hidden inputs;
- expose internal evaluation data publicly.

## Current product state

- Public selected-fixture predictions exist.
- Public predictions prioritize active/upcoming fixtures.
- Finished fixtures can show verified final results.
- Real Fixture Lab is usable for current operations.
- Premium detail is not implemented.

## Current model state

- E10C signal enrichment complete.
- E10D xG/scoreline calibration complete.
- `marketScore` and `lineupContextScore` remain neutral.

## Collaboration context

ChatGPT generates project-state docs refreshes. User manually copies docs into repo. Codex verifies docs-only consistency.

A parallel-safe Epic G is planned for account/plans/billing/product shell work so another contributor can help without colliding with model/data operations.
