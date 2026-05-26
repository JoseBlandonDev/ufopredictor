# Supabase Runtime Foundation

This directory holds the database foundation and lazy Supabase client factories
for UFO Predictor. Authentication, public predictions, the visible plan
catalog, and each signed-in user's access summary now use these factories.
Premium product surfaces remain intentionally unavailable or mock-only.

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
- `lib/supabase/proxy.ts` refreshes authenticated cookies for protected
  routes through the root `proxy.ts` matcher.
- `supabase/migrations/0002_auth_profile_provisioning.sql` creates a
  `free_user` profile whenever Supabase Auth registers a new user.
- `supabase/migrations/0003_beta_lab_foundation.sql` separates public-product
  competitions from internal laboratory fixtures and marks internal prediction
  runs without exposing them as public league coverage.
- `supabase/migrations/0004_data_intake_minimal.sql` records source and review
  quality for internal fixtures, and adds verified match results with limited
  RLS access for authenticated readers and administrators.
- `supabase/migrations/0005_restrict_lab_match_results_rls.sql` prevents
  non-admin authenticated readers from seeing results for internal-lab,
  `lab_only`, or `admin_only` fixtures.
- `supabase/migrations/0006_admin_lab_read_policies.sql` permits authenticated
  administrators to read only the internal Lab competitions, fixtures, teams,
  prediction versions, model versions, and persisted prediction results needed
  by the Beta Lab screen.
- `supabase/migrations/0007_admin_lab_fixture_review_actions.sql` permits
  administrators to update only the review metadata of internal Lab fixtures.
- `supabase/migrations/0008_admin_lab_match_result_actions.sql` permits
  administrators to insert or update real results only for internal Lab
  fixtures, without granting deletion.
- `supabase/migrations/0009_seed_internal_lab_prediction_markets.sql`
  backfills BTTS and over/under market rows for the existing internal Lab
  prediction versions so later evaluation persistence has complete inputs.
- `supabase/migrations/0010_admin_lab_evaluation_persistence.sql` permits
  administrators to read internal Lab prediction markets and insert or update
  evaluations derived from verified Lab results, without granting deletion.
- `supabase/migrations/0011_public_prediction_reads.sql` permits anonymous and
  authenticated visitors to read only the product-public competitions,
  fixtures, related teams/venues, and published prediction versions required by
  `/predictions`.
- `supabase/migrations/0012_plans_entitlements_backend.sql` exposes only the
  current public plan catalog and lets authenticated users read only their own
  subscriptions, current entitlements, and current match unlocks.

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

## Email And Password Auth

This iteration implements:

- `/login` for email/password sign-in.
- `/register` for email/password registration.
- `/auth/callback` for exchanging the PKCE confirmation code into a session.
- Server-side protection for `/dashboard`, `/admin`, and `/admin/beta-lab`.

`/dashboard` requires a verified Supabase user. The admin routes additionally
require that the authenticated user's `profiles.role` equals `admin`.
Registration never accepts an application role: the database trigger writes
new profiles with `role = 'free_user'`. Assigning administrators remains a
trusted database operation for a later operational decision.

Session refresh occurs in `proxy.ts` only for protected routes. Authorization
is still repeated inside the Server Component helper and uses
`supabase.auth.getUser()` rather than trusting session cookie contents.

## Internal Beta Lab

Beta Lab supports synthetic, admin-only fixtures for pre-World Cup model
calibration. A competition with `usage_scope = 'internal_lab'` and a match
with `access_scope = 'lab_only'` is operational test data, not a public
product listing. `prediction_versions.run_scope = 'internal_lab'` keeps
experimental output distinguishable from World Cup product predictions.

The current admin screen reads internal fixtures, related teams, stored
predictions, registered match results, and any persisted prediction
evaluations through the authenticated server client. Worker status remains
clearly labelled mock data. An authenticated admin may update fixture review
metadata, create or edit real results for Lab fixtures, and persist evaluations
for internal predictions with complete markets and verified results from this
screen. Evaluation persistence invokes the existing pure evaluation module; it
does not generate new predictions or execute the prediction engine.
This is expressly not public league support or a version 2.0 launch.

## Public Predictions Read

`/predictions` reads a minimum public card projection through
`createSupabaseServerClient()`. Migration `0011` requires all three product
boundaries before a prediction can be read:

- `competitions.usage_scope = 'public_product'`;
- `matches.access_scope = 'public'`;
- `prediction_versions.run_scope = 'public_product'`.

When more than one public prediction version exists for the same public match,
the current UI displays the most recent row by `created_at`. This is a
temporary read convention until an explicit publication lifecycle is defined.

C01 does not grant public reads for `prediction_markets`,
`prediction_narratives`, or `prediction_results`, and it does not expose
premium, `lab_only`, or `internal_lab` records. `/matches/[slug]` remains
outside this read path and still belongs to a later product-data epic.

## Plans And Entitlements Backend

`/pricing` now reads only active, currently visible `plans` and their
`plan_features` through the authenticated-or-anonymous server client. Plan
features are public catalog/marketing values; they must not contain secrets,
private authorization rules, or sensitive operational configuration. No
checkout or payment workflow exists in this phase.

`/dashboard` remains authenticated and reads only the signed-in user's current
access state: active subscriptions, unexpired entitlements, and unexpired
match unlocks. The pure permission contract distinguishes these sources:

- `public_basic_access` for generally publishable free content;
- `beta_free_access` for a future server-controlled beta allocation;
- `entitlement_access` for a current entitlement or match unlock;
- `admin_access` for an explicit administrative bypass where a future query
  deliberately permits it.

A `premium_user` profile role or an active subscription is not, by itself, an
authorization to return protected prediction content. Future premium queries
must apply entitlement or unlock decisions in their server-side projection
before data reaches the browser. C02 does not open premium matches,
`prediction_markets`, `prediction_narratives`, or `prediction_results`.

## Data Intake Minimal

Data Intake Minimal lets Beta Lab represent internal fixtures and final scores
captured from mock or manual review workflows. It does not connect to
API-Football, Sportmonks, odds feeds, CSV uploads, or any live data provider.

`matches.intake_source` and `matches.data_quality` identify where an internal
fixture came from and whether it is ready for later model work.
`match_results` is the validated source for the real final score of a match.
`prediction_results` remains a separate evaluation record: it measures a
prediction version against that validated final result.

If Supabase CLI is not available, verify this foundation only in an approved
empty development project through Supabase SQL Editor: apply migration files
in numeric order (`0001`, `0002`, `0003`, `0004`, `0005`, `0006`, `0007`, `0008`, `0009`, `0010`, `0011`, `0012`) and then run
`supabase/seed/seed.sql`. Confirm that rows marked `internal_lab` and
`lab_only` remain for internal review only. Do not run the seed over production
or any remote project with data that has not been approved for reset.

## RLS Scope

RLS is enabled on every public table so applying this foundation does not
accidentally expose prediction, narrative, or operational data through a future
Supabase Data API configuration. This includes the explicitly sensitive tables:
`profiles`, `subscriptions`, `user_entitlements`, `user_match_unlocks`, and
`email_events`.

The original profile policy lets an authenticated user read their own profile.
Profile updates are deliberately deferred because a broad update policy could
allow a client to change `role`. C01 adds only filtered public reads for the
minimum prediction listing. C02 adds own-row reads for subscriptions and
current rights, but protected premium projections and email events remain TODO
items for later access and email epics.

Data Intake initially added a verified-results read policy for authenticated
users. Migration `0005` narrows that policy to verified results whose related
match is `public` or `premium` inside a `public_product` competition. Results
for `internal_lab`, `lab_only`, and `admin_only` fixtures remain readable only
through the admin policy. Only profiles with `role = 'admin'` can read
internal Lab rows or create and update Lab results; result deletion is not
granted to the authenticated UI workflow.

Because product-data read policies for `matches` and `competitions` are still
deferred, `0005` does not independently expose verified product results. It
only ensures that future authenticated product reads cannot cross the internal
Lab boundary through `match_results`.

Migration `0006` adds narrowly-scoped read policies for the authenticated
administrator screen. It allows only administrator profiles to read
`internal_lab` competitions, their `lab_only` matches, referenced teams,
internal prediction/model versions, and related `prediction_results`. The UI
uses `createSupabaseServerClient()` with the signed-in admin session; it does
not use the service-role client to bypass RLS.

Migration `0007` adds a narrowly-scoped update policy for the same Lab screen.
Only an authenticated administrator may update review fields on a `lab_only`
match belonging to an `internal_lab` competition. Table privileges are reduced
to `lab_status`, `data_quality`, `source_note`, `reviewed_at`, and
`reviewed_by`; no general fixture update is granted.

Migration `0008` replaces broad legacy mutation policies on `match_results`.
Only an authenticated administrator may insert or update results whose match
is `lab_only` within an `internal_lab` competition. Insert and update
privileges are limited to result-entry columns, `match_id` cannot be changed
after insertion, and delete access is not granted.

Migration `0009` is a controlled data backfill for the already-seeded internal
Lab prediction versions. It inserts their minimum BTTS and over/under market
rows using `0..100` probabilities; the seed file mirrors the same rows for
fresh development environments. It does not add application read or write
policies for `prediction_markets`.

Migration `0010` adds admin-only reads for `prediction_markets` associated with
internal Lab predictions, and column-limited insert/update access to
`prediction_results` only when a verified Lab match result and the required
BTTS and over/under markets exist. It grants no deletion and does not allow the
UI to generate or modify prediction versions or markets.

Migration `0011` adds public `SELECT` policies and required `SELECT` grants
only for competitions, matches, teams, venues, and prediction versions that
are in the public-product path. It does not change existing internal/admin
policies or mutation grants. The repository contains existing authenticated
grants needed for the Lab workflows; C01 deliberately avoids global privilege
cleanup so those flows are not disrupted.

Migration `0012` adds public `SELECT` policies for only current active plans
and their public catalog features. Authenticated users may read only their own
subscriptions, current entitlements, and current match unlocks. It adds no
insert, update, or delete capability, and it does not change Lab or prediction
content policies.

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

## Manual Auth Verification

Complete this check only after migrations are applied to an approved Supabase
environment and valid values are set in `.env.local`:

1. Enable email/password authentication in Supabase and add
   `http://localhost:3000/auth/callback` to the allowed redirect URLs.
2. Register at `/register` and, when email confirmation is enabled, follow the
   confirmation link.
3. Confirm that `/dashboard` becomes accessible and that `public.profiles`
   contains a new row with `role = 'free_user'`.
4. Confirm that the same account is redirected away from `/admin`.
5. Assign `role = 'admin'` through an approved trusted SQL/admin workflow,
   then confirm access to `/admin` and `/admin/beta-lab`.
6. Use **Cerrar sesión** and confirm `/dashboard` redirects to `/login`.

## Not Implemented

- Public product-data writes, public match-detail reads, and admin writes
  beyond Lab fixture review, match-result entry, or controlled evaluation
  persistence.
- Public browsing or commercial access to Beta Lab competitions.
- Social login, magic links, password reset, or profile editing.
- Premium projection and final paywall enforcement.
- Payments, real providers, Resend, LLM calls, or live workers.
