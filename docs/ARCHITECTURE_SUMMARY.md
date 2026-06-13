# Architecture Summary - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Current architecture read

UFO Predictor has an MVP 1 public real-fixture flow backed by internal admin operations and public-safe projections.

The architecture still separates:

- internal Lab/admin prediction and evaluation;
- public-safe prediction summaries;
- verified result projection;
- exact API-Football fixture operations;
- runtime-safe static model signal data.

## Public surface

Public pages can show:

- selected public fixtures;
- match metadata;
- public 1X2 probabilities;
- confidence/risk labels;
- public probable score where available;
- verified final result fields;
- explanatory copy around probabilities.

Public pages must not expose:

- `prediction_results`;
- raw evaluation payloads;
- Lab/admin payloads;
- provider predictions;
- betting odds as hidden model input;
- service-role data.

## Public projections

The public prediction surface relies on public-safe projections/views and query helpers. PR #70 added verified-result projection to public-safe views through:

- `0034_public_verified_match_results_projection.sql`.

This projects only verified final result fields. It must not become a doorway to internal evaluation state. Humanity has enough doorways to bad ideas.

## Finished fixture refresh path

PR #69 plus migration `0033_real_fixture_lab_finished_public_refresh_prediction_policies.sql` allow exact admin-only prelaunch refresh for already-public scheduled/finished API-Football fixtures.

Properties:

- exact `externalId` driven;
- admin-only;
- append-only prediction rows;
- no result mutation;
- no `prediction_results` mutation/exposure;
- no batch refresh;
- no provider predictions/odds.

## Real Fixture Lab

PR #71 improved Real Fixture Lab usability without changing backend action semantics:

- current World Cup fixtures prioritized;
- legacy/pilot fixtures secondary/collapsed;
- filters for operational states;
- pending/loading submit UI;
- pointer/disabled controls;
- exact fixture lookup unchanged.

## Prediction model runtime

E10C introduced runtime-safe enriched national-team strength signals for 48 canonical World Cup teams. E10D recalibrated expected-goals and scoreline behavior to use that context more meaningfully.

Runtime must not load raw source packs from `codex-inputs/`.

## Data and migrations

Supabase migrations are applied manually through SQL Editor. When a migration is added to the repo, the user still applies it manually to the target database.

Recent relevant migrations:

- `0033_real_fixture_lab_finished_public_refresh_prediction_policies.sql`
- `0034_public_verified_match_results_projection.sql`

## Parallel work architecture boundaries

Epic G is planned for product platform and monetization foundations. It should stay mostly in account/plans/billing/product shell files.

Parallel contributors should not touch:

- `lib/prediction-engine/`;
- API-Football ingest/apply logic;
- generated signal packs;
- `prediction_results`;
- result verification internals;
- public prediction projections;
- manual publication/refresh internals.

Possible future platform areas:

- auth/account UX;
- plans/pricing;
- payment provider spike;
- entitlement design;
- premium gate shell;
- trust/legal copy.

## Open architecture gaps

- Premium detail projection is not implemented.
- Venue/stadium metadata is incomplete.
- Signal refresh workflow is not formalized.
- Lineup/injury and market context remain neutral placeholders.
- Worker/cron automation is future work.
