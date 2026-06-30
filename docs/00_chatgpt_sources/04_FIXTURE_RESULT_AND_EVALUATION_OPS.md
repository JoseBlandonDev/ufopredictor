# Fixture, Result, and Evaluation Operations

_Last refreshed: 2026-06-29 after the Round-of-32 fixture publication, South Africa vs Canada verification, and Croatia vs Ghana exact result refresh._

## Operational truth

API-Football is the primary operational provider for:

- provider fixture identity;
- home/away order;
- kickoff;
- round;
- provider status;
- venue/city when exposed;
- final score.

Official FIFA schedule information may be used as a canonical tournament cross-check.

Wikipedia, press graphics, social media, and secondary result pages are not write authority.

Routine operations are executed by the operator from PowerShell and protected admin surfaces. Codex is not required for normal fixture or result lookup.

## PowerShell command family

### Discover fixtures by league/date

```powershell
npm run spike:api-football -- `
  --mode league `
  --leagueId 1 `
  --season 2026 `
  --from YYYY-MM-DD `
  --to YYYY-MM-DD
```

### Read one exact fixture

```powershell
npm run spike:api-football -- `
  --mode fixture `
  --fixtureId <API_FOOTBALL_FIXTURE_ID>
```

### Exact fixture ingest dry-run

```powershell
npm run spike:api-football -- `
  --mode ingest-dry-run `
  --competition world-cup `
  --fixtureId <API_FOOTBALL_FIXTURE_ID> `
  --from YYYY-MM-DD `
  --to YYYY-MM-DD `
  --limit 1 `
  --report true
```

### Exact future fixture apply

```powershell
npm run spike:api-football -- `
  --mode ingest-dry-run `
  --competition world-cup `
  --fixtureId <API_FOOTBALL_FIXTURE_ID> `
  --from YYYY-MM-DD `
  --to YYYY-MM-DD `
  --limit 1 `
  --apply true `
  --report true
```

Expected future-fixture behavior:

```text
fixtures_scanned=1
fixtures_planned=1
match created or exact update
match_results created=0
access_scope=admin_only
intake_source=api_football
```

Stop when identity, competition, status, or result behavior differs.

## Publication path for a future fixture

After exact ingest:

1. open `/admin/real-fixture-publish-queue`;
2. verify fixture, kickoff, teams, and provider ID;
3. save the internal prediction;
4. publish the basic public product;
5. confirm the fixture leaves the queue;
6. smoke `/predictions` and match detail.

Never generate or publish after kickoff.

## Exact result refresh

### Dry-run

```powershell
npm run ops:world-cup-result-refresh -- `
  --allow-api-football-fixture-ids <ID_OR_IDS> `
  --artifact-name <NAME>-dry-run.json
```

Required pre-apply conditions:

- exact selected fixture count;
- terminal provider result;
- supported `FT`;
- both scores present;
- no identity/duplicate/score conflict;
- expected evaluation action;
- `zero_write_confirmation=true`.

### Apply

```powershell
npm run ops:world-cup-result-refresh -- `
  --apply `
  --allow-api-football-fixture-ids <ID_OR_IDS> `
  --artifact-name <NAME>-apply.json
```

### Idempotency verification

```powershell
npm run ops:world-cup-result-refresh -- `
  --allow-api-football-fixture-ids <ID_OR_IDS> `
  --artifact-name <NAME>-verify.json
```

Expected verification behavior:

```text
results_created=0
results_already_identical=<selected completed fixtures>
evaluations_created=0
evaluations_already_stored=<eligible predictions>
exceptions_or_conflicts=0
zero_write_confirmation=true
```

## Trusted result eligibility

Automatically persist/verify only when:

- the stored fixture identity is exact;
- provider is API-Football;
- state is supported terminal `FT`;
- scores exist;
- stored and provider teams match;
- no conflicting verified result exists;
- no duplicate/linkage conflict exists.

Result refresh may:

- update match status;
- create or recognize an identical result;
- verify the result;
- create or recognize an eligible evaluation.

It never creates or mutates a prediction.

## Current production checkpoint

Future Round-of-32 publication:

```text
fixtures: 15
internal predictions: 15
public predictions: 15
publish queue: empty
```

Croatia vs Ghana:

```text
provider fixture ID: 1489420
provider result: Croatia 2-1 Ghana
dry-run selected: 1
apply result created: 1
result verified: 1
evaluation created: 1
verification: identical result and stored evaluation
public status: visible in history
```

The earlier `provider_fixture_not_found` was transient. The correct response was a bounded provider retry, not a secondary-source write.

South Africa vs Canada:

```text
provider fixture ID: 1561329
provider result: South Africa 0-1 Canada
result: verified
prediction before kickoff: none
evaluation: not applicable
```

No retrospective prediction was created.

## Finished fixture without a prior prediction

A finished fixture may be stored as public match/result data without a prediction.

It must not:

- enter prediction accuracy;
- receive a fabricated publication time;
- appear as a historical prediction;
- create an evaluation.

The current generic ingest path has a guard that blocks creating a newly planned finished World Cup match as `admin_only`.

A one-off operator intervention was used for South Africa vs Canada. That script is not a reusable runbook path.

Future implementation should provide one supported exact operation for:

```text
finished provider fixture
+ verified score
+ public match identity
+ no retrospective prediction
```

Until then, stop and inspect rather than replaying the one-off script.

## Manual reconciliation fallback

Manual reconciliation remains an exception path only.

Use it when:

- the stored fixture is exact;
- kickoff is in the past;
- no verified result exists;
- trusted provider refresh cannot materialize a valid result;
- an admin has independently confirmed the official score.

Manual entry:

- creates `pending_review`;
- does not auto-verify;
- does not create a prediction;
- requires a source note;
- requires admin verification;
- supports evaluation only when a real prediction existed.

Do not use Wikipedia as the source note authority.

## Venue behavior

Current ingestion deliberately stores `venue_id = null`.

The database already supports venues.

Planned bounded implementation:

```text
read fixture.venue from API-Football
-> normalize provider venue identity/name/city
-> upsert venues
-> set matches.venue_id
-> render stadium and city
```

No new schema migration is currently expected.

## Kickoff display

Stored kickoff remains UTC.

Public presentation should:

- show viewer-local time when available;
- optionally show Mexico, Colombia/Peru, Argentina/Chile, and Spain;
- use IANA time zones;
- group country pairs only when their times match for that date;
- avoid a long country list.

## Artifacts and Git

Operational JSON reports remain local/untracked unless an explicit review package requires otherwise.

Do not:

- run `git add artifacts/`;
- commit `tsconfig.tsbuildinfo`;
- include secrets or raw provider payloads;
- infer success from a report name without checking counts.

## No-repeat rules

- one discovery/read;
- one dry-run;
- one exact apply;
- one idempotency verification;
- one UI/admin smoke.

Repeat only for a concrete provider absence, conflict, or approved recovery.

Do not route routine provider operations through Codex.

## Responsibility split

### Operator

- PowerShell provider calls;
- exact apply approval;
- admin publication/result verification;
- production smoke.

### ChatGPT

- interprets evidence;
- maintains canonical procedure;
- defines bounded recovery.

### Codex

- fixes code or implements missing supported paths;
- does not discover routine fixtures/results;
- does not author canonical documentation.
