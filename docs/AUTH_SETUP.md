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

## Email/password confirmation with Supabase + Resend SMTP

Resend is only the SMTP transport for production auth emails. The email subject,
HTML, and confirmation link are configured in Supabase Dashboard under
`Authentication > Email Templates > Confirm signup`.

UFO Predictor uses a server-side confirmation route:

- `/auth/callback` is reserved for Google OAuth / PKCE `code` exchange.
- `/auth/confirm` is reserved for email confirmation links with `token_hash`.
- `/auth/check-email` is the post-signup waiting/resend screen.

After email/password signup, the app redirects to `/auth/check-email` with a
sanitized `next` path and the submitted email as a query parameter. The email is
not a secret, but it can appear in browser history and request logs; keep it only
for this confirmation UX and resend flow. Do not use it for authorization or
account existence checks.

Recommended `Confirm signup` action link inside the Supabase template:

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
```

Recommended subject:

```text
Confirma tu cuenta en UFO Predictor
```

Starter HTML for the Supabase `Confirm signup` template:

```html
<div style="margin:0;padding:0;background:#050b14;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="border:1px solid rgba(0,215,255,0.28);background:#0a1a2b;border-radius:8px;padding:28px;">
      <p style="margin:0 0 12px;color:#00d7ff;font-size:12px;letter-spacing:4px;text-transform:uppercase;">
        UFO Predictor
      </p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#ffffff;">
        Confirma tu cuenta
      </h1>
      <p style="margin:0 0 22px;color:#b8c7d9;font-size:15px;line-height:1.6;">
        Activa tu acceso para entrar al panel y guardar tu sesion de forma segura.
      </p>
      <a
        href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard"
        style="display:inline-block;background:#00d7ff;color:#00111d;text-decoration:none;font-weight:700;border-radius:6px;padding:13px 18px;"
      >
        Confirmar cuenta
      </a>
      <p style="margin:22px 0 0;color:#7f93aa;font-size:12px;line-height:1.5;">
        Si no creaste una cuenta en UFO Predictor, puedes ignorar este correo.
      </p>
    </div>
  </div>
</div>
```

Supabase URL configuration for production:

- `Site URL`: `https://ufopredictor.com`
- Redirect URLs:
  - `https://ufopredictor.com/auth/confirm`
  - `https://ufopredictor.com/auth/callback`
  - `https://ufopredictor.com/dashboard`
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/dashboard`

Manual QA checklist for email/password auth:

1. Create a new account from `/register` with name, email, and password.
2. Confirm the app sends the user to `/auth/check-email` instead of a cold login.
3. Confirm the email arrives through Resend with the UFO Predictor template.
4. Click `Confirmar cuenta` and verify the app redirects cleanly to `/dashboard`.
5. Log out and log back in with email/password.
6. Try logging in before confirming a fresh account and verify the message explains that the email is not confirmed.
7. Use `/auth/check-email` to resend confirmation and verify the response does not reveal account existence.
8. Confirm Google login still returns through `/auth/callback` and reaches `/dashboard`.
9. If Supabase returns an ambiguous signup response after sending email, confirm the user still lands on `/auth/check-email` instead of seeing a red register error.

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
