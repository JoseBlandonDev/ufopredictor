# START_HERE_FOR_NEW_CONVERSATIONS.md — UFO Predictor

## Leer primero

Este documento es el punto de entrada para conversaciones nuevas de ChatGPT o Codex sobre UFO Predictor.

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Estado actual resumido

El proyecto ya tiene un **Lab interno funcional para desarrolladores/admin**, con ciclo completo:

```txt
fixture Lab → revisión admin → resultado verificado → predicción interna + markets → evaluación → prediction_results persistido
```

Ya existe:

- App Next.js App Router.
- TypeScript + Tailwind.
- Supabase remoto conectado.
- Auth email/password funcionando.
- Roles `free_user` y `admin`.
- Dashboard/admin protegidos.
- `/admin/beta-lab` protegido con `requireAdmin`.
- Supabase schema aplicado manualmente en remoto hasta `0010_admin_lab_evaluation_persistence.sql`.
- Beta Lab Foundation.
- Data Intake Minimal.
- `match_results` con RLS reforzada.
- `prediction_results` con lectura admin y persistencia admin-only.
- `prediction_markets` con mercados internos mínimos para predicciones Lab.
- Prediction Engine v0.1 Lab en `lib/prediction-engine/`.
- Model Evaluation Lab en `lib/model-evaluation/`.
- Lab Supabase Queries en `lib/supabase/lab-queries.ts`.
- `/admin/beta-lab` leyendo datos reales de Supabase para fixtures, equipos, predicciones, mercados, resultados, evaluaciones y model versions.
- `/admin/beta-lab` permite revisar fixtures Lab.
- `/admin/beta-lab` permite crear/editar resultados reales Lab.
- `/admin/beta-lab` permite persistir/actualizar evaluaciones Lab usando `lib/model-evaluation/`.

Sigue mock o no implementado:

- worker runs reales, aunque `workerRuns` sigue visible como mock.
- API deportiva real.
- odds reales.
- LLM narrativo real.
- pagos.
- Google Auth.
- Supabase CLI local.
- predicciones públicas desde DB.
- paywall backend/entitlements reales.
- staging final.
- Transparency pública conectada a métricas reales.

---

## Últimas tareas mergeadas

```txt
#15 feat: add lab fixture review actions
#16 feat: add lab match result actions
#17 chore: seed internal lab prediction markets
#18 feat: persist lab evaluations
```

Migraciones aplicadas manualmente en Supabase remoto:

```txt
0007_admin_lab_fixture_review_actions.sql
0008_admin_lab_match_result_actions.sql
0009_seed_internal_lab_prediction_markets.sql
0010_admin_lab_evaluation_persistence.sql
```

---

## Lo que NO se debe rehacer

- No recrear el proyecto Next.js.
- No rehacer el prototipo visual inicial.
- No duplicar schema inicial.
- No rehacer Auth/roles.
- No rehacer Beta Lab Foundation.
- No rehacer Data Intake Minimal.
- No reimplementar Prediction Engine.
- No reimplementar Model Evaluation.
- No volver a mocks en `/admin/beta-lab` para fixtures, predicciones, resultados o evaluaciones.
- No convertir Beta Lab en producto público.
- No tocar `.env.local`.
- No usar service role desde UI/server actions normales.

---

## Siguiente bloque recomendado

Primero actualizar documentación del proyecto, si este archivo no está ya sincronizado en repo/fuentes:

```txt
docs/update-project-context-after-lab-admin-flow
```

Después, siguiente feature técnica recomendada:

```txt
feature/public-predictions-from-db
```

Objetivo: conectar superficies públicas a datos reales de Supabase, sin exponer Lab ni premium indebidamente.

Antes de implementar C01 hay una decisión clave:

> ¿Qué predicciones pasan de `internal_lab` a `public_product`, y bajo qué criterio?

No conectar `/predictions` a cualquier dato interno sin definir criterio de publicación.

---

## Próximas épicas probables

1. `feature/public-predictions-from-db`
   Leer predicciones publicables desde DB para `/predictions` y posiblemente `/matches/[slug]`.

2. `feature/plans-entitlements-backend`
   Crear base backend para free/premium/admin.

3. `feature/paywall-enforcement`
   Filtrar datos premium desde backend. No basta ocultar cosas en frontend, aunque sería muy humano intentarlo.

4. `feature/transparency-real-v01`
   Mostrar métricas reales desde `prediction_results`.

5. `feature/staging-deploy`
   URL estable para QA y revisión.

6. `feature/supabase-cli-local-setup`
   Mejorar flujo local de migraciones. No es glamoroso; por eso importa.

---

## Flujo recomendado con Codex

1. Confirmar:

```bash
git status
git branch
git pull origin main
```

2. Crear rama específica.
3. Pedir reconocimiento y plan antes de implementar.
4. Revisar respuesta de Codex en ChatGPT.
5. Implementar alcance pequeño.
6. Correr:

```bash
npm run test
npm run lint
npm run build
```

7. Si hay migración, aplicarla manualmente en Supabase SQL Editor y validar policies/grants/datos.
8. Commit/push/PR.
9. Merge a `main`.
10. Sincronizar local y borrar rama.

---

## Reglas permanentes

- No trabajar directo en `main`.
- No exponer secretos.
- No tocar `.env.local`.
- No prometer ganancias.
- No implementar polla/quiniela/pool en el MVP principal.
- Los datos premium deben filtrarse desde backend.
- El LLM no decide resultados ni probabilidades.
- El Lab sigue siendo interno/admin.
- El modelo estadístico calcula. La IA explica.
