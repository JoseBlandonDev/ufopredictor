# Track D — API-Football / Real Fixture Lab Handoff

Last refreshed: after PR #40.

## Purpose

Track D validates real football data ingestion, internal prediction workflows, result verification, and evaluation before broad World Cup launch.

Track D is currently MVP 0: Pre-World-Cup Calibration Lab.

## Completed D05 loop

D05 is the controlled single-fixture Real Fixture Lab loop.

### D05F — Ingest run tracking

Delivered:

- `ingest_runs`;
- `ingest_run_items`;
- before/after snapshots;
- apply evidence.

### D05G — Exact friendly pre-match ingest

Delivered:

- exact `--fixtureId` friendlies ingest;
- `limit=1`;
- scheduled fixture path;
- `admin_only + api_football` defaults;
- broad friendlies blocked.

### D05H — Evaluation persistence

Delivered:

- migration `0023_real_fixture_lab_evaluation_persistence_policies.sql`;
- admin-only `prediction_results` persistence;
- saved evaluation readback;
- no public exposure.

### D05I — Result verification

Delivered:

- migration `0024_real_fixture_lab_match_result_review_policies.sql`;
- admin-only verification action;
- `pending_review -> verified` for existing API-Football results;
- no score editing;
- no result creation.

### D05J — Runtime partial trial

Fixture:

- `api-football:fixture:1540356`;
- Peru vs Spain.

Observed:

- fixture loaded;
- scope `admin_only + api_football`;
- saved prediction visible;
- no `match_results` row;
- verification unavailable;
- evaluation blocked.

Result: partial pass. Missing runtime result data, not system failure.

### D05K — Exact friendly post-match result ingest guard

Delivered:

- exact scheduled friendly still allowed with zero planned results;
- exact finished friendly now allowed only with exactly one planned `pending_review` result write;
- still blocks broad friendlies;
- still blocks World Cup apply;
- no provider predictions;
- no odds;
- no public exposure.

## D06 — Friendly Pilot / Calibration Batch

Status: next active Track D block.

Goal: operate 3-5 exact adult national-team friendlies.

### D06A — Candidate discovery

Read-only candidate command:

```bash
npm run spike:api-football -- --mode beta-candidates --competition friendlies --from <YYYY-MM-DD> --to <YYYY-MM-DD> --limit 20 --prioritize true --report true
```

### D06B — Exact fixture inspection

```bash
npm run spike:api-football -- --mode fixture --fixtureId <providerFixtureId>
```

### D06C — Exact pre-match dry-run

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId <providerFixtureId> --from <YYYY-MM-DD> --to <YYYY-MM-DD> --limit 1 --report true
```

Only after review/approval:

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId <providerFixtureId> --from <YYYY-MM-DD> --to <YYYY-MM-DD> --limit 1 --apply true --report true
```

### D06D — Post-match exact result ingest

Use the same exact command shape after final score exists.

Expected post-match plan:

- one planned match;
- one planned `match_results` row;
- `verification_status='pending_review'`;
- `intake_source='api_football'`.

Then:

- verify result in Real Fixture Lab;
- persist/refresh evaluation;
- capture `prediction_results` readback.

## D06 pilot matrix columns

Recommended columns:

- pilot_slot;
- provider_fixture_id;
- external_id;
- teams;
- kickoff_utc;
- kickoff_local;
- league;
- pre_match_ingest_dry_run_ok;
- pre_match_apply_done;
- match_id_visible;
- saved_prediction;
- prediction_version_id;
- model_version;
- post_match_result_dry_run_ok;
- post_match_apply_done;
- match_result_id;
- match_result_status_before_review;
- result_verified;
- reviewed_at;
- reviewed_by;
- evaluation_persisted;
- evaluation_refreshed;
- winner_correct;
- btts_correct;
- over_2_5_correct;
- exact_score_correct;
- goal_error;
- error_summary;
- internal_notes;
- public_exposure_check.

## Guardrails

Still blocked:

- broad friendlies apply;
- World Cup apply;
- provider predictions;
- odds;
- public exposure;
- service-role in app routes;
- score-editing UI;
- manual result creation UI;
- workers before manual pilot evidence.
