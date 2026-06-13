# Codex Workflow - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Default workflow

1. Start from updated `main`.
2. Confirm branch and status.
3. Create a scoped branch.
4. Inspect before implementing.
5. Keep scope narrow.
6. Run targeted tests plus lint/build where practical.
7. Report changed files and boundaries.

Baseline commands:

```powershell
git checkout main
git pull origin main
git status --short
git checkout -b feature/<scope>
```

## Documentation refresh workflow

Project-state documentation refreshes are owned by ChatGPT, not Codex by default.

Reason: ChatGPT holds the cross-conversation context that is broader than the repo snapshot. Codex can inspect the repo, but it should not invent project-state docs from scratch unless explicitly asked.

Correct docs refresh flow:

1. ChatGPT generates refreshed Markdown docs.
2. User manually copies the files into `docs/`.
3. Codex runs a docs-only verification.
4. Codex reports:
   - branch/status;
   - changed files;
   - docs-only confirmation;
   - accidental non-doc changes;
   - consistency issues;
   - mojibake/encoding issues;
   - recommended commit message.
5. User commits docs refresh.

Docs refreshes should happen after meaningful state changes, not every microcommit.

## Manual Supabase migrations

Supabase migrations are applied manually by the user in SQL Editor. Codex may generate or inspect migrations when asked, but must not assume they have been applied until the user confirms.

## Parallel work rules

Parallel work is allowed when it is intentionally isolated from active model/data operations.

Epic G parallel-safe areas:

- account/auth UX;
- plans/pricing;
- payment provider spike;
- entitlement design;
- premium gate shell;
- trust/legal copy.

Parallel work should avoid:

- prediction engine;
- API-Football ingest/apply;
- generated signal packs;
- fixture result verification internals;
- public prediction projections;
- `prediction_results`.

## Forbidden unless explicitly scoped

- Broad ingest/apply writes.
- Public exposure of internal evaluation data.
- Hidden odds/provider predictions.
- Committing `codex-inputs/`.
- Service-role app routes.
- Mixing unrelated features in one branch.
- Docs PRs for tiny microchanges.

## Reporting format

Final Codex reports should include:

1. current branch/status;
2. files changed;
3. what changed;
4. validation results;
5. boundary confirmation;
6. next recommended action.
