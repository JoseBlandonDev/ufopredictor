# ARCHITECTURE_SUMMARY.md — UFO Predictor

## Stack final

| Área | Herramienta |
|---|---|
| Lenguaje | TypeScript |
| Framework | Next.js App Router |
| Frontend | React |
| UI | Tailwind CSS + shadcn/ui |
| Runtime/hosting | Railway |
| Base de datos | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Seguridad | Supabase RLS |
| Storage | Supabase Storage |
| Emails | Resend + React Email |
| Workers/crons | Railway Cron / Railway Services |
| Validación | Zod |
| Repo | GitHub |
| API fútbol | API-Football o Sportmonks |
| API cuotas | Proveedor principal o The Odds API |
| IA narrativa | OpenAI / Gemini / Claude API |
| Analytics | PostHog + GA4 |
| Pagos | Stripe / PayPal / Mercado Pago |

---

# Arquitectura

```txt
GitHub Monorepo
        ↓
Railway
  - Next.js Web/PWA
  - API Routes / Server Actions
  - Workers / Cron Jobs
        ↓
Supabase
  - PostgreSQL
  - Auth
  - RLS
  - Storage
        ↓
External Services
  - API-Football / Sportmonks
  - Odds provider
  - OpenAI / Gemini / Claude
  - Resend
  - Payment provider
```

---

# Decisiones cerradas

- Web/PWA, no app nativa.
- Railway como host del MVP.
- Supabase para DB/Auth/RLS.
- Resend para emails.
- Planes dinámicos.
- Modelo estadístico propio.
- LLM solo narrativa.
- Módulo polla/quiniela fuera del MVP principal.

---

# Decisiones pendientes

- API-Football vs Sportmonks.
- The Odds API sí/no.
- OpenAI vs Gemini vs Claude.
- Pasarela de pago.
- Precios exactos.
- Diseño final.
