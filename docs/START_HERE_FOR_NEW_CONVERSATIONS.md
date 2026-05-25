# START_HERE_FOR_NEW_CONVERSATIONS.md — UFO Predictor

## Resumen rápido

UFO Predictor es una web/PWA de predicciones probabilísticas de fútbol, inicialmente enfocada en el Mundial 2026.

No es casa de apuestas, no recibe apuestas y no promete ganancias.

Principio central:

> El modelo estadístico calcula. La IA explica.

El LLM no debe calcular probabilidades ni decidir resultados. La IA futura solo debe explicar outputs ya calculados por el modelo estadístico.

---

## Estado actual

El proyecto ya tiene una base técnica real, no solo un prototipo visual.

Ya existe:

- App Next.js con App Router.
- TypeScript + Tailwind.
- Supabase schema aplicado hasta `0006_admin_lab_read_policies.sql`.
- Supabase remoto conectado.
- Supabase runtime clients.
- Auth real email/password.
- Roles `free_user` y `admin`.
- Dashboard/admin protegidos.
- `/admin/beta-lab` protegido con `requireAdmin`.
- Beta Lab Foundation.
- Data Intake Minimal.
- `match_results`.
- `prediction_results`.
- RLS reforzada para datos Lab.
- Prediction Engine v0.1 Lab en `lib/prediction-engine/`.
- Model Evaluation Lab en `lib/model-evaluation/`.
- Lab Supabase Queries en `lib/supabase/lab-queries.ts`.
- `/admin/beta-lab` leyendo datos reales de Supabase para fixtures, equipos, predicciones, resultados, evaluaciones y model versions.

Sigue mock:

- worker runs / estado de workers.
- predicciones públicas.
- detalle público de partido.
- pricing/paywall.
- transparency pública.
- workers reales.
- narrativa IA.

---

## Últimas épicas cerradas

```txt
feat: add prediction engine v0.1 lab
fix: restrict lab match results rls
feat: add model evaluation lab
feat: add lab Supabase queries
```

---

## Lo que NO se debe rehacer

- No rehacer el prototipo.
- No recrear Next.js desde cero.
- No duplicar el schema inicial.
- No rehacer Auth.
- No rehacer roles.
- No rehacer Beta Lab Foundation.
- No rehacer Data Intake Minimal.
- No reimplementar Prediction Engine.
- No reimplementar Model Evaluation.
- No volver a mocks en `/admin/beta-lab` para fixtures/predicciones/resultados/evaluaciones.
- No convertir Beta Lab en producto público de ligas.

---

## Próximo bloque recomendado

No hacer una épica gigante de Lab Admin Review Flow. Dividir en sub-épicas pequeñas.

### 1. `feature/lab-fixture-review-actions`

Objetivo: permitir que un admin revise fixtures Lab desde `/admin/beta-lab`.

Alcance inicial:

- actualizar `matches.lab_status`;
- actualizar `matches.data_quality`;
- actualizar `matches.source_note`;
- setear `matches.reviewed_at`;
- setear `matches.reviewed_by`;
- mantener admin-only;
- usar server actions o route handlers seguros;
- agregar RLS update admin-only si hace falta.

No incluir todavía:

- edición de resultados;
- ejecución del motor;
- workers;
- APIs externas.

### 2. `feature/lab-match-result-actions`

Objetivo: crear/editar resultados reales desde admin.

Alcance:

- crear/actualizar `match_results`;
- validar goles;
- manejar `verification_status`;
- registrar reviewer/admin.

### 3. `feature/lab-evaluation-persistence`

Objetivo: persistir evaluaciones usando `lib/model-evaluation/`.

Alcance:

- tomar `prediction_version` + `match_result`;
- calcular evaluación;
- crear/actualizar `prediction_results`.

---

## En radar

- `feature/google-auth`.
- `feature/supabase-cli-local-setup`.
- `feature/public-predictions-from-db`.
- `feature/plans-entitlements-backend`.
- API deportiva.
- Odds.
- Workers.
- LLM narrativo.
- Pagos.
- Railway staging.

---

## Flujo recomendado con Codex

1. Actualizar `main`.
2. Crear rama específica.
3. Pedir reconocimiento/acotación.
4. Revisar respuesta en ChatGPT.
5. Implementar alcance pequeño.
6. Correr test/lint/build según aplique.
7. Validar Supabase manualmente si hay migración.
8. Commit/push/PR.

---

## Archivos clave

- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/EPIC_PROGRESS_MATRIX.md`
- `docs/NEXT_EPICS_PLAN.md`
- `docs/OPEN_DECISIONS.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_V01.md`
- `docs/ARCHITECTURE_SUMMARY.md`
- `docs/CODEX_WORKFLOW.md`
- `docs/CODEX_HANDOFF_CURRENT.md`
- `lib/prediction-engine/`
- `lib/model-evaluation/`
- `lib/supabase/lab-queries.ts`
- `app/admin/beta-lab/page.tsx`

---

## Reglas permanentes

- No trabajar directo en `main`.
- No exponer secretos.
- No tocar `.env.local`.
- No prometer ganancias.
- No implementar polla/quiniela/pool en el MVP principal.
- Los datos premium deben filtrarse desde backend.
- El LLM no decide resultados.
- El Lab sigue siendo interno/admin.
