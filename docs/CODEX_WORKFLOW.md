# Codex Workflow â€” UFO Predictor

Last refreshed: after PR #40.

## Role split

ChatGPT plans, reviews, and coordinates.
Codex inspects and implements locally when explicitly instructed.
The user executes manual SQL, commits, pushes, PRs, and merges unless explicitly stated otherwise.
Docs refresh workflow: ChatGPT drafts/generates approved docs refreshes, the user manually copies them into docs/, and Codex reviews docs-only unless explicitly asked to edit.

## Language rule

Prompts to Codex must be in English.
User-facing guidance may be in Spanish.

## Default recognition prompt constraints

Unless an implementation prompt explicitly says otherwise, Codex must:

- not modify files;
- not commit;
- not push;
- not open PRs;
- not run SQL;
- not apply migrations;
- not perform DB writes;
- not run `--apply true`.

## Branch discipline

Never work directly on `main`.

### Start new task

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/<real-task-name>
git status --short
git branch --show-current
```

Use real branch names. Do not copy placeholders literally.

### After PR merge

```bash
git checkout main
git pull origin main
git status --short
git log --oneline -5
git branch -d <merged-branch>
git push origin --delete <merged-branch>
git status --short
```

If remote branch deletion says `remote ref does not exist`, it usually means GitHub already deleted it. Not a blocker.

Then create the next real task branch from updated `main`.

## PR policy

No PR for every micro-step.
Yes PR for a complete functional slice.

A functional slice usually includes:

- code + tests;
- migration + app path;
- docs-only roadmap refresh;
- or a self-contained operational guard.

## Migration policy

Only one migration-producing branch should be active unless migration numbers are reserved.

Before creating a migration:

1. inspect latest migration number;
2. reserve the next number in chat/project coordination;
3. do not duplicate migration numbers across branches;
4. user manually applies reviewed migrations.

## Parallel contributor rules

If more than one person works on UFO Predictor:

- Jonathan owns Epic D/D06/D07, API-Football, Real Fixture Lab, model/evaluation.
- Second contributor should preferably own Epic G auth/paywall/payment gateway, or Epic F public UX/trust layer.
- Avoid touching the same files in parallel.
- Avoid mixing epics in one PR.
- Coordinate migrations.

## Payment provider rule

Do not assume Stripe.

Current MVP 1 assumption:

- PayPal or selected available/local gateway;
- one-time tournament pass or package for World Cup;
- recurring subscriptions can be considered post-World-Cup.

## Validation

For implementation:

```bash
git diff --check
npm run test
npm run lint
npm run build
```

Run targeted tests first where helpful. Restore `next-env.d.ts` if build modifies it unexpectedly.

For docs-only:

```bash
git diff --check
git status --short
```
