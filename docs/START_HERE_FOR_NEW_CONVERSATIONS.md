# START HERE — UFO Predictor

Last refreshed: after PR #40 (`feat: allow exact friendly post-match result ingest`).

This file is the entry point for new ChatGPT/Codex conversations. Use it to avoid inventing a new roadmap every time a conversation starts, because apparently humans and bots both enjoy wandering into traffic when documentation is stale.

## Current position

UFO Predictor is moving from the completed single-fixture Real Fixture Lab foundation into a pre-World Cup friendly pilot.

Completed foundations:

- Epic A — project/app foundation: complete.
- Epic B — public prediction foundation: complete.
- Epic C — registered/premium foundation: complete.
- Epic D is in progress and currently represents real-data validation and pre-World Cup calibration.

The D05 controlled single-fixture Real Fixture Lab loop is functionally complete after D05K.

## Current branch discipline

Never work directly on `main`.

After every PR merge:

```bash
git checkout main
git pull origin main
git status --short
git log --oneline -5
git branch -d <merged-branch>
git push origin --delete <merged-branch>
```

If the remote branch is already gone and Git says `remote ref does not exist`, that is not a blocker. Git is just complaining about a ghost.

Then create the next real branch from updated `main`:

```bash
git checkout -b feature/<real-task-name>
git status --short
git branch --show-current
```

Do not copy placeholder names like `<real-task-name>` literally. Windows already made its opinion clear.

## Codex usage rules

Prompts to Codex must be in English.

Codex is an executor/inspector. ChatGPT is used for planning, review, and coordination.

Default constraints unless explicitly overridden:

- Do not modify files during recognition prompts.
- Do not commit, push, open PRs, or merge without explicit approval.
- Do not run SQL or apply migrations without explicit review and manual approval.
- Do not run `--apply true` unless explicitly approved.
- Do not use service-role in app routes.
- Do not expose Lab/internal outputs publicly.

## Current MVP-stage roadmap

### MVP 0 — Pre-World Cup Calibration Lab

Goal: validate the prediction loop and model v0.1 with controlled friendly fixtures before official World Cup matches.

Active epic:

- Epic D — Real Data & Calibration Lab.

Immediate next block:

- D06 — Friendly Pilot / Calibration Batch.

### MVP 1 — World Cup Launch MVP

Goal: ship a safe World Cup-focused MVP while tournament demand is active.

Likely epics:

- Epic E — World Cup Data & Prediction Launch.
- Epic F — Public Experience & Trust Layer.
- Epic G — Auth, Paywall, and One-Time Payment Gateway Slice.

MVP 1 monetization should use one-time packages or a tournament pass, not a complex recurring subscription system. Do not assume Stripe. Default payment candidates are PayPal or another selected/available payment gateway.

### MVP 1.5 — Live World Cup Iteration

Goal: improve during the tournament using real results, user feedback, and operational pain.

Likely epics:

- Epic H — Live Evaluation & Model Iteration.
- Epic I — Workers Lite & Operational Automation.
- Epic J — Monetization/Product Iteration During Tournament.

### MVP 2 — Post-World-Cup Sustainable Product

Goal: turn UFO Predictor into a recurring football prediction product.

Likely epics:

- Epic K — Recurring Competitions.
- Epic L — Recurring Payments & Premium Depth.
- Epic M — Model & Transparency Maturity.
- Epic N — Production Operations & Scale.

## D05 status

D05 is the Real Fixture Lab controlled single-fixture loop. It is functionally complete after PR #40.

Completed D05 blocks:

- D05F — ingest run tracking.
- D05G — exact friendly pre-match ingest.
- D05H — Real Fixture Lab evaluation persistence.
- D05I — Real Fixture Lab result verification.
- D05J — first runtime E2E trial, partial pass.
- D05K — exact friendly post-match result ingest guard.

D05J partial pass was not a system failure. It was blocked because `api-football:fixture:1540356` had no `match_results` row at runtime.

Do not keep extending D05 into D05L/D05M/D05Z. Future work belongs in D06+.

## Immediate next work

Start D06.

Recommended branch:

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/d06-friendly-pilot-calibration
git status --short
git branch --show-current
```

D06 starts with read-only candidate discovery for 3-5 adult national-team friendlies.

No writes at first. No broad apply. No World Cup apply.

## Hard no-go list

Until explicitly approved:

- broad friendlies apply;
- broad World Cup apply;
- provider predictions;
- betting odds;
- public exposure of Lab outputs;
- service-role in app routes;
- score-editing UI;
- manual result creation UI;
- automatic public prediction publication;
- full workers before manual flow evidence;
- large model rewrite before pilot evidence.
