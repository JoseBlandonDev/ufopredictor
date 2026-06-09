# Architecture Summary — UFO Predictor

_Last updated after D05F, D05G, and Real Fixture Lab Phase 3A._

## High-level architecture

UFO Predictor has three separated layers relevant to the current work:

1. Public product surfaces.
2. Admin/internal Lab surfaces.
3. API-Football ingest and data pipeline.

The current real-fixture pipeline is internal only:

```txt
API-Football
-> controlled ingest
-> admin_only matches
-> Real Fixture Lab
-> internal prediction preview/persistence
```

No current Real Fixture Lab output is public.

## API-Football ingest architecture

### Read/planning

Entry point:

- `scripts/api-football-read-spike.ts`

Important modes:

- `fixture` for exact fixture inspection.
- `beta-candidates` for read-only shortlist discovery.
- `ingest-dry-run` for planning and controlled apply path.

Planning:

- `lib/football-api/ingest/planner.ts`

Apply guard / plan building:

- `lib/football-api/ingest/apply.ts`

Writer:

- `lib/football-api/ingest/writer.ts`

### Controlled write order

The writer persists in dependency order:

1. competitions.
2. seasons.
3. teams.
4. matches.
5. match_results.

New API-Football matches are created as:

- `access_scope='admin_only'`.
- `intake_source='api_football'`.

Finished fixtures may create `match_results` as pending review. Scheduled fixtures must not create `match_results`.

## D05F ingest tracking architecture

Migration:

- `0018_ingest_run_tracking.sql`.

Tables:

- `ingest_runs`.
- `ingest_run_items`.

Purpose:

- audit every apply run.
- trace touched rows.
- keep before snapshots for updates.
- support future manual/script-reviewed rollback.

D05F does not provide automatic rollback.

## D05G controlled single-friendly architecture

D05G adds exact-fixture friendly ingest.

Key behavior:

- `ingest-dry-run` accepts `--fixtureId`.
- With `fixtureId`, the script fetches the exact fixture directly.
- Friendlies apply is allowed only for one exact scheduled fixture.

Guardrails:

- `competition=friendlies`.
- explicit `fixtureId`.
- `limit=1`.
- explicit `from/to`.
- one planned match.
- zero planned match results.
- match remains `admin_only` and `api_football`.

Broad friendlies apply remains blocked.

## Admin Lab surfaces

### `/admin/beta-lab`

Existing internal lab surface for `lab_only` fixtures and calibration flow.

It should not be casually merged with real provider-ingested fixtures.

### `/admin/real-fixture-lab`

New admin route for real API-Football ingested fixtures.

Reads only:

- `matches.access_scope='admin_only'`.
- `matches.intake_source='api_football'`.

Key modules:

- `app/admin/real-fixture-lab/page.tsx`.
- `app/admin/real-fixture-lab/actions.ts`.
- `lib/supabase/real-fixture-lab-queries.ts`.
- `lib/prediction-engine/real-fixture-adapter.ts`.
- `lib/prediction-engine/real-fixture-persistence.ts`.

Features:

- Admin-only fixture read.
- URL `externalId` selection.
- In-memory prediction preview.
- Internal save action.
- Duplicate blocking.

Persists:

- `prediction_versions`.
- `prediction_markets`.

Does not persist:

- `prediction_results`.

## RLS architecture

The app uses session-scoped Supabase clients and must respect RLS.

Recent RLS migrations:

- `0019`: admin read policies for real fixture lab.
- `0020`: fixes RLS recursion for related table reads.
- `0021`: narrow admin persistence policies for internal prediction versions/markets.
- `0022`: fixes RLS recursion involving model versions/prediction versions.

Important pattern:

- use narrow `security definer` boolean helpers when direct inline policy subqueries would recurse.
- helper functions return only boolean and do not expose rows.
- helper functions use `search_path=public`.

## Public exposure boundary

Real Fixture Lab fixtures and predictions must not be exposed through public views.

Validated:

- Ingested friendly `api-football:fixture:1540356` remains absent from `public_match_details`.

Still blocked:

- public prediction publication.
- premium/public expansion.
- odds/provider predictions.
