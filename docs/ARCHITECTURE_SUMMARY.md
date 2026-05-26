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
| Runtime futuro | Railway o alternativa por decidir |
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

Principio permanente:

```txt
El modelo estadístico calcula. La IA explica.
```

---

## Qué ya está conectado

- Supabase DB remoto.
- Supabase Auth con email/password.
- Supabase runtime clients.
- Roles `free_user` y `admin`.
- Rutas protegidas.
- Migraciones y seed hasta Lab Admin Flow.
- Policies/RLS Lab hasta `0010_admin_lab_evaluation_persistence.sql`.
- `/admin/beta-lab` con lecturas reales desde Supabase.
- `/admin/beta-lab` con escrituras admin controladas:
  - review de fixtures;
  - resultados reales;
  - evaluaciones persistidas.

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

Estado:

- implementado como módulo puro;
- cubierto con tests;
- no se ejecuta todavía desde UI admin, workers ni rutas públicas.

### `lib/model-evaluation/`

Evaluación pura de predicciones contra resultados reales.

Calcula:

- `winner_correct`;
- `btts_correct`;
- `over_2_5_correct`;
- `exact_score_correct`;
- `goal_error`;
- `error_summary`;
- métricas agregadas.

Estado:

- implementado como módulo puro;
- cubierto con tests;
- usado por B06c para persistir `prediction_results` desde `/admin/beta-lab`.

### `lib/supabase/lab-queries.ts`

Queries server-side para `/admin/beta-lab`.

Lee:

- competitions `internal_lab`;
- matches `lab_only`;
- equipos;
- prediction versions `internal_lab`;
- prediction markets internos;
- match results;
- prediction results;
- model versions.

Deriva estados de readiness:

- si hay resultado verificado;
- si hay markets completos;
- si ya existe evaluación persistida.

Usa `createSupabaseServerClient()` con sesión real. No usa service role para alimentar UI.

---

## Beta Lab

El Beta Lab es una capa interna/admin para probar fixtures, resultados, predicciones y evaluación antes del Mundial 2026.

Soporte actual:

- `competitions.usage_scope = internal_lab`.
- `matches.access_scope = lab_only`.
- `prediction_versions.run_scope = internal_lab`.
- `prediction_markets` para mercados internos mínimos.
- `matches.intake_source`.
- `matches.data_quality`.
- `match_results`.
- `prediction_results`.

Flujo operativo actual:

```txt
Fixture Lab
↓
Revisión admin
↓
Resultado real verificado
↓
Predicción interna + markets
↓
Model Evaluation
↓
prediction_results persistido
```

No es soporte público de ligas v2.

---

## Supabase/RLS reciente

Migraciones relevantes recientes:

| Migración | Propósito |
|---|---|
| `0007_admin_lab_fixture_review_actions.sql` | Update admin-only para campos de revisión de `matches` Lab. |
| `0008_admin_lab_match_result_actions.sql` | Insert/update admin-only de `match_results` Lab, sin delete. |
| `0009_seed_internal_lab_prediction_markets.sql` | Backfill/seed de markets internos BTTS y OU 2.5. |
| `0010_admin_lab_evaluation_persistence.sql` | Select admin-only de markets e insert/update admin-only de evaluaciones, sin delete. |

---

## Qué está preparado pero no conectado completamente

- UI pública de predicciones desde DB.
- Detalle público de partido desde DB.
- Pricing/paywall backend.
- Entitlements reales.
- Transparency Center con métricas reales.
- Workers reales.
- IA narrativa.
- APIs deportivas.
- Odds.
- Pagos.
- Google Auth.
- Staging final.

---

## Flujo previsto de producto público

```txt
Predicciones publicables
↓
public_product scope
↓
queries públicas filtradas
↓
paywall/entitlements backend
↓
UI pública
↓
Transparency real
```

No debe exponerse `internal_lab` ni `lab_only` en rutas públicas.

---

## Principios técnicos

- El modelo estadístico calcula.
- La IA solo explica.
- Los datos premium se filtran en backend.
- El Lab se mantiene interno.
- No exponer secretos.
- No trabajar directo en `main`.
- No usar service role para alimentar UI salvo justificación explícita.
- No ejecutar Prediction Engine en rutas públicas sin épica específica.
