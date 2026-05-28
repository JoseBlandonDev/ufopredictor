# ARCHITECTURE SUMMARY — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

## Architecture state

UFO Predictor is a Next.js app backed by Supabase. It currently has:

- public DB-backed prediction surfaces;
- authenticated dashboard/access surface;
- internal admin Lab;
- plans/entitlements backend;
- server-side premium access decision skeleton;
- UI value wall for Registered Free.

## Data access layers

### Public

- `/predictions` reads from `public_prediction_summaries`.
- `/matches/[slug]` reads from `public_match_details` and `public_prediction_summaries`.

### Authenticated/free

- `/dashboard` reads access summary from profiles/subscriptions/entitlements/unlocks.
- C05 Gate 1 adds value messaging but not new data rights.

### Premium future

- Premium base tables remain closed.
- C04 access decision skeleton exists.
- C07 should use safe projection/RPC/server-only query after C05/C06 decisions.

## Access control

C04 added the enforcement skeleton:

- exact match entitlement;
- match unlock;
- competition;
- canonical stage;
- team;
- global;
- trusted beta grants;
- explicit admin access.

## Commercial architecture direction

- World Cup packages/passes first.
- Monthly subscriptions after World Cup.
- Entitlements should support granular access while public plans remain understandable.

## Security rules

- Visual locks, blur, and teaser cards are not authorization.
- Premium payload must not be sent to the browser unless access has been authorized server-side.
- `premium_user` alone does not unlock protected content.
- Active subscription alone does not unlock protected content.
- `quantity` / `match_pack` does not grant direct access without explicit match unlock materialization.
- `trustedBetaFreeMatchIds` must be assembled server-side; never from client/query params.
- `stageAccessKey` must be canonical and server-derived, for example `competitionId:stage`.
- Do not use service role for normal product UI.

