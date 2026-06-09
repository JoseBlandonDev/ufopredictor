# Open Decisions — UFO Predictor

_Last updated after D05G and Real Fixture Lab Phase 3A validation._

## Decisions now closed

### Real Fixture Lab separation

Decision: Real Fixture Lab remains separate from `/admin/beta-lab`.

- `/admin/beta-lab` is for `lab_only` calibration/internal fixtures.
- `/admin/real-fixture-lab` is for real ingested fixtures with:
  - `access_scope='admin_only'`.
  - `intake_source='api_football'`.

Reason:

- Avoids mixing synthetic/lab fixtures with real provider-ingested fixtures.
- Keeps real fixture trial path isolated and easier to audit.

### No service-role client in app routes

Decision: app routes must not use script/service-role clients.

- RLS policies were added instead.
- `0019` through `0022` provide the required admin read/write capabilities.

Reason:

- Preserves app-level least privilege.
- Avoids bypassing RLS in production app paths.

### Real Fixture Lab internal prediction persistence

Decision: Phase 3A saves internal predictions to:

- `prediction_versions`.
- `prediction_markets`.

It does not save:

- `prediction_results`.

Reason:

- Results/evaluation must wait for actual result review.

### Friendlies apply lane

Decision: friendlies apply is allowed only through D05G narrow single-fixture lane.

Required:

- `competition=friendlies`.
- explicit `fixtureId`.
- `limit=1`.
- explicit `from` and `to`.
- exact scheduled fixture.
- no planned `match_results`.
- `admin_only`.
- `api_football`.

Broad friendlies apply remains blocked.

### Real Fixture Lab fixture selection

Decision: Real Fixture Lab no longer has a hardcoded default fixture.

- It uses `?externalId=api-football:fixture:<id>`.
- If no `externalId` is provided, it shows a neutral empty state.

Reason:

- Prevents stale/past fixtures from being accidentally used for pre-match predictions.

### Codex prompt language

Decision: all prompts intended for Codex must be written in English.

- ChatGPT can discuss strategy with the user in Spanish.
- The final prompt block for Codex must be English.

Reason:

- Reduces ambiguity in commands, paths, branch names, migrations, and validation instructions.

## Still open decisions

### When should `prediction_results` be persisted?

Open.

Likely rule:

- Only after actual result exists.
- Only after result is reviewed/trusted.
- Possibly require `match_results.verification_status='verified'`.

Needs design before implementation.

### What is the Real Fixture Lab result review policy?

Open.

Questions:

- Is API-Football result enough for internal evaluation?
- Must an admin manually verify result?
- Should `pending_review` results be blocked from evaluation?
- Should evaluation be possible for provider results but marked lower trust?

### Should `prediction_versions` get a DB-level unique constraint?

Open.

Current duplicate protection is app-level for:

- `match_id`.
- `model_version_id`.
- `prediction_type`.
- `run_scope`.

Question:

- Should a future migration add a unique constraint/index to prevent race duplicates?

Recommendation:

- Do not fold this into unrelated migrations.
- Decide deliberately after Phase 3A validation.

### When can more than one friendly be ingested?

Open.

Current answer:

- Not yet.
- D05G allows one exact fixture at a time.

Future expansion could allow a small selected list, but must not become broad friendlies apply by accident.

### What qualifies as a high-signal friendly?

Open.

Initial criteria:

- Senior national teams.
- Clear team identity.
- Upcoming/scheduled.
- Useful for World Cup model rehearsal.
- Avoid youth/noisy fixtures.

Needs a written selection policy before scaling.

### When can World Cup ingest be enabled?

Open.

Current answer:

- Not yet.

Required first:

- Post-match evaluation path validated.
- World Cup target guardrails designed.
- No public exposure risk.

### How should model input signals improve?

Open.

Current Real Fixture Lab preview may rely on default/neutral signals.

Future decision:

- Which rating/form/context sources can be safely used?
- Which are out of scope?
- How to avoid odds/provider predictions?

## Still blocked / not decisions to reopen casually

- No provider predictions.
- No odds.
- No service-role client in app routes.
- No public exposure from Real Fixture Lab.
- No `prediction_results` before result review.
- No broad friendlies apply.
- No World Cup apply without a new design phase.
