# Email Skeleton

There is no first-party email service in the current Next.js app.

Auth emails are sent by Supabase Auth. In production, Supabase Auth uses Resend
as the manually configured SMTP provider in the Supabase Dashboard.

The app does not currently use the Resend SDK, React Email, or `RESEND_API_KEY`
at runtime. Do not add Resend secrets to Vercel/Next runtime unless a future
approved email epic introduces direct app-managed email.

Future app-managed emails may include:

- welcome
- purchase confirmation
- Golden Hour alert
- daily summary
- plan expiration
