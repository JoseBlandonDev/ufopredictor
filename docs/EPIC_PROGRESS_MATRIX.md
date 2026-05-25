# EPIC_PROGRESS_MATRIX.md — UFO Predictor

| ID | Fase | Épica / tarea | Estado | Rama / PR | Validación | Próxima acción |
|---|---|---|---|---|---|---|
| A01 | Fundación | Setup y contexto | Done | `feature/project-context` | PR mergeado | Mantener docs actualizados. |
| A02 | Fundación | Prototipo visual | Done | `feature/initial-prototype` | lint/build, revisión visual | No rehacer. |
| A03 | Fundación | Supabase schema inicial | Done | `feature/supabase-schema` | SQL/seed | Mantener migraciones versionadas. |
| A04 | Fundación | Fix integridad schema | Done | `fix/supabase-schema-integrity` | SQL review | Cerrado. |
| A05 | Fundación | Supabase runtime clients | Done | `feature/supabase-runtime-setup` | lint/build | Cerrado. |
| A06 | Fundación | Auth y roles | Done | `feature/auth-roles` | Supabase real + localhost | Cerrado. |
| B01 | Lab | Beta Lab Foundation | Done | `feature/beta-lab-foundation` | SQL + seed + UI | Cerrado. |
| B02 | Lab | Data Intake Minimal | Done | `feature/data-intake-minimal` | SQL + seed + UI + lint/build | Cerrado. |
| B03 | Lab | Prediction Engine v0.1 | Done | `feature/prediction-engine-v01` | Vitest + lint/build | Motor puro implementado. |
| SEC01 | Seguridad | Restrict Lab Match Results RLS | Done | `fix/lab-results-rls` | Supabase SQL Editor | Cerrado. |
| B04 | Lab | Model Evaluation / Backtesting Lab | Done | `feature/model-evaluation-lab` | Vitest + lint/build | Evaluador puro implementado. |
| B05 | Lab | Lab Supabase Queries | Done | `feature/lab-supabase-queries` | SQL Editor + admin UI + lint/build | Admin Beta Lab lee datos reales parcialmente. |
| B06a | Lab | Lab Fixture Review Actions | Next | `feature/lab-fixture-review-actions` | Esperada: server action + RLS + lint/build | Permitir revisión de fixtures desde admin. |
| B06b | Lab | Lab Match Result Actions | Next | `feature/lab-match-result-actions` | Esperada: SQL + UI/admin validation | Crear/editar resultados desde admin. |
| B06c | Lab | Lab Evaluation Persistence Flow | Next | `feature/lab-evaluation-persistence` | Esperada: tests + Supabase validation | Persistir evaluaciones usando `lib/model-evaluation/`. |
| C01 | MVP Mundial | Public Predictions from DB | Later | TBD | Supabase + UI | Conectar UI pública a DB. |
| C02 | MVP Mundial | Plans & Entitlements Backend | Later | TBD | Permissions tests | Free/premium real. |
| C03 | MVP Mundial | Paywall Enforcement | Later | TBD | Backend filtering | No enviar premium sin permiso. |
| C04 | MVP Mundial | Transparency Real | Later | TBD | Metrics from DB | Mostrar rendimiento real. |
| C05 | MVP Mundial | Staging Deploy | Later | TBD | Railway build | URL estable. |
| G01 | Auth/UX | Google Auth | Radar | `feature/google-auth` | OAuth + profile validation | Implementar cuando se decida timing. |
| I01 | Infra | Supabase CLI Local Setup | Radar | `feature/supabase-cli-local-setup` | CLI/Docker validation | No urgente; útil cuando crezcan migraciones. |
| D01 | Comercial | Sports API Integration | Later | TBD | Provider test | API-Football/Sportmonks. |
| D02 | Comercial | Odds Integration | Later | TBD | Provider test | Model vs Market real. |
| D03 | Comercial | Workers | Later | TBD | Worker logs | Sync/generate/validate. |
| D04 | Comercial | LLM Narratives | Later | TBD | Zod validation | IA solo narrativa. |
| D05 | Comercial | Resend Emails | Later | TBD | Staging emails | Alertas y transaccionales. |
| D06 | Comercial | Payments | Later | TBD | Sandbox payment | Monetización. |
| E01 | Futuro | Ligas v2 | Future | TBD | TBD | Producto multi-liga. |
