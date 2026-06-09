# Codex Workflow — UFO Predictor

_Last updated after D05G / Real Fixture Lab validation._

## Codex role

Codex is used as:

- repo inspector;
- narrow implementer;
- validator;
- terminal/repo auditor.

Codex is not the owner of broad documentation refresh unless explicitly instructed.

## Prompt language rule

All prompts intended for Codex must be written in English.

This applies even if the user and ChatGPT are discussing the project in Spanish.

Reason:

- English prompts reduce ambiguity in commands, file paths, branch names, migration names, and validation instructions.
- Codex reports and code execution are easier to keep consistent in English.

Required pattern:

1. ChatGPT explains strategy to the user in the user's language.
2. ChatGPT provides the final Codex prompt in English.
3. The Codex prompt must include:
   - exact scope;
   - no-go boundaries;
   - files to inspect/change;
   - validation commands;
   - expected report format;
   - explicit “do not push / do not PR” unless approved.

## Standard no-go lines for Codex prompts

Use as needed:

```text
Do not run SQL.
Do not apply migrations.
Do not run DB writes.
Do not run `--apply true`.
Do not push.
Do not open a PR.
Do not touch public views.
Do not touch provider predictions or odds.
Do not persist prediction_results unless explicitly approved.
```

## Migration workflow

For DB/RLS changes:

1. Recognition/design first.
2. Draft migration only.
3. Review SQL.
4. Manual apply in Supabase SQL Editor.
5. SQL validation.
6. App validation.
7. Commit local migration file.

Do not let Codex apply migrations automatically unless explicitly instructed.

## Apply workflow

For API-Football ingest applies:

1. Read-only inspection.
2. Dry-run.
3. Review output.
4. Explicit approval for apply.
5. Apply command with strict flags.
6. SQL validation.
7. Public exposure validation.

Never skip dry-run.

## Documentation workflow

Preferred process:

1. Codex recognizes repo state.
2. ChatGPT generates documentation refresh.
3. User applies/replaces docs.
4. Codex validates docs against repo state.
5. Commit docs.

Do not ask Codex to rewrite broad docs unless needed.

## Validation commands

For code changes:

```bash
git diff --check
npm run test
npm run lint
npm run build
git status --short
```

If build modifies `next-env.d.ts`:

```bash
git restore next-env.d.ts
git status --short
```

## Current project-specific caution

RLS recursion has occurred multiple times in this branch. For future RLS changes:

- Avoid inline policy subqueries that can re-enter the same table.
- Use narrow `security definer` boolean helpers where needed.
- Helpers must return boolean only.
- Helpers must use `search_path=public`.
- Helpers must not expose row data.

## Current ingest caution

D05G enables only exact single-friendly ingest.

It does not authorize:

- broad friendlies apply;
- World Cup apply;
- batch friendlies;
- public exposure.
