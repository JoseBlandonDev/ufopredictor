# Supabase Schema Foundation

This directory documents the versioned database foundation for UFO Predictor.
The app is not connected to Supabase in this epic.

## Files

- `supabase/migrations/0001_initial_schema.sql` creates the MVP tables from
  `docs/DATA_DICTIONARY.md`, including relationships, validation checks,
  `updated_at` triggers, basic indexes, and the initial RLS boundary.
- `supabase/seed/seed.sql` adds deterministic sample data aligned with the
  current prototype: World Cup 2026 data, plans, one example prediction,
  narrative content, and mock worker executions. It creates no users.

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

- Supabase client or server initialization in the Next.js app.
- Login, callbacks, middleware, or protected routes.
- Complete RLS/paywall enforcement.
- Payments, real providers, Resend, LLM calls, or live workers.
