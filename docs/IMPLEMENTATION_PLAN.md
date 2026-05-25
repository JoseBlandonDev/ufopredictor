# IMPLEMENTATION_PLAN.md — UFO Predictor

## Propósito

Este documento reemplaza el plan lineal inicial del prototipo por un plan operativo por fases. El proyecto ya avanzó de una maqueta visual con mocks a una base técnica real con Supabase, autenticación, roles, Beta Lab, Data Intake, motor predictivo, evaluación y lecturas reales del Lab desde Supabase.

---

# Resumen ejecutivo del avance

UFO Predictor ya cuenta con:

- Prototipo visual en Next.js.
- Branding inicial UFO Predictor.
- Supabase schema inicial.
- Supabase remoto aplicado y validado.
- Runtime clients de Supabase.
- Auth real con email/password.
- Roles `free_user` y `admin`.
- Rutas protegidas para dashboard y admin.
- Beta Lab Foundation para fixtures internos pre-Mundial.
- Data Intake Minimal con fuente/calidad de datos y resultados validados.
- Prediction Engine v0.1 Lab.
- Model Evaluation Lab.
- Lab Supabase Queries para `/admin/beta-lab`.
- RLS Lab reforzada con migraciones `0005` y `0006`.

Esto cambia el enfoque del roadmap: ya no estamos solo construyendo UI mock, sino una plataforma con datos, permisos, modelo, evaluación y operación interna parcial.

---

# Fase A — Fundación técnica

## A01. Setup y contexto del proyecto

**Estado:** Done  
**Resultado:** repo, documentación base, reglas, contexto para Codex, `.env.example`, README inicial.

## A02. Prototipo visual con mock data

**Estado:** Done  
**Resultado:** app Next.js navegable con rutas principales, branding, mock data y estructura de componentes.

## A03. Tipos y contratos internos

**Estado:** Done / Iterativo  
**Resultado:** tipos base en `types/`, mock data alineado y tipos de base actualizados manualmente conforme migraciones.

## A04. Planes dinámicos mock y paywall visual

**Estado:** Done parcial  
**Resultado:** planes y locks visuales existen en prototipo.  
**Pendiente:** backend real de entitlements y filtrado premium.

## A05. Supabase schema inicial

**Estado:** Done  
**Resultado:** migración `0001_initial_schema.sql`, seed inicial y tablas base.

## A06. Fix de integridad de schema

**Estado:** Done  
**Resultado:** integridad entre `matches`, `seasons` y `competitions` reforzada.

## A07. Supabase runtime clients

**Estado:** Done  
**Resultado:** clientes Supabase browser/server/admin y documentación de variables.

## A08. Auth y roles

**Estado:** Done  
**Resultado:** registro/login/logout, callback, perfiles automáticos, roles `free_user` y `admin`, dashboard/admin protegidos.

---

# Fase B — Laboratorio interno pre-Mundial

Objetivo: probar datos, fixtures, resultados, modelo y evaluación antes del Mundial 2026 usando competiciones internas o fixtures de calibración, sin convertir esto en producto público multi-liga.

## B01. Beta Lab Foundation

**Estado:** Done  
**Resultado:** migración `0003_beta_lab_foundation.sql`.

Incluye:

- `competitions.usage_scope`: `public_product`, `internal_lab`.
- `matches.access_scope`: `public`, `premium`, `admin_only`, `lab_only`.
- `matches.lab_status`: `candidate`, `ready`, `review`, `needs_data`, `archived`.
- `prediction_versions.run_scope`: `public_product`, `internal_lab`.
- Seed lab sintético.
- `/admin/beta-lab` ajustado para laboratorio interno.

## B02. Data Intake Minimal

**Estado:** Done  
**Resultado:** migración `0004_data_intake_minimal.sql`.

Incluye:

- `matches.intake_source`.
- `matches.data_quality`.
- `matches.source_note`, `reviewed_at`, `reviewed_by`.
- Nueva tabla `match_results`.
- Seed actualizado con resultados lab.

## B03. Prediction Engine v0.1 Lab

**Estado:** Done  
**Resultado:** motor estadístico simple, determinístico y medible para Lab.

Incluye:

- Funciones puras en `lib/prediction-engine/`.
- Team Power Score.
- Expected goals.
- Poisson.
- 1X2.
- Over/Under 2.5.
- BTTS.
- Top marcadores.
- Confidence/risk.
- Tests con Vitest.

No incluye:

- APIs reales.
- LLM.
- Odds reales.
- Paywall.

## SEC01. Restrict Lab Match Results RLS

**Estado:** Done  
**Resultado:** migración `0005_restrict_lab_match_results_rls.sql`.

Cierra fuga potencial donde resultados `verified` de Lab podían ser legibles para usuarios autenticados no-admin.

## B04. Model Evaluation / Backtesting Lab

**Estado:** Done  
**Resultado:** capa pura para comparar predicciones contra `match_results`.

Incluye:

- `lib/model-evaluation/`.
- `winner_correct`.
- `btts_correct`.
- `over_2_5_correct`.
- `exact_score_correct`.
- `goal_error`.
- `error_summary`.
- Métricas agregadas.
- Tests.

## B05. Lab Supabase Queries

**Estado:** Done  
**Resultado:** `/admin/beta-lab` lee datos reales desde Supabase.

Incluye:

- Migración `0006_admin_lab_read_policies.sql`.
- Policies admin-only para lecturas Lab.
- `lib/supabase/lab-queries.ts`.
- Fixtures/predicciones/resultados/evaluaciones reales en admin Beta Lab.
- Worker runs siguen mock.

## B06a. Lab Fixture Review Actions

**Estado:** Next  
**Objetivo:** permitir revisión básica de fixtures desde admin.

Alcance inicial recomendado:

- Actualizar `matches.lab_status`.
- Actualizar `matches.data_quality`.
- Actualizar `matches.source_note`.
- Setear `reviewed_at` y `reviewed_by`.
- Server actions o route handlers seguros.
- RLS update admin-only si hace falta.

## B06b. Lab Match Result Actions

**Estado:** Next  
**Objetivo:** permitir crear/editar resultados reales desde admin.

## B06c. Lab Evaluation Persistence Flow

**Estado:** Next  
**Objetivo:** persistir evaluaciones calculadas usando `lib/model-evaluation/`.

---

# Fase C — MVP Mundial funcional

Objetivo: convertir la app en un MVP funcional enfocado en Mundial 2026.

## C01. Public Predictions from DB

**Estado:** Later  
**Objetivo:** que `/predictions` y `/matches/[slug]` lean datos reales desde Supabase.

## C02. Plans & Entitlements Backend

**Estado:** Later  
**Objetivo:** convertir planes mock en permisos reales.

## C03. Paywall Backend Enforcement

**Estado:** Later  
**Objetivo:** filtrar datos premium desde backend.

## C04. Transparency Real v0.1

**Estado:** Later  
**Objetivo:** mostrar métricas reales usando `match_results` y `prediction_results`.

## C05. Admin Operations v0.1

**Estado:** Later  
**Objetivo:** panel operativo mínimo para monitorear predicciones, resultados y workers.

## C06. Staging Deploy

**Estado:** Later  
**Objetivo:** desplegar una URL estable para revisión del equipo.

## C07. MVP QA / Security Pass

**Estado:** Later  
**Objetivo:** revisar RLS, rutas protegidas, secretos, disclaimers y responsive.

---

# Fase D — Producto comercial / post-Mundial

## D01. Sports API Integration

**Estado:** Later

## D02. Odds Provider Integration

**Estado:** Later

## D03. Workers reales / Railway Cron

**Estado:** Later

## D04. LLM Narratives

**Estado:** Later

## D05. Resend Emails / Alerts

**Estado:** Later

## D06. Payments

**Estado:** Later

## D07. Observability / Logs

**Estado:** Later

---

# Fase E — Ligas v2

## E01. Producto público multi-liga

**Estado:** Future

---

# Próximas tres tareas recomendadas

1. `feature/lab-fixture-review-actions`
2. `feature/lab-match-result-actions`
3. `feature/lab-evaluation-persistence`

---

# Reglas de alcance vigentes

- No trabajar directo en `main`.
- Una rama por épica o sub-épica clara.
- No conectar APIs reales sin decisión de proveedor.
- No implementar LLM como calculador.
- No prometer ganancias.
- No implementar módulo de polla/quiniela/pool en el MVP principal.
- No convertir Beta Lab en producto público de ligas.
- Los datos premium deben filtrarse desde backend.
