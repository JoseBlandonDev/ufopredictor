# UFO Predictor - Signal Refresh Playbook

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Purpose

Repeatable, auditable process for refreshing national-team ranking/result signals without making Codex parse raw exports directly or silently introduce leakage.

## When to use

Use after a meaningful source change, such as:

- a new official FIFA ranking release;
- a complete World Cup matchday/result batch;
- a verified multi-fixture result batch;
- a scheduled model monitoring checkpoint.

Do not refresh after every surprising result.

## Accepted input types

- FIFA ranking CSV.
- World Football Elo ranking HTML with table rows loaded.
- World Football Elo results HTML with result rows loaded.

Screenshots are visual sanity evidence only, not primary data sources.

## Existing SIGNAL04 package

The first package used:

- `Ranking FIFA - Hoja 2.csv`;
- `ranking ELO.html`;
- `results.html`.

Generated local workspace artifacts under `codex-inputs/signal-refresh/`:

- `ufo-national-team-signal-refresh-post-md1-v1.json`;
- `ufo-national-team-signal-refresh-post-md1-v1.csv`;
- `ufo-signal-refresh-source-manifest-post-md1-v1.json`;
- `prompts/codex-signal-refresh-recognition-post-md1-prompt.txt`;
- `prompts/codex-signal-refresh-implementation-post-md1-prompt.txt`;
- `raw/ranking-fifa-raw.csv`;
- `raw/ranking-elo-raw.html`;
- `raw/results-elo-raw.html`.

It covered 48 teams but was not fully runtime-safe. Known defects included invalid dates such as `2026-06-31`, future-dated rows relative to generation time, unresolved canonical aliases, external opponent keys, incomplete recent lists, and retrospective leakage risk.

SIGNAL04 intentionally did not import raw `last5` arrays.

## Required future package

Generate:

- `ufo-national-team-signal-refresh-<date>-vN.json`
- `ufo-national-team-signal-refresh-<date>-vN.csv`
- `ufo-signal-refresh-source-manifest-<date>-vN.json`
- `ufo-signal-refresh-quality-report-<date>-vN.json`
- `codex-signal-refresh-recognition-<date>-prompt.txt`
- `codex-signal-refresh-implementation-<date>-prompt.txt`
- optional local ZIP/export bundle if an owner explicitly wants one for delivery, not as a required tracked repository artifact

## Quality gates

The quality report must check:

1. exactly 48 canonical World Cup teams;
2. zero duplicate canonical teams;
3. zero invalid dates;
4. zero recent-match dates later than `generatedAt`;
5. recent matches ordered newest first;
6. no more than five valid recent matches per team;
7. all World Cup teams mapped to exact runtime keys;
8. all World Cup-team opponent aliases resolved;
9. unresolved external opponents reported separately;
10. incomplete recent lists counted;
11. source coverage recorded;
12. explicit `pass` or `fail` verdict.

Required shape:

```json
{
  "schemaVersion": "ufo-signal-refresh-quality-v1",
  "generatedAt": "...",
  "canonicalTeamCount": 48,
  "duplicateTeamCount": 0,
  "invalidDateCount": 0,
  "futureDateCount": 0,
  "unresolvedCanonicalOpponentCount": 0,
  "unresolvedExternalOpponentCount": 0,
  "incompleteRecentListCount": 0,
  "aliasRemaps": [],
  "sourceCoverage": {},
  "verdict": "pass"
}
```

If verdict is `fail`, do not generate or execute the implementation prompt unless the owner explicitly approves a documented exception.

## Normalization rules

- Normalize only the 48 canonical World Cup teams.
- Preserve source names separately from canonical runtime keys.
- Treat rivals outside the 48-team set as external, not silently canonical.
- Reject impossible dates.
- Reject future rows relative to package generation time.
- Deduplicate match rows.
- Use the newest valid five matches at most.
- Separate raw recent rows from runtime-safe aggregates.

## Runtime rule

Runtime reads committed TypeScript/static source modules and tests.

Runtime must not import raw CSV/HTML, normalized JSON/CSV, manifests, quality reports, or ZIP bundles.

Source packages are local ignored scratch/audit/Codex inputs, normally stored under `codex-inputs/signal-refresh/`, and should remain uncommitted unless explicitly approved.

## Codex flow

### Recognition

Codex must inspect current static signal architecture, canonical keys, tests, and the normalized/quality artifacts. Recognition is read-only.

### Implementation

Only after recognition review, Codex may update:

- static national-team signal module;
- tiny snapshot mapping if required;
- focused prediction-engine tests.

Codex must not update UI, Supabase, migrations/RLS, ingest, publication, payments, Torneo export, result evaluation, or xG/draw calibration unless separately scoped.

## Performance evaluation

Always separate:

### Fair stored baseline

Prediction actually stored before the match.

### Fair overlay

New deterministic logic applied to stored output without later information.

### Diagnostic shadow recompute

Current/refreshed signals recomputed over historical fixtures. Label as diagnostic, never as a fair backtest.

Do not use known final results to rewrite old predictions.

## Forbidden inputs

- betting odds;
- provider predictions;
- Torneo human picks;
- hidden manual fixture outcome overrides;
- post-match result knowledge in a claimed pre-match test.

## Validation

```bash
git diff --check
npm run test -- lib/prediction-engine/national-team-strength-snapshots.test.ts lib/prediction-engine/real-fixture-adapter.test.ts lib/prediction-engine/generate-prediction.test.ts
npm run lint
npm run build
```

Also verify:

- exactly 48 runtime teams;
- aliases resolve;
- no raw source import;
- no invalid/future dates in committed data;
- fair and diagnostic metrics are labeled separately.

## Documentation follow-up

Update:

- `MODEL_CALIBRATION_CLOSEOUT_PR94.md` or successor closeout;
- `MODEL_V01.md`;
- `CODEX_HANDOFF_CURRENT.md`;
- `CURRENT_PROJECT_STATUS.md`;
- `DOCS_AND_SOURCES_INVENTORY.md`;
- roadmap/open decisions if cadence or model decisions change.
