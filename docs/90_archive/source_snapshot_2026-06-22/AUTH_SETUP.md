# Auth Setup - UFO Predictor

_Last refreshed: 2026-06-22._

## Current baseline

- Google OAuth;
- email/password registration;
- confirmation/recovery flows;
- Supabase session handling;
- server-side access projection.

## Environment separation

Production and stage are separate Supabase projects. Therefore:

- users do not automatically exist in both;
- sessions/cookies are not transferable;
- a development user may need to register again;
- stage profiles/roles/entitlements are test data;
- production Auth users must not be bulk-cloned into stage.

Confirmed:

- Railway development points to Supabase stage;
- stage registration/login works;
- stage public prediction data is unavailable until schema/data synchronization.

## Access rules

- anonymous: public-safe teaser;
- registered free: public prediction/context;
- premium: protected premium projection;
- admin: explicit server-side bypass where approved.

Role alone does not grant paid content. Entitlements authorize premium access.

## Secret boundary

- public URL/anon key may exist in frontend runtime;
- service-role/DB credentials are local administrative secrets;
- no service-role key in browser or app routes;
- Task 3B uses only Git-ignored `DEV_SUPABASE_*` values;
- production variables are denied.

## Task 3B Auth preservation

The stage migration audit must confirm that applying public-schema migrations will not delete or corrupt the existing `auth.users` development account. Do not reset/drop the remote stage project.
