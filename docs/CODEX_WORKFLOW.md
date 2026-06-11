# UFO Predictor — Codex Workflow

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Purpose

Codex is used as an implementation and inspection assistant. ChatGPT owns planning, sequencing, and context synthesis. This division exists because otherwise every conversation tries to become a startup in miniature, and we already have enough chaos.

## Current operating state

Current `main` includes:

- PR #58 — public launch surface real-fixture safe;
- PR #61 — E07 next World Cup fixture publication;
- migration `0030_real_fixture_lab_public_refresh_rls.sql`;
- MVP 1 fallback signals for immediate World Cup fixtures;
- exact public refresh path for already-public fixtures;
- four real public World Cup fixtures.

## Role split

### ChatGPT

Responsible for:

- maintaining project context;
- planning next slices;
- generating docs refreshes;
- reviewing Codex output;
- creating focused prompts;
- deciding what should and should not be done.

### Codex

Responsible for:

- read-only repo recognition;
- code implementation when explicitly instructed;
- targeted tests;
- diffs/stat summaries;
- PR-ready implementation reports.

Codex should not be used to burn scarce tokens rewriting docs when ChatGPT has the project narrative. A tragic revelation, apparently.

## Branch discipline

Never implement on `main`.

Start a task branch:

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/<real-task-name>
git status --short
git branch --show-current
```

Docs-only branch:

```bash
git checkout main
git pull origin main
git status --short
git checkout -b docs/<real-doc-task-name>
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
git status --short
```

## Prompt language

Codex prompts should be in English.

ChatGPT responses to the user should follow the user’s language.

## Recognition prompts

Recognition means:

- no file edits;
- no commits;
- no pushes;
- no PRs;
- no SQL writes;
- no remote SQL;
- no `--apply true`;
- no migrations applied.

A good recognition prompt asks:

- what files are relevant;
- what current behavior exists;
- what minimal slice is recommended;
- what should not change;
- what validations would be needed.

## Implementation prompts

Implementation prompts must explicitly state:

- branch;
- files likely allowed;
- hard boundaries;
- tests/validation commands;
- expected report format;
- whether migrations may be created;
- whether SQL may be run.

Default implementation constraints:

- no service-role in app routes;
- no broad applies;
- no batch publication;
- no public `prediction_results`;
- no provider predictions;
- no betting odds as hidden model input;
- no payment implementation unless explicitly scoped.

## Migration workflow

Supabase migrations are manual.

Process:

1. create migration file in repo;
2. review the migration;
3. commit/PR/merge;
4. user applies SQL manually in Supabase SQL Editor;
5. user verifies live DB behavior;
6. runtime UI/action is tested;
7. docs are updated.

Codex must not:

- run remote SQL;
- apply Supabase migrations;
- use service-role;
- edit applied migrations;
- rename applied migrations.

Known migration caution:

- there are two historical `0027` filenames;
- do not rename already-merged/applied migrations;
- add new migrations with the next safe number after inspecting the repo.

Recent important migrations:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `0030_real_fixture_lab_public_refresh_rls.sql`

## Validation defaults

For code:

```bash
git diff --check
npm run test -- <targeted-test-file>
npm run lint
npm run build
git status --short
```

For docs-only:

```bash
git diff --check
git diff --stat
git diff --name-only
git status --short
```

If build changes `next-env.d.ts` unintentionally:

```bash
git restore next-env.d.ts
git status --short
```

## Current next Codex task type

After this docs refresh, the next useful Codex task is likely **read-only recognition** for:

```text
E09 — Access tiers for prediction detail + scoreline visibility
```

Questions for that recognition:

1. What prediction fields are already available in public query helpers?
2. Can probable score be shown without exposing `prediction_results`?
3. What is already gated by authentication/admin role?
4. What should anonymous/free/premium see?
5. Are migrations needed, or only UI/query changes?

Do not start by implementing. The road to broken software is paved with “quick UI changes.”
