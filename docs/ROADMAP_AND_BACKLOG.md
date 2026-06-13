# UFO Predictor — Roadmap and Backlog

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

## Current roadmap position

UFO Predictor is in **MVP 1 World Cup Launch**.

The launch pipeline is controlled, public fixtures exist, finished-result verification exists, and the prediction-engine snapshot layer now has real national-team signal enrichment for the 48 canonical World Cup teams.

The next meaningful model step is **E10D: expected-goals / scoreline calibration**. Anything else is just rearranging furniture while the house is calculating `1-1` again.

## Recently completed

### E09A — authenticated probable score

Status: Done / PR #63 merged.

Delivered:

- authenticated users can see probable score on public match detail;
- anonymous users get teaser copy;
- `prediction_results` remains internal;
- no payment implementation.

### E10B — canonical World Cup catalog and snapshot foundation

Status: Done / PR #64 merged.

Delivered:

- canonical World Cup 2026 catalog;
- 48-team coverage;
- group/venue/fixture foundation;
- national-team strength snapshot test coverage.

### H01A — public finished fixture result verification

Status: Done / PR #65 merged.

Delivered:

- admin Real Fixture Lab can verify finished public fixtures;
- results verified for the initial completed public fixtures;
- internal evaluation persistence remains protected;
- public surface can show final status/result safely.

### E10C — real national-team signal enrichment

Status: Done / PR #66 merged.

Delivered:

- generated static signal pack module;
- FIFA rank/points for 48 canonical World Cup teams;
- Elo rank/rating;
- historical Elo match stats;
- historical goals for/against and derivatives;
- recent-form fields;
- neutral market/lineup placeholders;
- tests proving coverage and adapter compatibility.

Not delivered by E10C:

- expected-goals calibration;
- scoreline distribution tuning;
- lineup/injury data;
- market data;
- public explanation rewrite.

## Active / immediate backlog

### Docs rebaseline post-E10C

Status: Active.

Goal:

- update all project source docs after PR #66;
- make next conversation and Codex start from the real current state;
- remove stale wording about “only fallback signals” as the current model input foundation.

### E10D — expected-goals / scoreline calibration

Status: Next.

Goal:

- inspect current generated prediction outputs after E10C;
- identify why `1-1` remains too common;
- calibrate xG and modal-score behavior using the enriched signal layer;
- keep public/ingest/UI/Supabase untouched unless explicitly scoped.

Possible E10D tasks:

1. read-only audit of `expected-goals.ts`, `generate-prediction`, scoreline generation, and tests;
2. generate output snapshots for representative fixtures;
3. adjust xG mapping from team-strength differentials and recent form;
4. tune draw/modal score behavior;
5. add regression tests for clear mismatches and balanced fixtures;
6. validate no public/internal boundary changes.

Success criteria:

- strong favorites do not collapse into generic low-confidence draws;
- balanced fixtures can still produce draws;
- modal scores respond to attack/defense/form signals;
- tests prove behavior without overfitting to one live match.

## Later model/data backlog

### E10E — lineup/injury context

Status: Later.

Current state:

- `lineupContextScore` is neutral `50` for all canonical teams.

Future options:

- manual editorial signal;
- structured squad/availability input;
- limited admin-only override with provenance;
- no fake injury data, because apparently reality still matters.

### E10F — market context decision

Status: Open/Later.

Current state:

- `marketScore` is neutral `50`.

Decision needed:

- whether UFO should use market odds as a transparent calibration/reference signal;
- whether this conflicts with no-betting/no-provider-prediction positioning;
- how to avoid hidden odds-driven predictions.

Default until decided:

```text
Do not use betting odds or provider predictions as hidden model input.
```

### Data-quality cleanup

Status: Later.

Known issue:

- generated metadata may contain mojibake in source labels such as accented names.

Impact:

- non-blocking if keys/tests/runtime are unaffected;
- should be cleaned before any user-facing explanation uses those labels.

## MVP 1.5 backlog

- continue exact result verification for public fixtures;
- public-safe final-result polish;
- sample-size-aware accuracy reporting;
- improved explanation copy using signal metadata;
- admin tools for checking signal provenance.

## MVP 2 backlog

- broader fixture coverage;
- automation planning only after exact operations remain stable;
- premium tiers/payment implementation;
- deeper market outputs;
- user watchlists and tournament-pass experience.

## Standing red lines

- Keep `prediction_results` internal.
- Do not expose Lab internals publicly.
- Do not add broad ingest/apply.
- Do not use provider predictions or betting odds as hidden input.
- Do not commit `codex-inputs/`.
- Do not edit applied migrations.
- Do not let Codex “search the web” for data when normalized packs are available.
