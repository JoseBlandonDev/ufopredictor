<!-- UFO Predictor | Status updated for Model Evaluation / Backtesting Lab -->

# ROADMAP_AND_BACKLOG.md — UFO Predictor

## Vista general

Este backlog organiza el trabajo en cuatro horizontes:

1. Fundación técnica.
2. Laboratorio interno pre-Mundial.
3. MVP Mundial funcional.
4. Producto comercial / post-Mundial.

El proyecto ya superó el prototipo inicial. Ahora el foco es construir un sistema medible: datos, predicciones, evaluación, permisos y operación.

---

# Done

| ID | Fase | Épica | Rama / PR | Validación | Nota |
|---|---|---|---|---|---|
| A01 | Fundación | Setup y contexto | `feature/project-context` | PR mergeado | Documentación base y reglas. |
| A02 | Fundación | Prototipo visual | `feature/initial-prototype` | lint/build + revisión visual | App Next.js con mock data. |
| A03 | Fundación | Supabase schema inicial | `feature/supabase-schema` | SQL + lint/build | Tablas base y seed. |
| A04 | Fundación | Fix integridad schema | `fix/supabase-schema-integrity` | SQL review + lint/build | FK compuesta season/competition. |
| A05 | Fundación | Supabase runtime clients | `feature/supabase-runtime-setup` | lint/build | Clientes browser/server/admin. |
| A06 | Fundación | Auth y roles | `feature/auth-roles` | Supabase real + localhost + lint/build | Login, registro, admin/free_user. |
| B01 | Lab | Beta Lab Foundation | `feature/beta-lab-foundation` | Supabase SQL + seed + UI + lint/build | `internal_lab`, `lab_only`, `run_scope`. |
| B02 | Lab | Data Intake Minimal | `feature/data-intake-minimal` | Supabase SQL + seed + UI + lint/build | `match_results`, fuente/calidad de datos. |
| B02F | Lab | Fix RLS resultados Lab | `fix/lab-results-rls` | SQL review + lint/build | Evita lectura no-admin de resultados internos. |
| B03 | Lab | Prediction Engine v0.1 Lab | `feature/prediction-engine-v01` | Vitest + lint/build | Motor puro deterministico. |

---

# In Progress / Next

| ID | Épica | Prioridad | Objetivo | Dependencias |
|---|---|---:|---|---|
| B04 | Model Evaluation / Backtesting | P0 | En curso: comparar predicciones contra resultados validados sin persistir. | B03, B02 |
| B05 | Lab Supabase Queries | P0 | Leer datos reales del Lab desde Supabase en admin. | B02, Auth |
| B06 | Lab Admin Review Flow | P1 | Revisar fixtures/resultados desde admin. | B05 |
| C01 | Public Predictions from DB | P0 | Conectar predicciones públicas a Supabase. | B03, B05 |
| C02 | Plans & Entitlements Backend | P0 | Acceso real free/premium. | Auth, schema |

---

# Later

| ID | Épica | Prioridad | Objetivo |
|---|---|---:|---|
| C03 | Paywall Backend Enforcement | P0 | Filtrar datos premium en servidor. |
| C04 | Transparency Real v0.1 | P1 | Métricas reales de rendimiento. |
| C05 | Admin Operations v0.1 | P1 | Operación básica desde admin. |
| C06 | Staging Deploy | P0/P1 | URL estable para revisión. |
| C07 | MVP QA / Security Pass | P0 | Seguridad, RLS, rutas, secretos, copy. |
| D01 | Sports API Integration | P1 | API-Football/Sportmonks. |
| D02 | Odds Provider Integration | P1 | Model vs Market real. |
| D03 | Workers reales / Railway Cron | P1 | Sync/generate/validate/alerts. |
| D04 | LLM Narratives | P2 | Narrativa IA sobre JSON calculado. |
| D05 | Resend Emails / Alerts | P2 | Emails transaccionales y alertas. |
| D06 | Payments | P1 | Monetización real. |
| D07 | Observability / Logs | P2 | Monitoreo y errores. |
| E01 | Ligas v2 | Future | Producto público multi-liga. |

---

# Blocked / Open Decisions

| Decisión | Afecta | Estado |
|---|---|---|
| API-Football vs Sportmonks | D01, workers, Mundial | Pendiente |
| Proveedor de odds | D02 | Pendiente |
| Supabase CLI / Docker local | Migraciones, testing local | Pendiente |
| Proveedor LLM | D04 | Pendiente |
| Pasarela de pagos | D06 | Pendiente |
| Competiciones para Lab real | B03-B06 | Pendiente |
| Estrategia staging Railway | C06 | Pendiente |

---

# Notas de ejecución

- La ejecución técnica reciente fue realizada por Jonathan con apoyo de Codex/ChatGPT.
- Las validaciones realizadas incluyen SQL Editor de Supabase, seed, localhost, lint y build.
- El ownership futuro debe asignarse por épica, no por archivo suelto.
