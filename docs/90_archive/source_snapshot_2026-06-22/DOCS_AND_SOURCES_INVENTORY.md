# Docs and Sources Inventory - UFO Predictor

_Last refreshed: 2026-06-22._

## Canonical current-state documents

Read these first:

1. `START_HERE_FOR_NEW_CONVERSATIONS.md`
2. `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
3. `CURRENT_PROJECT_STATUS.md`
4. `CODEX_HANDOFF_CURRENT.md`
5. `PREDICTION_INTELLIGENCE_V2_CURRENT.md`
6. `TASK3B_STAGE_SYNC_RUNBOOK.md`

## Architecture and implementation

- `ARCHITECTURE_SUMMARY.md`
- `DATA_DICTIONARY.md`
- `IMPLEMENTATION_PLAN.md`
- `ROADMAP_AND_BACKLOG.md`
- `NEXT_EPICS_PLAN.md`
- `EPIC_PROGRESS_MATRIX.md`
- `OPEN_DECISIONS.md`
- `PRODUCTION_READINESS.md`
- `SIGNAL_REFRESH_PLAYBOOK.md`
- `TRACK_D_API_FOOTBALL_HANDOFF.md`

## Product/commercial/access runbooks

- `AUTH_SETUP.md`
- `G05_WOMPI_INTEGRATION_RUNBOOK.md`
- `G06_ENTITLEMENT_ACTIVATION_RUNBOOK.md`
- `G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql`
- `G09_FRONTEND_COMMERCIAL_READINESS_PLAN.md`
- `POST_G05_G07_CHANGELOG.md`

## Historical model records

These remain historical evidence, not current project status:

- `MODEL_V01.md`
- `MODEL_CALIBRATION_CLOSEOUT_PR94.md`

Do not rewrite them to pretend the v2 work existed at the time. Current v2 truth belongs in `PREDICTION_INTELLIGENCE_V2_CURRENT.md`.

## Source families

### API-Football

Purpose:

- current fixture identity;
- status/result refresh;
- operational linking;
- exact kickoff/status gates.

Provider predictions or odds are not model inputs.

### World Football Elo

Known source pages:

- current ratings: `https://eloratings.net/`;
- latest results: `https://eloratings.net/latest`;
- upcoming fixtures: `https://eloratings.net/fixtures`;
- start-2026 snapshot: `https://eloratings.net/2026_start`;
- 2025 results: `https://eloratings.net/2025_results`.

Live extraction was not reliable enough for deterministic Task 1 ingestion. Prepared/local snapshots are recorded explicitly rather than falsely labeled live.

### FIFA men's ranking

Official ranking page:

```text
https://inside.fifa.com/es/fifa-world-ranking/men
```

The full ranking is dynamic; deterministic ingestion currently uses a prepared snapshot with 211 rows and official effective-date metadata.

### Official World Cup schedule

Canonical prepared source:

```text
FWC26 Match Schedule_v17_10042026_EN.pdf
```

Used for match numbers, kickoff, city, venue, group/stage, and knockout placeholders.

### Local source snapshot folder

Raw/manual captures are kept outside the repository, for example:

```text
C:\Users\jonat\Documents\ufo-predictor-source-snapshots\2026-06-20
```

The prepared support package may contain normalized snapshots, contracts, parsing notes, manifests, and reports. Raw files are not runtime dependencies.

## Stable normalized coverage

- Elo current: 244;
- Elo start-2026: 244;
- FIFA: 211;
- recent Elo results: 357;
- 2025 Elo results: 1,035;
- Elo fixtures: 407;
- historical facts: 1,392;
- official schedule: 104;
- venues: 16.

## Provenance rules

- every normalized dataset records source and capture/effective date;
- fallback/seed modes are explicit;
- no score in match identity;
- corrections preserve lineage;
- pre-match cutoffs are strict;
- no secrets or personal data in source packages.
