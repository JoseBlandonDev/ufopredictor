# UFO Predictor — Auth Setup

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Current auth posture

UFO Predictor uses Supabase Auth with server-side session checks for protected routes and admin boundaries.

Recent auth work before and around the MVP 1 launch included:

- Google Auth setup;
- Google sign-in moved to a client button;
- PKCE/current-origin fixes for Google callback behavior;
- navbar session awareness;
- admin-only `Real Fixture Lab` visibility.

The current public/product flow assumes:

- anonymous users can view public predictions;
- authenticated users can access the dashboard/panel;
- admin users can access Real Fixture Lab;
- app routes do not use service-role.

## Public vs authenticated vs admin

### Anonymous users

Can see:

- public home;
- public predictions;
- public match detail;
- pricing/transparency pages.

Cannot access:

- dashboard;
- Real Fixture Lab;
- admin-only internals.

### Authenticated free users

Can access:

- dashboard/panel;
- free account state;
- public predictions and public match detail;
- future registered-free benefits once E09 defines them.

Current future candidate value:

- probable score visibility;
- watchlist/following;
- short interpretation.

### Admin users

Can access:

- Real Fixture Lab;
- exact fixture loading;
- internal prediction save;
- manual publication;
- exact public refresh.

Admin checks must remain server-side. Do not trust client-only gating. The browser is not a security boundary; it is a suggestion box with JavaScript.

## Google Auth notes

Google auth uses browser/client initiation and server-side callback handling.

Expected behavior:

- Google button starts OAuth from the browser;
- callback exchanges code for session server-side;
- `next` redirect is sanitized;
- session is then read normally by server components/helpers.

Known local-dev caveat:

- Browser extensions can cause hydration warnings by injecting body attributes such as `bis_register` or `__processed_*`.
- This has appeared during local testing and should not be treated as an app auth failure unless reproduced in a clean browser/profile.

## Admin Lab auth relationship

Real Fixture Lab uses normal authenticated server client + admin role checks.

It must not:

- use service-role in app routes;
- bypass RLS with privileged keys;
- expose admin-only data to non-admin sessions.

PR #61 added RLS support for exact public refresh, but still requires authenticated admin helper logic.

Relevant migration:

- `0030_real_fixture_lab_public_refresh_rls.sql`

## Current next auth-related product work

E09 access tiers may need to use session state to distinguish:

- anonymous;
- authenticated free;
- future premium;
- admin.

Do not implement payments or premium entitlements in E09 unless explicitly scoped. E09 should define/show gated UI carefully and preserve the future premium path.

## Hard boundaries

- no service-role in app routes;
- no client-only admin authorization;
- no public `prediction_results`;
- no hidden provider predictions;
- no betting odds as hidden model input;
- no payment implementation without a dedicated Epic G slice.
