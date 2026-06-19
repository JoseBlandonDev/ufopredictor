# Architecture Summary - UFO Predictor

_Last refreshed: post PR #99 Data Ops 06 / PR #98 Prediction Review Gate / PR #97 reproducible signal refresh (2026-06-19)._

## System boundaries

UFO Predictor separates five concerns:

1. public prediction products;
2. premium public-safe projections;
3. internal/admin review and evaluation;
4. exact fixture ingest and publication operations;
5. payment and entitlement state.

Public surfaces must never expose `prediction_results`, raw Lab payloads, internal evaluations, service-role data, payment secrets, provider predictions/odds, or Torneo user picks.

## Public product surfaces

- `/`: public landing page.
- `/predictions`: active/upcoming predictions plus a bounded recent-results section.
- `/predictions/upcoming`: expanded upcoming view.
- `/predictions/history`: paginated verified history.
- `/matches/[slug]`: public match detail.
- Protected premium detail: xG, top scorelines, BTTS, O/U 2.5, confidence, and risk.

UIHISTORY01 is implemented through PR #96. The prediction list no longer depends on loading unlimited history into the main page.

## Model architecture

### Closed model baseline

PR #94 remains the accepted model closeout:

- SIGNAL04 retained;
- DRAW01 retained;
- `expected-goals.ts` unchanged;
- rejected XG01A and signal rollback candidates remain rejected.

The 2026-06-19 signal refresh did not reopen model calibration.

### Reproducible signal layer

PR #97 introduced a tracked source snapshot under:

```text
data/prediction-engine/national-team-signals/2026-06-19/
```

Runtime continues to consume the generated static TypeScript signal pack only.

The source layer includes:

- validated FIFA metadata;
- Elo ratings;
- recent-result aggregates;
- fixture Elo coherence data;
- Spanish/English display-name metadata;
- source manifest and quality report;
- deterministic generator and idempotence check.

Raw HTML/CSV are source/audit inputs, not runtime dependencies.

## Prediction Review Gate

PR #98 added `/admin/prediction-refresh-review`.

Review artifacts are isolated from normal public prediction versions:

- `prediction_review_cases`;
- `prediction_review_snapshots`;
- `prediction_review_ai_executions`;
- `prediction_review_decisions`.

The gate supports:

- provider revalidation through API-Football;
- deterministic shadow prediction generation;
- refresh-delta alerts;
- Elo coherence alerts;
- auditable human decisions;
- immutable publication lineage.

AI is not connected. Reviewed-xG remains preview-only.

## Data Ops 06 and batch publication

PR #99 added a controlled Matchday 2 workflow with dry-run/write behavior and idempotence.

Final Group Stage - 2 state:

- 24 unique fixtures;
- 5 frozen because they were finished, live, or kickoff-passed;
- 3 future fixtures regenerated with V2 signals;
- 6 existing V2 internal predictions promoted through safe publication;
- 9 immutable public versions created;
- post-write rerun produced no additional writes.

## Torneo Mundialista integration

TM01 is operational.

The admin export and batch export use contract:

```text
torneo-ufo-export-v1
```

The delivered Matchday 2 file contains:

- 24 unique fixtures;
- production UFO links;
- 1X2;
- xG;
- modal and top scorelines;
- confidence/risk;
- BTTS;
- O/U 2.5;
- no private review or evaluation payloads.

Torneo human picks do not enter the UFO model.

## API-Football operations

Preferred approach:

- use console for repetitive reads, inventories, and dry-runs;
- use exact fixture or exact round selection;
- revalidate provider state before writes;
- freeze live, finished, or kickoff-passed fixtures;
- never broad-apply unknown fixtures.

## Payment and entitlement architecture

G05/G06/G07 production baseline:

```text
Wompi APPROVED webhook
-> validated event
-> entitlement_grant
-> user_entitlement or user_match_unlock
-> premium-active presentation
```

Redirects and client assertions do not activate premium. `subscriptions` is commercial context, not authorization.

## Known architectural follow-ups

- Real Fixture Lab exact-detail stack overflow remains isolated.
- Review Gate UI needs compactness and translation polish.
- Signal refresh cadence is not yet scheduled.
- Venue metadata remains untrusted.
- No AI provider is connected.
