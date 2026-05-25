<!-- UFO Predictor | Updated roadmap after Beta Lab + Data Intake -->
<!-- Status assumes feature/data-intake-minimal has been committed, pushed, PR'd and merged before the team meeting. -->

# IMPLEMENTATION_PLAN.md — UFO Predictor

## Propósito

Este documento reemplaza el plan lineal inicial del prototipo por un plan operativo por fases. El proyecto ya avanzó de una maqueta visual con mocks a una base técnica real con Supabase, autenticación, roles, Beta Lab y Data Intake.

La ejecución técnica reciente fue realizada localmente por Jonathan con apoyo de herramientas asistidas para implementación y revisión. El objetivo de esta documentación no es asignar crédito personal, sino dejar trazabilidad clara del estado real del proyecto y de lo que sigue.

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

Esto cambia el enfoque del roadmap: ya no estamos solo construyendo una UI mock, sino una plataforma con datos, permisos y base para evaluación de modelo.

---

# Fase A — Fundación técnica

## A01. Setup y contexto del proyecto

**Estado:** Done  
**Ejecutado:** Jonathan, con apoyo Codex/ChatGPT  
**Resultado:** repo, documentación base, reglas, contexto para Codex, `.env.example`, README inicial.

## A02. Prototipo visual con mock data

**Estado:** Done  
**Resultado:** app Next.js navegable con rutas principales, branding, mock data y estructura de componentes.

Rutas incluidas:

- `/`
- `/predictions`
- `/matches/[slug]`
- `/pricing`
- `/transparency`
- `/dashboard`
- `/admin`
- `/admin/beta-lab`

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
**Resultado:** integridad entre `matches`, `seasons` y `competitions` reforzada con FK compuesta.

## A07. Supabase runtime clients

**Estado:** Done  
**Resultado:** clientes Supabase browser/server/admin y documentación de variables.

## A08. Auth y roles

**Estado:** Done  
**Resultado:** registro/login/logout, callback, perfiles automáticos, roles `free_user` y `admin`, dashboard/admin protegidos.

---

# Fase B — Laboratorio interno pre-Mundial

Objetivo: probar datos, fixtures, resultados y modelo antes del Mundial 2026 usando competiciones internas o fixtures de calibración, sin convertir esto todavía en producto público multi-liga.

## B01. Beta Lab Foundation

**Estado:** Done  
**Resultado:** migración `0003_beta_lab_foundation.sql`.

Incluye:

- `competitions.usage_scope`: `public_product`, `internal_lab`.
- `matches.access_scope`: `public`, `premium`, `admin_only`, `lab_only`.
- `matches.lab_status`: `candidate`, `ready`, `review`, `needs_data`, `archived`.
- `prediction_versions.run_scope`: `public_product`, `internal_lab`.
- Seed lab sintético.
- `/admin/beta-lab` ajustado para mostrar laboratorio interno.

## B02. Data Intake Minimal

**Estado:** Done  
**Resultado:** migración `0004_data_intake_minimal.sql`.

Incluye:

- `matches.intake_source`: `mock`, `manual`, `csv_import`.
- `matches.data_quality`: `unreviewed`, `reviewed`, `verified`, `rejected`.
- `matches.source_note`, `reviewed_at`, `reviewed_by`.
- Nueva tabla `match_results` como fuente validada del marcador real.
- Seed actualizado con resultados lab.
- `/admin/beta-lab` muestra fuente, calidad, notas y resultados.

## B03. Prediction Engine v0.1 Lab

**Estado:** Next  
**Objetivo:** crear un motor estadístico simple, determinístico y medible para Lab.

Alcance inicial:

- Funciones puras en `lib/prediction-engine/`.
- Team Power Score.
- Expected goals.
- Poisson.
- 1X2.
- Over/Under 2.5.
- BTTS.
- Top marcadores.
- Confidence y risk.
- Tests básicos.

No incluye:

- APIs reales.
- LLM.
- Odds reales.
- Paywall.

## B04. Model Evaluation / Backtesting

**Estado:** Next  
**Objetivo:** comparar predicciones generadas contra `match_results`.

Debe medir:

- Acierto 1X2.
- Acierto BTTS.
- Acierto Over/Under 2.5.
- Error de goles.
- Desempeño por `model_version`.

## B05. Lab Supabase Queries

**Estado:** Next  
**Objetivo:** reemplazar parte de los mocks del Beta Lab por lecturas server-side desde Supabase.

Debe mantener:

- admin-only.
- datos `internal_lab` / `lab_only`.
- sin exponer fixtures lab en la UI pública.

## B06. Lab Admin Review Flow

**Estado:** Next  
**Objetivo:** permitir revisión básica de calidad y resultados desde admin, sin depender del SQL Editor.

Alcance inicial:

- Acciones controladas server-side.
- Marcar fixture como `reviewed` o `verified`.
- Registrar o editar resultado de partido.
- No abrir escrituras a usuarios normales.

## B07. Lab Worker Simulation / Minimal Workers

**Estado:** Later  
**Objetivo:** preparar ejecución controlada para generar predicciones y validar resultados.

---

# Fase C — MVP Mundial funcional

Objetivo: convertir la app en un MVP funcional enfocado en Mundial 2026.

## C01. Public Predictions from DB

**Estado:** Next/Later  
**Objetivo:** que `/predictions` y `/matches/[slug]` lean datos reales desde Supabase.

## C02. Plans & Entitlements Backend

**Estado:** Next/Later  
**Objetivo:** convertir planes mock en permisos reales.

## C03. Paywall Backend Enforcement

**Estado:** Next/Later  
**Objetivo:** filtrar datos premium desde backend. Los locks visuales no bastan.

## C04. Transparency Real v0.1

**Estado:** Next/Later  
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
**Objetivo:** conectar API-Football o Sportmonks.

## D02. Odds Provider Integration

**Estado:** Later  
**Objetivo:** conectar cuotas reales y calcular Model vs Market.

## D03. Workers reales / Railway Cron

**Estado:** Later  
**Objetivo:** sincronizar datos, generar predicciones, validar resultados y alertar.

## D04. LLM Narratives

**Estado:** Later  
**Objetivo:** IA narrativa sobre predicciones ya calculadas.

## D05. Resend Emails / Alerts

**Estado:** Later  
**Objetivo:** bienvenida, alertas premium, resumen diario y vencimientos.

## D06. Payments

**Estado:** Later  
**Objetivo:** integrar Stripe, PayPal, Mercado Pago u otra pasarela.

## D07. Observability / Logs

**Estado:** Later  
**Objetivo:** monitoreo, errores, trazabilidad de workers y operaciones.

---

# Fase E — Ligas v2

## E01. Producto público multi-liga

**Estado:** Future  
**Objetivo:** ampliar más allá del Mundial hacia ligas, Champions, torneos regionales y amistosos como producto público.

Importante:

- El Lab pre-Mundial no es Ligas v2.
- El Lab usa fixtures internos para calibrar modelo.
- Ligas v2 requerirá UX, pricing, APIs, cobertura, permisos y estrategia comercial propios.

---

# Próximas tres épicas recomendadas

1. `feature/prediction-engine-v01`
2. `feature/model-evaluation-lab`
3. `feature/lab-supabase-queries`

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
