# UFO Predictor — Docs and Sources Inventory

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

This file explains which docs to use for what. Because apparently without a map, every conversation becomes archaeology with worse tooling.

## Primary project docs

### `START_HERE_FOR_NEW_CONVERSATIONS.md`

Primary entry point for new ChatGPT/Codex conversations.

Use for:

- current state;
- latest merged PRs;
- next recommended work;
- branch/migration/command discipline.

### `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`

High-signal source of truth for ChatGPT.

Use for:

- product summary;
- current milestone;
- model/data boundaries;
- current next epic.

### `CURRENT_PROJECT_STATUS.md`

Operational status snapshot.

Use for:

- what just merged;
- validation status;
- public/runtime status;
- immediate cleanup.

### `EPIC_PROGRESS_MATRIX.md`

Epic state table.

Use for:

- tracking what is done vs next;
- avoiding duplicate epics;
- seeing MVP 1 progress.

### `ROADMAP_AND_BACKLOG.md`

Longer roadmap/backlog.

Use for:

- E10D planning;
- later model/data work;
- MVP 1.5/MVP 2 backlog.

## Operational docs

### `CODEX_HANDOFF_CURRENT.md`

Current handoff for Codex.

Use before:

- recognition prompts;
- implementation prompts;
- PR review prompts.

Current critical context:

- PR #66 E10C is merged;
- generated signal module is committed;
- `codex-inputs/` must not be committed;
- E10D is the likely next implementation.

### `CODEX_WORKFLOW.md`

General Codex workflow rules.

Use for:

- branch discipline;
- validation expectations;
- migration rules;
- command clarity.

### `IMPLEMENTATION_PLAN.md`

Tactical implementation flow.

Use for:

- exact fixture operations;
- publication/refresh mechanics;
- manual SQL workflow.

May need future refresh if E10D changes model implementation sequence.

### `TRACK_D_API_FOOTBALL_HANDOFF.md`

API-Football / ingest / Real Fixture Lab operational context.

Status:

- still useful for ingest/Lab work;
- not central to E10C signal pack, because E10C did not alter ingest.

## Reference docs

### `ARCHITECTURE_SUMMARY.md`

Architecture overview.

Use for:

- ingest/Lab/public boundaries;
- model snapshot layer;
- generated signal-pack architecture;
- RLS/RPC posture.

### `DATA_DICTIONARY.md`

Field/concept reference.

Use for:

- prediction visibility concepts;
- national-team signal fields;
- placeholder fields;
- source-pack rules.

### `MODEL_V01.md`

Model status and limitations.

Use for:

- v0.2-prelaunch context;
- E10C signal interpretation;
- E10D planning.

### `OPEN_DECISIONS.md`

Open and settled decisions.

Use for:

- market signal policy;
- lineup/injury context;
- E10D calibration choices;
- prediction lineage.

### `NEXT_EPICS_PLAN.md`

Near-term execution sequence.

Use for:

- cleanup after PR #66;
- docs rebaseline;
- E10D recognition/implementation.

### `PROJECT_STATUS_FOR_MEETING.md`

Stakeholder summary.

Use for:

- concise progress report;
- what changed recently;
- current risk framing;
- recommended next work.

## E10C source artifacts

Local/source pack context:

- FIFA ranking/points CSV was used as source material.
- Elo ranking HTML was used for Elo rank/rating and historical stats.
- Elo results 2025/2026 were used for recent form.
- Elo fixtures/upcoming table was retained as source-preparation/reference context; fixture expectancy was not wired as an active runtime snapshot field in E10C.
- Normalized pack files were placed locally under `codex-inputs/e10c/` during implementation.

Important:

```text
codex-inputs/ was not committed and should be deleted after merge cleanup.
```

Committed runtime artifact:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

Generated pack files used during the task should be treated as local/audit inputs, not runtime dependencies.

## Creative / audiovisual docs

These are separate from backend/product roadmap unless the task is creative:

- `UFO_FLOW_CAMPAIGN_SOURCE.md`
- `UFO_FLOW_PRODUCTION_SOURCE.md`
- `FLOW_VIDEO_PRODUCTION_PLAYBOOK.md`
- `FLOW_CHARACTERS_ORION_VEGA_SOURCE.md`
- `UFO_CHARACTERS_ORION_VEGA_SOURCE.md`

Do not edit these during backend/model docs refresh unless explicitly requested.

## Migration/source files to know

Important recent migrations:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `0030_real_fixture_lab_public_refresh_rls.sql`
- `0031_authenticated_public_match_probable_score.sql`
- `0032_real_fixture_lab_public_finished_result_verification_rls.sql`

Reminder:

- migrations are applied manually;
- do not edit applied migrations;
- use new migrations for corrections.
