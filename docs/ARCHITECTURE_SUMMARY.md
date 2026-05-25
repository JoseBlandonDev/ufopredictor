# ARCHITECTURE_SUMMARY.md — UFO Predictor

## Stack actual

| Área | Herramienta |
|---|---|
| Lenguaje | TypeScript |
| Framework | Next.js App Router |
| Frontend | React |
| UI | Tailwind CSS + componentes compatibles con shadcn/ui |
| DB/Auth | Supabase PostgreSQL + Supabase Auth |
| Seguridad | Supabase RLS + guards app-side |
| Runtime futuro | Railway |
| Emails futuro | Resend + React Email |
| Workers futuro | Railway Services / Cron |
| IA narrativa futura | OpenAI / Gemini / Claude por decidir |
| Datos fútbol futuro | API-Football o Sportmonks |
| Odds futuro | The Odds API u otro proveedor |

---

## Arquitectura actual

```txt
Next.js Web/PWA
   ↓
Supabase runtime clients
   ↓
Supabase PostgreSQL + Auth + RLS
   ↓
Beta Lab / Data Intake / Prediction Engine / Model Evaluation
```

---

## Qué ya está conectado

- Supabase DB.
- Supabase Auth.
- Supabase runtime clients.
- Roles `free_user` y `admin`.
- Rutas protegidas.
- Migraciones y seed hasta Data Intake Minimal.
- Policies RLS Lab hasta `0006_admin_lab_read_policies.sql`.
- `/admin/beta-lab` con lecturas reales desde Supabase.

---

## Módulos actuales

### `lib/prediction-engine/`

Motor estadístico v0.1 Lab.

Calcula:

- Team Power Score.
- Expected goals.
- Poisson.
- 1X2.
- BTTS.
- Over/Under 2.5.
- Top scorelines.
- Confidence/risk.

### `lib/model-evaluation/`

Evaluación pura de predicciones contra resultados reales.

Calcula:

- `winner_correct`.
- `btts_correct`.
- `over_2_5_correct`.
- `exact_score_correct`.
- `goal_error`.
- `error_summary`.
- métricas agregadas.

### `lib/supabase/lab-queries.ts`

Queries server-side para `/admin/beta-lab`.

Lee:

- competitions `internal_lab`.
- matches `lab_only`.
- equipos.
- prediction versions `internal_lab`.
- match results.
- prediction results.
- model versions.

Usa `createSupabaseServerClient()` con sesión real. No usa service role para alimentar UI.

---

## Beta Lab

El Beta Lab es una capa interna/admin para probar fixtures, resultados, predicciones y evaluación antes del Mundial 2026.

Soporte actual:

- `competitions.usage_scope = internal_lab`.
- `matches.access_scope = lab_only`.
- `prediction_versions.run_scope = internal_lab`.
- `matches.intake_source`.
- `matches.data_quality`.
- `match_results`.
- `prediction_results`.

No es soporte público de ligas v2.

---

## Qué está preparado pero no conectado completamente

- UI pública de predicciones.
- Detalle público de partido.
- Pricing/paywall.
- Transparency Center.
- Workers.
- IA narrativa.
- APIs deportivas.
- Odds.

---

## Flujo previsto de predicción/evaluación

```txt
Fixture validado
↓
Prediction Engine v0.1
↓
prediction_versions / mercados futuros
↓
match_results
↓
Model Evaluation
↓
prediction_results
↓
Transparency real
```

---

## Principios técnicos

- El modelo estadístico calcula.
- La IA solo explica.
- Los datos premium se filtran en backend.
- El Lab se mantiene interno.
- No exponer secretos.
- No trabajar directo en `main`.
- No usar service role para alimentar UI salvo justificación explícita.
