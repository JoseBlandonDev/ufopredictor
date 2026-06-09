# Codex Handoff — UFO Predictor Current

Last refreshed: after PR #40.

This file gives Codex the current state and guardrails. Codex should not invent roadmap structure. Follow the MVP-stage plan.

## Current roadmap state

The project is entering D06 after D05K.

D05 is functionally complete as the Real Fixture Lab controlled single-fixture loop. Epic D remains in progress.

Current next active block:

- D06 — Friendly Pilot / Calibration Batch.

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

## D06 expected direction

D06 is an operational pilot over 3-5 exact friendly fixtures.

D06 begins with read-only candidate discovery. It is not broad friendlies apply.

Expected D06 sequence:

1. Read-only candidate discovery.
2. Pilot matrix selection.
3. Exact pre-match dry-run/apply per fixture.
4. Save internal prediction.
5. Exact post-match dry-run/apply after final score.
6. Verify result.
7. Persist evaluation.
8. Capture model errors.

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
