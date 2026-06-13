# UFO Predictor — Open Decisions

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

## Recently settled

### Authenticated probable score

Settled by PR #63.

Decision:

- probable score is available to authenticated users on match detail;
- anonymous users see teaser/locked value state;
- `prediction_results` stays internal.

### Canonical 48-team World Cup catalog

Settled by PR #64.

Decision:

- use canonical World Cup 2026 catalog as internal source of truth for team coverage;
- keep legacy/test-only snapshot keys only where tests still require them.

### Public finished result verification

Settled by PR #65.

Decision:

- finished public fixtures can be verified in Real Fixture Lab;
- internal evaluation can be persisted;
- public UI may show final status/result;
- public UI must not expose internal evaluation or `prediction_results`.

### E10C real signal enrichment

Settled by PR #66.

Decision:

- commit static generated signal module;
- do not commit `codex-inputs/`;
- use FIFA/Elo/recent-form fields in national-team snapshots;
- keep market and lineup signals neutral placeholders;
- defer expected-goals/scoreline calibration to E10D.

## Current open decisions

### 1. E10D calibration strategy

Open.

Questions:

- how much should Elo/FIFA differential move xG?
- how much should recent form move xG?
- how should historical attack/defense affect scoreline probabilities?
- how should the draw probability be dampened or preserved?
- what fixtures become regression examples?

Default posture:

```text
Start with read-only recognition and output snapshots before changing math.
```

### 2. Market signal policy

Open.

Current state:

```text
marketScore = 50
```

Questions:

- should market odds ever be used as an explicit transparent signal?
- would this conflict with UFO’s no-betting/no-guarantee positioning?
- how do we prevent hidden provider/odds copying?

Default decision until changed:

```text
No betting odds or provider predictions as hidden model input.
```

### 3. Lineup/injury context

Open.

Current state:

```text
lineupContextScore = 50
```

Questions:

- manual editorial admin field or structured external source?
- how fresh must lineup data be?
- how should uncertainty be represented?
- should the public ever see this as explanation copy?

### 4. Encoding/mojibake cleanup

Open / low priority.

Known issue:

- some generated source labels may contain mojibake for accented names.

Decision needed:

- clean now as data polish, or defer until explanation/display uses those labels.

Current recommendation:

```text
Defer unless labels become user-facing or tests reveal risk.
```

### 5. Formal prediction lineage

Open.

Current state:

- public rows are operationally linked by process/history;
- no formal DB-native `source_prediction_version_id` lineage has been implemented.

Question:

- add lineage before broader automation/public accuracy dashboard?

Current recommendation:

- acceptable for MVP 1;
- revisit before scale/automation.

### 6. Premium detail scope

Open.

Already done:

- authenticated probable score.

Still open:

- top scorelines;
- BTTS;
- over/under;
- deeper model explanation;
- watchlist/tournament pass value.

Do not implement payments until premium value is more concrete.

## Standing decisions that should not be reopened casually

- Manual exact-fixture publication remains the MVP path.
- Broad ingest/apply is forbidden for now.
- Supabase migrations are manual.
- `prediction_results` stays internal.
- Public rows should be public-safe copies, not Lab internals.
- Codex should not search the web for model data when normalized local packs are provided.
