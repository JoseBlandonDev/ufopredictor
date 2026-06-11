# UFO Predictor — Docs and Sources Inventory

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

The project currently keeps canonical product/backend docs plus separate creative/Flow docs. Do not delete docs in this refresh. Some are primary, some are operational, and some are reference/secondary.

## Primary project docs

### `START_HERE_FOR_NEW_CONVERSATIONS.md`

Entry point for new ChatGPT/Codex conversations.

Use for:

- current project state;
- branch discipline;
- current next task;
- hard no-go list.

Current expected state:

- post-E07;
- four real World Cup fixtures public;
- next work is access tiers / scoreline visibility.

### `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`

High-signal source for ChatGPT planning.

Use for:

- current MVP stage;
- architecture summary;
- active next work;
- current boundaries.

### `CURRENT_PROJECT_STATUS.md`

Detailed status report.

Use for:

- what is complete;
- current MVP 1 state;
- public fixture evidence;
- immediate next step.

### `EPIC_PROGRESS_MATRIX.md`

Epic and MVP-stage status table.

Use for:

- avoiding improvised epics;
- seeing current and future blocks at a glance.

### `ROADMAP_AND_BACKLOG.md`

Full roadmap/backlog by MVP stage.

Use for:

- MVP 0/1/1.5/2 plan;
- epic definitions;
- future scope.

### `NEXT_EPICS_PLAN.md`

Near-term execution plan.

Use for:

- E09 access tiers;
- E10 scoreline calibration and signal enrichment;
- result verification planning.

## Operational docs

### `CODEX_HANDOFF_CURRENT.md`

Current handoff for Codex.

Use before recognition/implementation prompts.

Important current notes:

- stable first-publication path uses `0029_manual_publication_match_access_scope_rpc.sql` and RPC `publish_real_fixture_match_access_scope`;
- exact public refresh uses `0030_real_fixture_lab_public_refresh_rls.sql`;
- Codex should start next tasks with read-only recognition.

### `CODEX_WORKFLOW.md`

Rules for Codex, branches, PRs, migration coordination, and validation.

Use for:

- branch discipline;
- migration policy;
- command clarity;
- validation expectations;
- role split between ChatGPT and Codex.

### `IMPLEMENTATION_PLAN.md`

Tactical implementation phases and operational flow.

Use for:

- exact fixture publication sequence;
- exact public refresh sequence;
- migration/manual SQL workflow;
- E09/E10 implementation ordering.

### `TRACK_D_API_FOOTBALL_HANDOFF.md`

Track D/API-Football/Real Fixture Lab operational context.

Status:

- historical and still useful for ingest/Lab context;
- updated with MVP 1 public fixture expansion and exact refresh.

### `OPEN_DECISIONS.md`

Open and recently settled decisions.

Current important decisions:

- manual publication approach settled;
- RPC first-publication path settled;
- exact public refresh path settled;
- mock/preview public-surface handling settled for MVP 1 baseline;
- access tiers / scoreline visibility still open;
- payment provider still open;
- formal prediction lineage still open.

## Reference docs

### `ARCHITECTURE_SUMMARY.md`

Architecture reference.

Use for:

- ingest/Lab/public route boundaries;
- manual publication architecture;
- exact public refresh architecture;
- RLS/RPC posture.

### `DATA_DICTIONARY.md`

Data model reference.

Use for:

- actual known fields;
- fields not to assume;
- publication table/field behavior;
- prediction/market schema corrections;
- refresh row append behavior.

### `MODEL_V01.md`

Historical model v0.1 plus active v0.2-prelaunch notes.

Status:

- v0.1 historical;
- active MVP 1 model is `v0.2-prelaunch`;
- post-E07 fallback catalog expanded for immediate World Cup teams;
- scoreline calibration remains future work.

### `PROJECT_CONTEXT_UFO_PREDICTOR.md`

Stable product/project context.

Use for:

- product mission;
- non-betting/no-guarantee framing;
- high-level positioning;
- public/free/premium direction.

### `PROJECT_STATUS_FOR_MEETING.md`

Meeting-ready summary.

Use for:

- concise stakeholder update;
- what shipped;
- current risks;
- recommended next work.

## Creative / audiovisual docs

These are separate from backend/product roadmap unless explicitly working on creative assets:

- `UFO_FLOW_CAMPAIGN_SOURCE.md`
- `UFO_FLOW_PRODUCTION_SOURCE.md`
- `FLOW_VIDEO_PRODUCTION_PLAYBOOK.md`
- `FLOW_CHARACTERS_ORION_VEGA_SOURCE.md`
- `UFO_CHARACTERS_ORION_VEGA_SOURCE.md`

Do not edit these during product/backend docs refresh unless the task is specifically creative.

## Important migration/source files

Manual-publication and public-refresh migrations to know:

- `0025_manual_publication_rls.sql`
- `0026_fix_manual_publication_match_update_policy.sql`
- `0027_inline_manual_publication_match_update_check.sql`
- `0028_manual_publication_match_new_row_helper.sql`
- `0029_manual_publication_match_access_scope_rpc.sql`
- `0030_real_fixture_lab_public_refresh_rls.sql`

Current stable runtime first-publication path:

- `0029_manual_publication_match_access_scope_rpc.sql`

Current stable runtime public-refresh RLS support:

- `0030_real_fixture_lab_public_refresh_rls.sql`

Migration numbering caution:

- the repo already contains two different `0027` migration filenames:
  - `0027_google_oauth_profile_sync.sql`
  - `0027_inline_manual_publication_match_update_check.sql`
- do not rename already-merged/applied migrations retroactively;
- do not edit applied migrations;
- future migration tasks must inspect existing filenames and reserve the next unused number before implementation;
- manual Supabase SQL application should be tracked in task notes and/or the PR body.

## Auxiliary planning artifacts

Spreadsheet/backlog artifacts may exist outside canonical markdown docs, for example:

- `UFO_Predictor_Backlog_Tracker_MVP1_Launch_Readiness.xlsx`

Use spreadsheets as planning aids, not as the only source of truth. Humanity has already lost enough things in spreadsheets.

## Current docs policy

- Keep all canonical docs in this refresh.
- Do not destructively delete historical context.
- Keep `ROADMAP_AND_BACKLOG.md` as full map.
- Keep `NEXT_EPICS_PLAN.md` as near-term plan.
- Keep Flow/campaign/video docs separate from backend/product roadmap unless explicitly working on creative assets.
- Update docs after meaningful MVP-stage shifts, public publication milestones, or schema/RLS discoveries.
