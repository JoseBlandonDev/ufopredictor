# UFO Predictor — Architecture Summary

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

## Architecture posture

UFO Predictor uses a deliberately controlled architecture for real football prediction publication:

```text
external fixture source
-> controlled exact ingest
-> internal prediction engine / Real Fixture Lab
-> manual publication to public_product
-> public-safe surfaces
```

The system favors exact fixture operations over broad automation. Boring? Yes. Safer? Also yes, which is apparently still a virtue when databases are involved.

## Main boundaries

### Public app boundary

Public users may see:

- public match/prediction summaries;
- 1X2 probabilities;
- confidence/risk framing;
- public-safe match detail;
- final result/status where verified;
- authenticated probable score where allowed.

Public users must not see:

- raw `prediction_results`;
- internal Lab/evaluation payloads;
- admin-only evidence;
- provider prediction data;
- service-role data.

### Admin / Real Fixture Lab boundary

The Real Fixture Lab is admin/internal.

It handles:

- exact fixture loading;
- internal prediction generation;
- public publication actions;
- exact refresh of already-public fixtures;
- finished-result verification;
- internal evaluation persistence.

### Database / RLS boundary

Supabase policies and migrations are intentionally narrow.

Important manual migrations:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `0030_real_fixture_lab_public_refresh_rls.sql`
- `0031_authenticated_public_match_probable_score.sql`
- `0032_real_fixture_lab_public_finished_result_verification_rls.sql`

Migrations are applied manually through Supabase SQL Editor. Do not assume deployment automation.

## Prediction engine architecture

### Snapshot layer

The national-team strength snapshot layer is the stable team-input layer for prediction generation.

After PR #66, canonical World Cup team snapshots are built from a generated static signal module:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

The consuming snapshot file:

```text
lib/prediction-engine/national-team-strength-snapshots.ts
```

The generated source module is intentionally runtime-safe:

- no filesystem reads;
- no runtime JSON/CSV/HTML import;
- no dependency on `codex-inputs/`;
- exports static constants;
- is versioned as source code.

### Signal categories after E10C

The runtime snapshot layer now carries:

- FIFA rank/points;
- Elo rank/rating;
- Elo average rank/rating;
- derived historical goals for/against per match;
- recent-form availability via `recentMatchCount`;
- neutral market/lineup placeholders.

The source pack used richer Elo/source data during preparation, but raw Elo match totals, wins/losses/draws, raw goals for/against, and fixture-expectancy metadata are not exposed as active runtime snapshot fields in E10C.

### Still separate: scoreline/xG calibration

E10C did not touch expected-goals or scoreline calibration.

Files such as `expected-goals.ts` remain the next likely target for E10D, but only after read-only diagnosis.

## Publication architecture

### First public publication

Stable path:

```text
internal_lab prediction
-> public_product copy
-> match access scope flipped to public by RPC
```

RPC:

```text
publish_real_fixture_match_access_scope(target_match_id, target_match_slug)
```

Do not replace this with direct match updates unless explicitly scoped.

### Public refresh architecture

Already-public fixtures can be refreshed exactly:

```text
public fixture
-> admin Lab refresh
-> new internal_lab evidence
-> new public_product replacement row
-> public views read latest public_product row
```

Old rows remain as history.

### Finished-result verification architecture

Finished public fixture results are handled through Lab/admin flow:

```text
finished fixture result
-> pending_review
-> admin Verify result
-> verified result status
-> internal evaluation persistence
```

Public surfaces can show final status/result, but internal evaluation remains protected.

## Source-pack architecture

E10C source data came from local normalized packs generated from reviewed FIFA/Elo sources.

Important rule:

```text
Raw input packs belong in codex-inputs/ locally and must not be committed.
```

Committed artifact:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

This lets runtime use stable source code, not local scratch files. A rare outbreak of common sense.

## Current architecture risks

| Risk | Status | Notes |
|---|---:|---|
| scoreline over-conservatism | open | E10D target |
| market signal absent | accepted | placeholder `50` |
| lineup/injury signal absent | accepted | placeholder `50` |
| encoding/mojibake metadata | non-blocking | cleanup later |
| formal DB lineage from public row to internal row | open | acceptable for MVP 1, revisit before broader automation |
| broad automation | intentionally avoided | exact fixture operations only |

## Architectural red lines

- Keep `prediction_results` internal.
- Keep admin Lab separate from public app.
- Keep service-role out of app routes.
- Keep migrations manual and reviewed.
- Do not commit `codex-inputs/`.
- Do not use betting odds or provider predictions as hidden model input.
