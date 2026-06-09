# Codex Handoff — UFO Predictor Current

Last refreshed: after D08A admin lab navigation cleanup.

This file gives Codex the current state and guardrails. Codex should not invent roadmap structure. Follow the MVP-stage plan.

## Current roadmap state

Epic D remains in progress.

Current operational split:

- D06 remains active for remaining post-match result/evaluation work.
- D07 fallback signals are implemented and frozen pending full pilot evidence.
- D08A admin lab navigation cleanup is complete.
- F01 is the next frontend/product workstream and should start in a separate conversation.

## Recent completed work

### PR #38 — Real Fixture Lab evaluation persistence

- Added migration `0023_real_fixture_lab_evaluation_persistence_policies.sql`.
- Added admin-only evaluation persistence.
- Added saved evaluation readback.
- Kept no public exposure.

### PR #39 — Real Fixture Lab result verification

- Added migration `0024_real_fixture_lab_match_result_review_policies.sql`.
- Added admin-only action to verify existing API-Football `match_results`.
- No score editing.
- No result creation.
- No rejection UI.

### PR #40 — Exact friendly post-match result ingest guard

- Extended exact friendlies apply guard.
- Scheduled exact fixture still allowed with zero result rows.
- Finished exact fixture allowed only with one planned `pending_review` result write.
- Broad friendlies and World Cup apply still blocked.

### Post-PR #40 operational progress

- D06C exact pre-match ingest/apply: completed for 5 pilot fixtures.
- D06G-1 admin pilot summary: implemented.
- D07B national-team fallback signals: implemented.
- active model save bridge for Real Fixture Lab: implemented.
- `v0.2-prelaunch` manually activated in DB and saved for all 5 pilot fixtures.
- D08A admin lab navigation cleanup: implemented.

Current evaluated fixtures:

- `api-football:fixture:1544367` — Congo DR vs Chile — result ingested, verified, evaluation persisted.
- `api-football:fixture:1525493` — Hungary vs Kazakhstan — result ingested, verified, evaluation persisted.

Current pending-result fixtures:

- `api-football:fixture:1544368` — Saudi Arabia vs Senegal.
- `api-football:fixture:1540357` — Argentina vs Iceland.
- `api-football:fixture:1546509` — Iraq vs Venezuela.

## D06 expected direction

D06 is already in flight as an operational pilot over 5 exact friendly fixtures.

Current D06 state:

1. Candidate discovery: complete.
2. Pilot matrix selection: complete.
3. Exact pre-match dry-run/apply per fixture: complete.
4. Save internal prediction: complete for v0.1 and v0.2-prelaunch.
5. Exact post-match dry-run/apply after final score: partial.
6. Verify result: partial.
7. Persist evaluation: partial.
8. Capture model errors: partial, wait for full pilot completion.

Important current rule:

- do not change the model again until all 5 pilot fixtures are evaluated.

Early v0.2 evidence from the first 2 evaluated fixtures:

- winner `2/2`;
- BTTS `2/2`;
- over 2.5 `2/2`;
- exact score `0/2`.

## D08A / F01 handoff note

- Beta Lab is now legacy/mock/internal calibration.
- Real Fixture Lab is the active real-data admin lab.
- no provider predictions or betting odds are consumed by the active Real Fixture Lab model.
- odds may only be reconsidered later as a separate benchmark/market-comparison layer, not as hidden model input.

New conversation recommendation:

- start a new conversation for F01 MVP 1 UI Polish / Product Readiness;
- keep F01 limited to public/shared UI polish, encoding cleanup, and interaction states;
- do not touch DB/model/auth/payment/prediction logic in F01.

Resume-this-conversation recommendation:

- use this conversation later for remaining D06 result ingest, verification, and evaluation once the last 3 fixtures publish final scores.

## Payment/monetization planning

Do not assume Stripe.

MVP 1 should use PayPal or another selected/available payment gateway. World Cup launch monetization should prefer one-time packages or tournament pass over recurring subscription complexity.

If a second contributor starts, they should likely work on Epic G recognition/design:

- current auth state;
- Google auth hardening;
- paywall boundary;
- payment gateway options;
- tournament pass entitlement;
- simple account/payment status.

## Branch and PR rules

Never work on `main` directly.

For new work:

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/<real-task-name>
git status --short
git branch --show-current
```

After PR merge:

```bash
git checkout main
git pull origin main
git status --short
git log --oneline -5
git branch -d <merged-branch>
git push origin --delete <merged-branch>
```

Then create the next branch from updated `main`.

Do not use placeholder names literally.

## SQL/migration rules

- No SQL/apply without explicit review.
- User applies migrations manually in Supabase SQL Editor when approved.
- Only one migration-producing branch should be active unless migration numbers are reserved.
- Before adding a migration, inspect latest migration number and coordinate.

## Ingest/apply rules

- No broad friendlies apply.
- No broad World Cup apply.
- Exact fixture apply only when guardrails allow.
- No provider predictions.
- No odds.
- No `--apply true` without explicit user approval.

## App route rules

- No service-role in app routes.
- Keep internal Lab routes internal/admin-only.
- Do not expose `prediction_results` or Lab outputs publicly unless a later Epic explicitly approves publication rules.

## Validation expectations

For code changes:

- `git diff --check`;
- targeted tests;
- `npm run test` when relevant;
- `npm run lint`;
- `npm run build`;
- restore `next-env.d.ts` if build modifies it unexpectedly.

For docs-only changes:

- `git diff --check`;
- `git status --short`;
- no app tests unless code changed by mistake.
