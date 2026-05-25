<!-- UFO Predictor | Updated roadmap after Beta Lab + Data Intake -->
<!-- Status assumes feature/data-intake-minimal has been committed, pushed, PR'd and merged before the team meeting. -->

# ARCHITECTURE_SUMMARY.md — UFO Predictor

## Stack actual

| Área | Herramienta |
|---|---|
| Lenguaje | TypeScript |
| Framework | Next.js App Router |
| Frontend | React |
| UI | Tailwind CSS + componentes compatibles con shadcn/ui |
| DB/Auth | Supabase PostgreSQL + Supabase Auth |
| Seguridad | Supabase RLS inicial |
| Runtime futuro | Railway |
| Emails futuro | Resend + React Email |
| Workers futuro | Railway Services / Cron |
| IA narrativa futura | OpenAI / Gemini / Claude por decidir |
| Datos fútbol futuro | API-Football o Sportmonks |
| Odds futuro | The Odds API u otro proveedor |

---

# Arquitectura actual

```txt
Next.js Web/PWA
   ↓
Supabase runtime clients
   ↓
Supabase PostgreSQL + Auth + RLS
   ↓
Beta Lab / Data Intake / futuras predicciones
```

---

# Qué ya está conectado

- Supabase DB.
- Supabase Auth.
- Supabase runtime clients.
- Roles `free_user` y `admin`.
- Rutas protegidas.
- Migraciones y seed hasta Data Intake Minimal.

---

# Qué está preparado pero no conectado completamente

- UI pública de predicciones.
- Detalle de partido.
- Pricing/paywall.
- Transparency Center.
- Admin/Beta Lab con mocks extendidos.
- Workers.
- IA narrativa.
- APIs deportivas.
- Odds.

---

# Beta Lab

El Beta Lab es una capa interna/admin para probar fixtures, resultados y modelos antes del Mundial 2026.

Soporte actual:

- `competitions.usage_scope = internal_lab`.
- `matches.access_scope = lab_only`.
- `prediction_versions.run_scope = internal_lab`.
- `matches.intake_source`.
- `matches.data_quality`.
- `match_results`.

No es soporte público de ligas v2.

---

# Flujo previsto de predicción

```txt
Fixture validado
↓
Datos de entrada normalizados
↓
Prediction Engine v0.1
↓
prediction_versions + prediction_markets
↓
match_results
↓
prediction_results / evaluación
↓
Transparency real
```

---

# Principios técnicos

- El modelo estadístico calcula.
- La IA solo explica.
- Los datos premium se filtran en backend.
- El Lab se mantiene interno.
- No exponer secretos.
- No trabajar directo en `main`.
