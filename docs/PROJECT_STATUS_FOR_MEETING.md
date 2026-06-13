# UFO Predictor — Project Status for Meeting

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

## Summary

UFO Predictor has progressed from “controlled public World Cup fixtures” to a stronger MVP 1 foundation:

- real fixtures can be published through a manual exact path;
- authenticated users can see probable score;
- finished public fixtures can be verified and internally evaluated;
- all 48 canonical World Cup teams now have real FIFA/Elo/recent-form signal enrichment.

Translation: the model is no longer staring into the void with only fallback signals and optimism. Small mercy.

## What is completed

### MVP 0 / Calibration

- Real Fixture Lab internal loop completed.
- 5-fixture friendly pilot completed.
- `v0.2-prelaunch` activated/frozen for MVP 1 baseline.

### MVP 1 / World Cup Launch

- Exact scheduled World Cup fixture apply guard completed.
- First public fixture path proved.
- Manual publication action stabilized through narrow admin RPC.
- Public real-fixture surface cleaned.
- Exact public refresh path added.
- Authenticated probable score added.
- Public finished-result verification added.
- Canonical 48-team World Cup catalog added.
- Real national-team signal enrichment merged in PR #66.

## Recent shipped milestones

### PR #63 — authenticated probable score

Authenticated users can see probable score on match detail. Anonymous users see teaser state. Internal `prediction_results` remains protected.

### PR #64 — canonical catalog and 48-team coverage

The project now has canonical World Cup 2026 team/fixture coverage and complete snapshot foundation.

### PR #65 — public finished fixture result verification

The Real Fixture Lab can verify finished public fixtures and persist internal evaluation without leaking internals publicly.

Runtime examples verified:

- Mexico 2-0 South Africa;
- South Korea 2-1 Czechia;
- Canada 1-1 Bosnia & Herzegovina.

### PR #66 — real signal enrichment

The national-team snapshot layer now includes:

- FIFA rank/points;
- Elo rank/rating;
- historical Elo match and goals stats;
- recent-form fields;
- neutral market/lineup placeholders.

## What changed technically

A new generated static signal module was added:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

The snapshot layer consumes it through:

```text
lib/prediction-engine/national-team-strength-snapshots.ts
```

This allows the prediction engine to reference real team-strength signals for all 48 canonical World Cup teams.

The source pack is static at runtime and does not depend on local `codex-inputs/`.

## What did not change

PR #66 did not change:

- expected-goals calculation;
- scoreline/modal-score calibration;
- public UI;
- publication/refresh flow;
- API-Football ingest;
- Supabase migrations;
- internal/public data boundary.

This is important because E10C improves the input layer. E10D is still needed to calibrate output behavior.

## Current public product state

The public product supports:

- selected real World Cup fixtures;
- public 1X2 probabilities;
- confidence/risk labels;
- public-safe match detail;
- authenticated probable score;
- public final result/status where verified.

It does not expose:

- `prediction_results`;
- internal evaluation payloads;
- provider predictions;
- betting odds;
- raw Lab internals.

## Current risks / open items

### Scoreline calibration

Even with better signals, the scoreline distribution may remain too conservative until E10D tunes xG/modal-score behavior.

### Market and lineup context

Both are still neutral placeholders:

```text
marketScore = 50
lineupContextScore = 50
```

### Source-label cleanup

Some generated metadata may contain encoding/mojibake in accented labels. Non-blocking now, but should be cleaned before using those labels publicly.

### Lineage/audit debt

Formal DB-native lineage from public rows to internal prediction rows remains a future improvement.

## Recommended next work

### Immediate

- complete docs rebaseline after PR #66;
- clean local `codex-inputs/`;
- ensure main is updated and old branch is deleted.

### Next model task

```text
E10D — expected-goals / scoreline calibration using E10C signals
```

Goals:

1. inspect current xG/scoreline behavior;
2. identify why `1-1` remains overproduced;
3. tune scoreline distribution using FIFA/Elo/recent-form fields;
4. add regression tests;
5. avoid UI/ingest/Supabase changes.

### Later

- lineup/injury context design;
- market-signal policy decision;
- public-safe explanation improvements;
- accuracy dashboard after enough real sample size exists.

## Meeting talking points

- “We now have real signal coverage for all 48 World Cup teams.”
- “The model input layer uses FIFA, Elo, historical stats, and recent form.”
- “Finished public fixtures can be verified safely without exposing internal evaluation.”
- “E10C improved inputs; E10D is still needed for scoreline/xG calibration.”
- “We are still intentionally avoiding betting odds/provider predictions as hidden model inputs.”
