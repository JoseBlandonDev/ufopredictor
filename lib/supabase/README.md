# Supabase Runtime Foundation

This directory holds the database foundation and lazy Supabase client factories
for UFO Predictor. No page, authentication flow, or real user operation is
connected to Supabase in this epic.

## Files

- `supabase/migrations/0001_initial_schema.sql` creates the MVP tables from
  `docs/DATA_DICTIONARY.md`, including relationships, validation checks,
  `updated_at` triggers, basic indexes, and the initial RLS boundary.
- `supabase/seed/seed.sql` adds deterministic sample data aligned with the
  current prototype: World Cup 2026 data, plans, one example prediction,
  narrative content, and mock worker executions. It creates no users.
- `lib/supabase/client.ts` creates a browser client for future Client
  Components using only the public URL and anon key.
- `lib/supabase/server.ts` creates a cookie-aware server client for future
  Server Components, Server Actions, and Route Handlers. It also exposes a
  server-only admin factory for explicitly privileged backend tasks.

## Runtime Environment

Configure these values in `.env.local` for local development or in the chosen
hosting environment. Do not commit real values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only
  values permitted in browser code. The anon key is safe only with correct RLS.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is restricted to
  `server.ts`, which imports `server-only`. Never import its admin factory from
  a Client Component.
- Clients are created inside functions rather than at module import time, so
  builds do not require configured Supabase credentials unless code actually
  invokes a factory.

The project currently uses the requested legacy anon/service-role variable
names. A future deployment decision may adopt Supabase publishable/secret key
names without exposing privileged credentials to the browser.

## RLS Scope

RLS is enabled on every public table so applying this foundation does not
accidentally expose prediction, narrative, or operational data through a future
Supabase Data API configuration. This includes the explicitly sensitive tables:
`profiles`, `subscriptions`, `user_entitlements`, `user_match_unlocks`, and
`email_events`.

The only policy created now lets an authenticated user read their own profile.
Profile updates are deliberately deferred because a broad update policy could
allow a client to change `role`. Public catalog reads, filtered prediction
reads, subscriptions, entitlements, unlocks, and email events remain TODO
items for the API, auth/paywall, and email epics.

## Applying After Review

Do not apply this migration to a remote project that has data until it has
been reviewed and a migration plan has been approved.

For a local Supabase environment, after installing the Supabase CLI and
creating or reviewing `supabase/config.toml`, configure this nested seed file:

```toml
[db.seed]
enabled = true
sql_paths = ["./seed/seed.sql"]
```

Then run:

```bash
supabase start
supabase db reset
```

The CLI otherwise defaults to `supabase/seed.sql`; this repository intentionally
uses `supabase/seed/seed.sql` as the reviewable seed directory requested for
this epic. `supabase db reset` applies migrations and can run configured seeds through the
local privileged migration role, which is appropriate while tables are locked
by RLS. If this repository later uses explicit seed execution, configure
`supabase/seed/seed.sql` or run its contents only against local or approved
staging environments through an approved administrative workflow.

For a linked staging project, linking and `supabase db push` must happen only
after human review and with the intended project confirmed. This epic does not
link a project, use credentials, or execute remote migrations.

## Not Implemented

- Page-level reads or writes using Supabase.
- Login, callbacks, auth proxy, roles, or protected routes.
- Complete RLS/paywall enforcement.
- Payments, real providers, Resend, LLM calls, or live workers.
