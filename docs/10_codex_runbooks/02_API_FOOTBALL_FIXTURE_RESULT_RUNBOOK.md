# API-Football Fixture and Result Operations Runbook

_Last refreshed: 2026-06-29._

## Purpose

Maintain current World Cup fixtures, future prediction publication, verified results, and evaluations through bounded operator-controlled API-Football operations.

Current status belongs in:

```text
docs/00_chatgpt_sources/04_FIXTURE_RESULT_AND_EVALUATION_OPS.md
```

## Authority

API-Football is operational authority for:

- fixture ID;
- home/away identity;
- kickoff;
- round;
- provider status;
- venue/city when supplied;
- final score.

Official FIFA information may be used as a tournament cross-check.

Do not use Wikipedia, press graphics, social posts, or secondary pages as write authority.

## Responsibility

Routine commands are executed by the operator from PowerShell.

Codex is not required for:

- discovery;
- score lookup;
- dry-run;
- exact apply;
- publication;
- result verification.

Use Codex only when the code path is missing or broken.

## Read/discovery commands

### League/date query

```powershell
npm run spike:api-football -- `
  --mode league `
  --leagueId 1 `
  --season 2026 `
  --from YYYY-MM-DD `
  --to YYYY-MM-DD
```

Inspect:

- exact fixture ID;
- teams/order;
- kickoff;
- status;
- score when terminal.

### Exact fixture query

```powershell
npm run spike:api-football -- `
  --mode fixture `
  --fixtureId <ID>
```

## Future fixture ingest

### Dry-run

```powershell
npm run spike:api-football -- `
  --mode ingest-dry-run `
  --competition world-cup `
  --fixtureId <ID> `
  --from YYYY-MM-DD `
  --to YYYY-MM-DD `
  --limit 1 `
  --report true
```

Expected:

```text
fixtures_scanned=1
fixtures_planned=1
match_results=0
status=scheduled
access_scope=admin_only
intake_source=api_football
```

### Apply

```powershell
npm run spike:api-football -- `
  --mode ingest-dry-run `
  --competition world-cup `
  --fixtureId <ID> `
  --from YYYY-MM-DD `
  --to YYYY-MM-DD `
  --limit 1 `
  --apply true `
  --report true
```

Stop if:

- planned count is not exactly one;
- teams/competition differ;
- a future fixture creates a result;
- the fixture is skipped unexpectedly;
- provider status is unsupported;
- environment/target is unclear.

## Future prediction publication

After ingest:

1. open `/admin/real-fixture-publish-queue`;
2. verify exact fixture identity;
3. save internal prediction;
4. publish basic public product;
5. verify queue removal;
6. smoke public prediction and detail.

Do not generate after kickoff.

## Trusted result refresh

### Dry-run

```powershell
npm run ops:world-cup-result-refresh -- `
  --allow-api-football-fixture-ids <ID_OR_IDS> `
  --artifact-name <NAME>-dry-run.json
```

Review:

- selected fixture count;
- terminal results;
- status updates;
- result create/update/identical;
- evaluation create/update/identical;
- exceptions/conflicts;
- zero-write confirmation.

### Apply

```powershell
npm run ops:world-cup-result-refresh -- `
  --apply `
  --allow-api-football-fixture-ids <ID_OR_IDS> `
  --artifact-name <NAME>-apply.json
```

Writes require an exact allowlist.

Do not apply a broad date/matchday scope without exact IDs.

### Verify idempotency

```powershell
npm run ops:world-cup-result-refresh -- `
  --allow-api-football-fixture-ids <ID_OR_IDS> `
  --artifact-name <NAME>-verify.json
```

Expected second-pass behavior:

- no new result;
- identical result recognized;
- no new evaluation;
- stored evaluation recognized;
- no conflicts;
- zero writes.

## Auto-verification eligibility

Require:

- stored fixture exists;
- API-Football identity matches;
- supported terminal `FT`;
- complete score;
- no duplicate/linkage conflict;
- no changed verified score.

The operation may update status, persist/recognize result, verify, and evaluate.

It never mutates or creates a prediction.

## Transient provider absence

`provider_fixture_not_found` may be temporary.

Procedure:

1. retain current stored data;
2. retry later with exact recent scope;
3. query league/date if needed to rediscover the exact ID;
4. do not switch to Wikipedia;
5. apply only after exact dry-run.

Croatia vs Ghana was resolved this way with fixture ID `1489420`.

## Finished fixture with no prior prediction

A verified finished match may exist without a prediction.

Rules:

- no retrospective public prediction;
- no evaluation;
- no accuracy claim;
- optional separate official-result display.

The generic ingest path currently blocks a newly planned finished World Cup fixture created as `admin_only`.

South Africa vs Canada required a one-off bounded recovery. Do not copy that temporary script as routine procedure.

If this case recurs, stop and either:

- use an approved supported result path already in the repository; or
- request a bounded implementation for an exact finished-fixture-without-prediction operation.

## Manual reconciliation

Use only when the provider path cannot produce a trusted result.

Admin route:

```text
/admin/real-fixture-result-review-queue
```

Manual entry:

- exact stored fixture;
- past kickoff;
- score and source note;
- `pending_review`;
- separate verification;
- evaluation only if an original prediction exists.

Secondary pages are not sufficient write authority.

## Venue roadmap

Current client/planner/writer discard venue and write `venue_id=null`.

Planned implementation:

- normalize provider venue ID/name/city;
- upsert `venues` by provider external ID;
- assign `matches.venue_id`;
- test null fallback when provider venue is absent.

No new schema migration is currently expected.

## Time display roadmap

Keep kickoff UTC in storage.

Public display:

- viewer-local first when available;
- compact reference set:
  - Mexico;
  - Colombia/Peru;
  - Argentina/Chile;
  - Spain;
- IANA zones;
- group only equal rendered times.

## Artifacts

Keep operator reports untracked unless explicitly requested.

Never include:

- provider key;
- service-role key;
- raw secrets;
- personal data.

## Standard report

- environment;
- run timestamp;
- exact IDs;
- selected/planned counts;
- create/update/identical counts;
- verification/evaluation counts;
- conflicts/exceptions;
- idempotency proof;
- UI/admin smoke.
