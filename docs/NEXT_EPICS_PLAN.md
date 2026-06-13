# UFO Predictor — Next Epics Plan

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

## Current position

E10C is complete and merged. The model now has real input signals for the 48 canonical World Cup teams.

That means the next model work should be **calibration**, not more blind enrichment, not another “maybe the 1-1 will go away if we glare at it” session.

## Immediate sequence

### Step 1 — Local cleanup after PR #66

Run from PowerShell:

```powershell
git checkout main
git pull origin main
git status --short
git branch -d feature/e10c-real-signal-enrichment
git push origin --delete feature/e10c-real-signal-enrichment
Remove-Item -Recurse -Force codex-inputs
git status --short
```

### Step 2 — Docs rebaseline post-E10C

Status: active.

Goal:

- update project source docs after PR #66;
- ensure new conversations know E10C is done;
- ensure Codex does not redo signal enrichment or parse raw packs.

### Step 3 — E10D read-only recognition

Before implementation, ask Codex to inspect:

- expected goals;
- scoreline generation;
- how E10C signals flow into prediction generation;
- tests and current outputs.

No edits in recognition.

### Step 4 — E10D implementation

Implement calibrated xG/scoreline changes only after recognition is reviewed.

## E10D proposed scope

### Goal

Use E10C signals to calibrate expected goals and most-likely-score behavior.

### Likely files to inspect/change

Likely inspect:

- `lib/prediction-engine/expected-goals.ts`
- prediction generation path;
- national-team snapshot consumption;
- scoreline probability logic;
- tests around generated predictions.

Likely tests:

- `lib/prediction-engine/generate-prediction.test.ts`
- `lib/prediction-engine/national-team-strength-snapshots.test.ts`
- adapter tests if fixture output changes.

### E10D non-goals

- no UI changes;
- no publication/refresh changes;
- no API-Football ingest changes;
- no Supabase migrations;
- no payments;
- no public exposure of `prediction_results`;
- no betting odds/provider prediction input.

## E10D success criteria

- favorites and mismatches produce more plausible xG gaps;
- balanced fixtures can still produce draws;
- `1-1` is no longer a lazy attractor for too many fixtures;
- modal score distribution responds to FIFA/Elo/recent-form differences;
- changes are covered by tests;
- no public/internal boundary regressions.

## Later epics

### E10E — lineup/injury context

Current placeholder:

```text
lineupContextScore = 50
```

Future design should define:

- data source;
- manual vs automated handling;
- freshness/provenance;
- public explanation rules.

### E10F — market context decision

Current placeholder:

```text
marketScore = 50
```

Open decision:

- whether to include market data as transparent calibration/reference;
- how to avoid hidden betting-driven predictions;
- whether product positioning allows it.

Default:

```text
Do not use betting odds or provider predictions as hidden model inputs.
```

### Data-quality polish

- cleanup mojibake/source labels;
- ensure display labels are safe for future public explanation;
- keep canonical keys stable.

## Suggested E10D recognition prompt

```text
We are working in UFO Predictor.

Run a read-only recognition for E10D scoreline/xG calibration.

Context:
- PR #66 E10C real signal enrichment is merged.
- The 48 canonical World Cup team snapshots now include FIFA rank/points, Elo rank/rating, historical stats, and recent-form fields.
- marketScore and lineupContextScore are neutral placeholders at 50.
- E10C did not change expected-goals.ts or scoreline calibration.

Do not edit files, commit, push, run SQL, or use web search.

Inspect expected-goals and scoreline generation. Report where 1-1 overproduction likely comes from, how E10C signals currently feed the model, and propose a safe E10D implementation plan with tests.
```
