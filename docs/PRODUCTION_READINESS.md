# Production Readiness - UFO Predictor

_Status: Epic G / G02 documented. This is a configuration checklist, not a production smoke-test result._

## Purpose

This document separates local/dev and production configuration for UFO Predictor before public launch. It covers Supabase Auth, Google OAuth, Resend SMTP, Vercel, the `ufopredictor.com` domain, auth redirects, environment variables, preview deployment policy, smoke testing, and security checks.

G01 Auth is complete: Google login works, email/password registration works, Supabase email confirmation works through `/auth/confirm`, Google OAuth / PKCE returns through `/auth/callback`, and `/auth/check-email` handles the post-registration resend flow.

## Current State

- Supabase Auth is the authentication system.
- The Next.js app uses Supabase browser/server clients with the public Supabase URL and anon key.
- Resend is used only as the SMTP transport configured in Supabase Auth.
- The app does not use the Resend SDK and does not send auth emails directly.
- The MVP web production target is Vercel with the `https://ufopredictor.com` domain.
- Local development auth is supported on `http://localhost:3000`.
- Production smoke testing belongs to G03 and has not been marked complete by this document.

## Environment Variables

### Vercel Web Runtime / Next App

These are the only environment variables required by the current Next.js web runtime for Supabase auth and app URL construction:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://ufopredictor.com
```

- `NEXT_PUBLIC_SUPABASE_URL` is browser-safe but must point to the intended Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is browser-safe only when RLS policies are correct.
- `NEXT_PUBLIC_APP_URL` is required for production auth redirects and email confirmation links. In production it must be:

```txt
NEXT_PUBLIC_APP_URL=https://ufopredictor.com
```

If `NEXT_PUBLIC_APP_URL` is missing or set to localhost in production, auth emails can generate incorrect links and Google redirects can fail or return users to the wrong origin.

Do not put `SUPABASE_SERVICE_ROLE_KEY` in the Vercel web runtime unless a future approved web runtime explicitly requires it. The current app routes do not need it.

### Scripts / Ops / Admin Local

These variables are for controlled local/admin operations and scripts, not normal public web runtime:

```txt
SUPABASE_SERVICE_ROLE_KEY=
API_FOOTBALL_KEY=
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
USERNAME=
```

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Keep it out of browser code and out of Vercel web runtime unless separately approved.
- `API_FOOTBALL_KEY` is used by the API-Football client and controlled ingest tooling.
- `API_FOOTBALL_BASE_URL` defaults to `https://v3.football.api-sports.io` when omitted.
- `USERNAME` is optionally read by the ingest writer for `created_by` metadata.

### Future / Not Active In Next Runtime

Payment, LLM, odds, generic football provider, and direct Resend variables may remain as placeholders for future planning. They are not part of the current production auth runtime unless a later epic activates them.

For Resend specifically, do not add `RESEND_API_KEY` to Next/Vercel runtime while the app does not use the Resend SDK. The Resend API key is currently used manually as the SMTP password in Supabase Dashboard.

## Supabase Production Checklist

- Confirm the production Supabase project is the intended project for `ufopredictor.com`.
- Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel from the production Supabase project.
- Set Auth `Site URL` to:

```txt
https://ufopredictor.com
```

- Configure these Auth Redirect URLs:

```txt
https://ufopredictor.com/auth/callback
https://ufopredictor.com/auth/confirm
https://ufopredictor.com/dashboard
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/dashboard
```

- Enable email confirmation.
- Configure Resend SMTP manually in Supabase Auth.
- Configure the Confirm signup template link:

```txt
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
```

- Confirm app routes do not use service-role keys.
- Apply production migrations only through the approved manual Supabase SQL Editor workflow unless that workflow is explicitly changed.

## Supabase Local / Dev Checklist

- Create `.env.local` from `.env.example`.
- Use local/dev Supabase URL and anon key for local testing.
- Set local app URL:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- Add local redirect URLs in Supabase Auth:

```txt
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/dashboard
```

- Use local/admin script secrets only in local shells or approved ops environments.
- Do not commit `.env.local` or real secrets.

## Google OAuth Checklist

- Use a Google OAuth Web client.
- In Google Cloud, authorize the Supabase callback URL:

```txt
https://<project-ref>.supabase.co/auth/v1/callback
```

- In Supabase Auth, enable Google provider with the Google client ID and secret.
- In Supabase Auth, allow the app callback URLs for production and local:

```txt
https://ufopredictor.com/auth/callback
http://localhost:3000/auth/callback
```

- Confirm Google sign-in returns to `/dashboard` or the sanitized `next` path.

## Resend Checklist

- Verify the sending domain in Resend.
- Use a sender address from the verified domain.
- Configure Resend as SMTP in Supabase Dashboard.
- Use the Resend API key as the SMTP password in Supabase Dashboard.
- Do not commit the Resend API key.
- Do not add `RESEND_API_KEY` to Next/Vercel runtime while the app does not use the Resend SDK.
- Use Resend logs to verify delivery during auth QA.

## Vercel Checklist

- Confirm the production project points to the intended Git branch/repo.
- Configure `ufopredictor.com` on the Vercel project.
- Set production environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://ufopredictor.com
```

- Do not configure service-role, payment, LLM, odds, or Resend SDK secrets for the web runtime unless a later approved epic uses them.
- Run `npm run build` before deployment or confirm Vercel build succeeds.
- Keep `railway.json` as legacy/old prototype deployment context unless a future decision reactivates Railway.

## Preview Deployment Policy

MVP policy:

- Production auth is formally supported on `https://ufopredictor.com`.
- Local auth is formally supported on `http://localhost:3000`.
- Vercel preview auth is not part of the formal MVP smoke test unless explicit preview callback URLs are configured.
- If preview auth is later required, define a separate allowed redirect/callback strategy before enabling it.

Do not assume arbitrary Vercel preview URLs are safe auth redirect targets.

## Manual Smoke Test Checklist

G03 owns the real production smoke test. Use this checklist when G03 starts:

- Open `https://ufopredictor.com`.
- Verify home navigation works.
- Verify `/predictions` is reachable.
- Verify a public match detail page is reachable.
- Verify logged-out navbar state.
- Register with name, email, and password.
- Confirm `/auth/check-email` appears after registration.
- Confirm the auth email arrives through Resend/Supabase SMTP.
- Click the confirmation email and confirm `/auth/confirm` redirects to `/dashboard`.
- Log out and log in with email/password.
- Log in with Google and confirm `/auth/callback` redirects correctly.
- Verify logged-in dashboard state.
- Verify non-admin users do not see admin/Lab links.
- Verify public pages do not expose internal Lab data, service-role data, or `prediction_results`.
- Verify mobile layout basics.

## Security Checklist

- No real secrets in versioned files.
- No service-role key in browser code.
- No service-role key in app routes for current auth/product flows.
- No sensitive variables with `NEXT_PUBLIC_`.
- RLS remains the data boundary for anon/authenticated Supabase access.
- Admin checks remain server-side.
- `prediction_results` remains internal.
- Resend API key remains in Supabase Dashboard SMTP config, not in Next runtime.
- Preview deployment auth remains unsupported until explicitly configured.
- Production auth URLs are explicit and limited to known domains.
