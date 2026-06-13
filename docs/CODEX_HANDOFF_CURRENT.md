# Codex Handoff — UFO Predictor Current

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

Use this before asking Codex to inspect or implement anything. Codex is powerful, but so is a chainsaw. Context first, limbs later.

## Current branch baseline

Start from updated `main` unless the user explicitly says otherwise.

Recommended PowerShell baseline:

```powershell
git checkout main
git pull origin main
git status --short
git log --oneline -5
```

Never work directly on `main` for implementation.

## Recent merged PRs

| PR | Title | Notes |
|---:|---|---|
| #63 | `feat: gate probable score to authenticated match detail` | authenticated probable score, anonymous teaser, `prediction_results` internal |
| #64 | `Feature/e10b real team strength snapshots` | canonical 48-team World Cup catalog/snapshot foundation |
| #65 | `feat: support public finished fixture result verification` | admin verification of finished public fixture results |
| #66 | `feat: enrich national team strength signals` | E10C real signal pack wired into snapshot layer |

## PR #66 implementation summary

E10C added a static generated source module:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

It is used by:

```text
lib/prediction-engine/national-team-strength-snapshots.ts
```

Tests updated:

```text
lib/prediction-engine/national-team-strength-snapshots.test.ts
lib/prediction-engine/real-fixture-adapter.test.ts
```

E10C fields include:

- FIFA rank/points;
- Elo rank/rating;
- historical Elo match stats;
- goals for/against and per-match derivatives;
- recent-form fields;
- neutral `marketScore: 50`;
- neutral `lineupContextScore: 50`.

E10C did not change:

- `expected-goals.ts`;
- scoreline calibration;
- publication/refresh;
- API-Football ingest;
- UI/app routes;
- Supabase migrations/policies/helpers.

## Local source-pack rule

`codex-inputs/` was used as a local staging folder for normalized data packs.

Rules:

- do not commit `codex-inputs/`;
- do not import from `codex-inputs/` in runtime code;
- do not depend on local JSON/CSV/HTML at runtime;
- generated source modules may be committed if intentionally produced from reviewed packs.

## Current recommended next implementation: E10D

Suggested branch:

```powershell
git checkout main
git pull origin main
git status --short
git checkout -b feature/e10d-scoreline-calibration
git status --short
git branch --show-current
```

E10D goal:

```text
Calibrate expected-goals and scoreline distribution using E10C enriched national-team signals.
```

Do not start E10D by changing files. First ask Codex for read-only recognition.

## Prompt: read-only recognition for E10D

```text
We are working in the UFO Predictor repo.

Start from the current branch and run a read-only recognition for E10D scoreline/xG calibration.

Context:
- PR #66 E10C real signal enrichment is merged.
- The snapshot layer now includes FIFA rank/points, Elo rank/rating, historical stats, recent-form fields, and neutral market/lineup placeholders for the 48 canonical World Cup teams.
- E10C did not change expected-goals or scoreline calibration.

Read-only scope:
- Do not edit files.
- Do not commit.
- Do not push.
- Do not run SQL.
- Do not touch Supabase.
- Do not run DB writes.
- Do not use web search.

Inspect:
- lib/prediction-engine/expected-goals.ts
- lib/prediction-engine/generate-prediction.ts or equivalent generation path
- national-team strength snapshot consumption
- scoreline probability/modal-score logic
- related tests

Report:
1. current branch and git status;
2. how E10C signals currently feed prediction generation;
3. where expected goals are computed;
4. where scoreline/modal-score behavior is determined;
5. why 1-1 may remain overproduced;
6. a safe implementation plan for E10D;
7. exact files likely to change;
8. tests to add/update;
9. risks and non-goals.

Non-goals:
- no UI changes;
- no publication/refresh changes;
- no API-Football ingest changes;
- no Supabase migrations;
- no prediction_results exposure;
- no betting odds/provider predictions as hidden input.
```

## Stable runtime paths

### Manual first publication

Uses:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `publish_real_fixture_match_access_scope(target_match_id, target_match_slug)`

Do not replace this with direct match updates.

### Exact public refresh

Uses:

- `0030_real_fixture_lab_public_refresh_rls.sql`
- admin-only RLS helper/policy expansion for already-public scheduled API-Football public-product fixtures.

### Authenticated probable score

Uses:

- `0031_authenticated_public_match_probable_score.sql`

### Finished public result verification

Uses:

- `0032_real_fixture_lab_public_finished_result_verification_rls.sql`

## Validation expectations

For model-layer work, Codex should usually run:

```powershell
git diff --check
npm run test -- lib/prediction-engine/national-team-strength-snapshots.test.ts lib/prediction-engine/real-fixture-adapter.test.ts lib/prediction-engine/generate-prediction.test.ts
npm run lint
npm run build
```

Use narrower test commands during iteration if needed, but final report must be explicit.

## Forbidden unless explicitly scoped

- broad ingest/apply;
- service-role app routes;
- public exposure of `prediction_results`;
- Supabase migration creation;
- odds/provider prediction input;
- committing raw source packs;
- editing docs and code in the same PR unless user asks.
