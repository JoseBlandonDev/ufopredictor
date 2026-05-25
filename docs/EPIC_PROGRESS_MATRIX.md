<!-- UFO Predictor | Status updated for Model Evaluation / Backtesting Lab -->

# EPIC_PROGRESS_MATRIX.md — UFO Predictor

| ID | Fase | Épica | Estado | Rama / PR | Validación | Próxima acción |
|---|---|---|---|---|---|---|
| A01 | Fundación | Setup y contexto | Done | `feature/project-context` | PR mergeado | Mantener docs actualizados. |
| A02 | Fundación | Prototipo visual | Done | `feature/initial-prototype` | lint/build, revisión visual | No rehacer. |
| A03 | Fundación | Supabase schema inicial | Done | `feature/supabase-schema` | SQL/seed | Mantener migraciones versionadas. |
| A04 | Fundación | Fix integridad schema | Done | `fix/supabase-schema-integrity` | SQL review | Cerrado. |
| A05 | Fundación | Supabase runtime clients | Done | `feature/supabase-runtime-setup` | lint/build | Cerrado. |
| A06 | Fundación | Auth y roles | Done | `feature/auth-roles` | Supabase real + localhost | Cerrado. |
| B01 | Lab | Beta Lab Foundation | Done | `feature/beta-lab-foundation` | SQL + seed + UI | Cerrado. |
| B02 | Lab | Data Intake Minimal | Done | `feature/data-intake-minimal` | SQL + seed + UI + lint/build | Cerrado antes de reunión. |
| B02F | Lab | Fix RLS resultados Lab | Done | `fix/lab-results-rls` | SQL review + lint/build | `lab_only` permanece admin-only. |
| B03 | Lab | Prediction Engine v0.1 | Done | `feature/prediction-engine-v01` | Vitest + lint/build | Motor puro disponible. |
| B04 | Lab | Model Evaluation / Backtesting | In progress | `feature/model-evaluation-lab` | Tests esperados | Evaluar contra resultados verificados sin persistencia. |
| B05 | Lab | Lab Supabase Queries | Next | `feature/lab-supabase-queries` | localhost + Supabase | Reemplazar mocks del Lab gradualmente. |
| B06 | Lab | Lab Admin Review Flow | Next | `feature/lab-admin-review-flow` | Admin-only + RLS | Revisar datos desde admin. |
| C01 | MVP Mundial | Public Predictions from DB | Later | TBD | Supabase + UI | Conectar UI pública a DB. |
| C02 | MVP Mundial | Plans & Entitlements Backend | Later | TBD | Permissions tests | Free/premium real. |
| C03 | MVP Mundial | Paywall Enforcement | Later | TBD | Backend filtering | No enviar premium sin permiso. |
| C04 | MVP Mundial | Transparency Real | Later | TBD | Metrics from DB | Mostrar rendimiento real. |
| C05 | MVP Mundial | Staging Deploy | Later | TBD | Railway build | URL estable. |
| D01 | Comercial | Sports API Integration | Later | TBD | Provider test | API-Football/Sportmonks. |
| D02 | Comercial | Odds Integration | Later | TBD | Provider test | Model vs Market real. |
| D03 | Comercial | Workers | Later | TBD | Worker logs | Sync/generate/validate. |
| D04 | Comercial | LLM Narratives | Later | TBD | Zod validation | IA solo narrativa. |
| D05 | Comercial | Resend Emails | Later | TBD | Staging emails | Alertas y transaccionales. |
| D06 | Comercial | Payments | Later | TBD | Sandbox payment | Monetización. |
| E01 | Futuro | Ligas v2 | Future | TBD | TBD | Producto multi-liga. |
