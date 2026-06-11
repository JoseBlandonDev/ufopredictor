# Codex Workflow — UFO Predictor

Last refreshed: post-E05 / first public World Cup fixture publication.

## Role split

ChatGPT plans, reviews, and coordinates.
Codex inspects and implements locally when explicitly instructed.
The user executes manual SQL, commits, pushes, PRs, and merges unless explicitly stated otherwise.

Docs refresh workflow: ChatGPT drafts/generates approved docs refreshes, the user manually copies them into `docs/`, and Codex reviews docs-only unless explicitly asked to edit.

## Language rule

Prompts to Codex must be in English.
User-facing guidance may be in Spanish.

## Command clarity rule

When giving shell commands, state clearly whether they are:

- for the user to run in PowerShell;
- for Codex to run;
- or just explanatory examples.

Do not mix operational commands and explanation in a way that leaves the user guessing. Guessing is how we got half of civilization, and look how that turned out.

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

Do not push/PR every tiny speculative change during live debugging unless the branch must be merged to test or preserve a completed slice.

Prefer:

- read-only diagnosis first;
- one branch for a coherent functional slice;
- commit after validation;
- push/PR after the slice has a clear purpose and review evidence.

A functional slice may include:

- code + tests;
- migration + app path;
- docs-only roadmap refresh;
- a self-contained operational guard;
- a runtime fix that must be merged before manual SQL/app verification.

## Migration policy

Supabase migrations are created in repo but applied manually in Supabase SQL Editor unless a future deployment pipeline is explicitly introduced.

Known caution:

- this repo already contains a `0027` numbering collision:
  - `0027_google_oauth_profile_sync.sql`
  - `0027_inline_manual_publication_match_update_check.sql`
- do not rename already-merged/applied migrations retroactively;
- do not edit already-applied migrations.

Before creating a migration:

1. inspect latest migration number;
2. inspect existing filenames and reserve/use the next unused number;
3. do not duplicate migration numbers across branches;
4. do not edit already-applied migrations;
5. make the new migration narrowly scoped and idempotent where practical.

After migration PR merge:

1. user applies SQL manually;
2. verify live function/policy/table state;
3. run runtime UI/action test;
4. document outcome;
5. track manual Supabase SQL application in task notes and/or PR body.

## Manual publication warning

The stable publication path is not a direct `matches.update(...)` from the app.

Use:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `publish_real_fixture_match_access_scope(target_match_id, target_match_slug)`

Direct update policies looked correct but failed in live runtime. Do not regress this unless there is a planned replacement.

## Parallel contributor rules

If more than one person works on UFO Predictor:

- Jonathan owns World Cup ingest/publication, API-Football, Real Fixture Lab, model/evaluation unless delegated.
- A second contributor should preferably own Epic G auth/paywall/payment gateway or Epic F public UX/trust layer.
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
npm run test -- <targeted-test-file>
npm run lint
npm run build
git status --short
```

Run targeted tests first where helpful. Restore `next-env.d.ts` if build modifies it unexpectedly.

For docs-only:

```bash
git diff --check
git status --short
```

## Current hard boundaries

- no broad World Cup apply;
- no broad friendlies apply;
- no automatic publication;
- no batch publication;
- no service-role in app routes;
- no public `prediction_results`;
- no provider predictions;
- no betting odds as hidden model input;
- no model rewrite without a planned epic;
- no editing applied migrations.
