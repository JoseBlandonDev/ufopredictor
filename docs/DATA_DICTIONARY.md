# UFO Predictor — Data Dictionary

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

This dictionary documents fields and concepts that matter for the current MVP 1 prediction/publication flow. Do not treat this as a complete database schema dump. That would be useful in theory and unreadable in practice, a classic human compromise.

## Prediction visibility concepts

### `prediction_results`

Internal-only prediction/evaluation data.

Rules:

- do not expose publicly;
- do not use directly in public routes;
- do not show internal evaluation payloads;
- keep Lab/admin boundary intact.

### `internal_lab`

Internal prediction/evidence row type or context.

Used for:

- Real Fixture Lab evidence;
- admin review;
- internal evaluation.

Not public.

### `public_product`

Public-safe prediction row/context.

Used for:

- public predictions list;
- match detail;
- public display of selected safe fields.

Public refresh appends a new `public_product` row rather than mutating history.

## Match/publication concepts

### Match access/public status

Manual publication changes match visibility through narrow controlled RPC, not direct random row edits.

Stable RPC:

```text
publish_real_fixture_match_access_scope(target_match_id, target_match_slug)
```

### Finished result verification

Finished public fixtures can go through:

```text
pending_review -> verified
```

Admin action verifies the result and allows internal evaluation persistence. Public final result/status can be shown without exposing internal `prediction_results`.

## National-team strength snapshot fields

After PR #66, canonical World Cup national-team snapshots include real signal metadata for all 48 teams.

### FIFA fields

| Field | Meaning | Status |
|---|---|---:|
| `fifaRank` | FIFA ranking position | active after E10C |
| `fifaPoints` | FIFA ranking points | active after E10C |
| `fifaScore` | derived normalized FIFA signal score, where present | active after E10C |
| `fifaSourceTeamName` / provenance equivalent | source-label mapping | metadata; may contain encoding/source-label cleanup debt |

### Elo fields

| Field | Meaning | Status |
|---|---|---:|
| `eloRank` | Elo ranking position | active after E10C |
| `eloRating` | Elo rating | active after E10C |
| `eloAverageRank` | Elo average rank from the source pack | active after E10C |
| `eloAverageRating` | Elo average rating from the source pack | active after E10C |

Raw Elo totals such as matches, wins, losses, draws, goals for, and goals against were used during source-pack preparation, but E10C does **not** expose those raw totals directly in the runtime snapshot layer. The committed snapshot layer exposes the derived fields below instead. A future data-quality/model task can promote additional raw fields if the model needs them.

### Derived historical fields

| Field | Meaning | Status |
|---|---|---:|
| `historicalGoalsForPerMatch` | goals-for rate derived from historical Elo stats | active after E10C |
| `historicalGoalsAgainstPerMatch` | goals-against rate derived from historical Elo stats | active after E10C |

Other normalized scores may exist in the local/generated signal-pack source, but they should not be documented as active runtime snapshot fields unless the TypeScript snapshot type exposes them. Yes, field drift is how documentation becomes decorative wallpaper.

### Recent-form fields

| Field | Meaning | Status |
|---|---|---:|
| `recentMatchCount` | recent matches available/used from the source pack | active after E10C |

Recent-form data came from 2025/2026 results in the local normalized E10C pack. E10C records recent-form availability/count in the runtime snapshot layer; deeper recent-form scoring remains available for future model work and E10D analysis if wired explicitly.

### Placeholder fields

| Field | Current value | Meaning |
|---|---:|---|
| `marketScore` | `50` | neutral placeholder; no market/odds signal currently used |
| `lineupContextScore` | `50` | neutral placeholder; no lineup/injury signal currently used |

Do not interpret these as real signals yet. They are placeholders, not tiny oracles.

## Generated source module

Committed generated module:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

Expected properties:

- static source constants;
- no runtime filesystem dependency;
- no runtime `codex-inputs/` dependency;
- generated from reviewed local pack;
- covers all 48 canonical World Cup teams.

## Local input files

Local-only source packs may live temporarily under:

```text
codex-inputs/
```

Rules:

- do not commit;
- do not import from runtime code;
- delete after merge/cleanup;
- use only for generation/audit.

## Known data-quality debt

Some source labels may have encoding/mojibake for accented names such as country display labels.

Current interpretation:

- non-blocking if canonical keys and tests are correct;
- should be cleaned before user-facing explanation copy depends on those labels.

## Forbidden data assumptions

Do not assume:

- market odds exist as model input;
- provider predictions exist as model input;
- lineup/injury context is real yet;
- `prediction_results` can be publicly queried;
- raw source HTML/CSV should be used at runtime;
- all public result/evaluation data is safe to expose.
