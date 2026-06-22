# Production Readiness - UFO Predictor

_Last refreshed: 2026-06-22._

## Current verdict

Prediction Intelligence v2 is **not production-ready yet**.

The branch is implementation-complete through Task 3A dry-run. Stage environment separation and Auth are confirmed, but stage schema/data synchronization, persisted signals, development prediction publication, and UI validation remain pending.

## Ready

- durable data schema design;
- migration 0038 present;
- deterministic normalization/import plans;
- 36/36 replay coverage;
- bounded/gated probability candidate;
- v2 analysis/scenario contract;
- immutable publication planning;
- Torneo export planning;
- safe-target/production-denial guards;
- separate Railway/Supabase development environment;
- stage Auth registration/login;
- Task 3B credential contract and Git-ignore pattern defined; local presence and structure must be revalidated before execution.

## Not ready

- stage migration parity audit;
- stage migration application;
- stage seed/import;
- idempotency proof against physical DB;
- stage RLS/query validation;
- signal persistence;
- development prediction versions;
- development Torneo export validation;
- scenario/evidence frontend;
- full Spanish naming/venue display;
- stage cross-role smoke;
- production migration/rollback plan.

## Task 3B exit gate

Task 3B is complete only when:

- stage schema matches the required canonical migration state;
- 0038 exists remotely;
- non-sensitive reference/history counts match plan;
- second import creates zero duplicates;
- analytical tables have intended RLS/internal access;
- 48 teams, 104 schedule rows, 72 group links, 32 placeholders, and 16 venues validate;
- signal snapshots are persisted with cutoff/version/source IDs;
- immutable prediction versions are created only for not-started fixtures;
- started/live/completed rejection is proven;
- public stage queries and Auth work;
- no secret or production write occurs.

## Production promotion gate

After Task 3B:

1. review development probabilities/scenarios fixture by fixture;
2. decide v1+analysis versus gated-v2+analysis;
3. create production backup/rollback plan;
4. authorize production target separately;
5. run production dry-run;
6. apply migration/import;
7. create immutable versions;
8. smoke anonymous/free/premium/admin;
9. smoke Wompi/entitlements;
10. validate Torneo export;
11. monitor logs and rollback triggers.

## Claim safety

Do not say:

- v2 is more accurate by a material margin;
- one scenario is the result users should blindly follow;
- a hit proves the system predicted the future;
- v2 is live before production migration/publication.

Allowed:

- richer evidence and explainability;
- conservative bounded probability updates;
- representative scenarios;
- probabilities, not certainties;
- exact source cutoff and reliability.
