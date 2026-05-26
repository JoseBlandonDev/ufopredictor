# CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md — UFO Predictor

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Qué es UFO Predictor

UFO Predictor es una web/PWA de predicciones probabilísticas de fútbol, inicialmente enfocada en el Mundial 2026.

No es casa de apuestas. No recibe apuestas. No promete ganancias.

La propuesta central es combinar:

- modelo estadístico propio;
- visualización clara;
- transparencia de métricas;
- IA futura solo para explicar, no para calcular.

---

## Principio permanente

```txt
El modelo estadístico calcula. La IA explica.
```

El LLM no debe:

- calcular probabilidades;
- decidir resultados;
- modificar outputs del modelo;
- inventar confianza.

La IA futura solo debe narrar o explicar datos ya calculados y persistidos.

---

## Estado actual de producto

### MVP interno de Lab

Estado: **funcional para desarrolladores/admin**.

Flujo completo actual:

```txt
Fixture Lab
→ revisión admin
→ resultado real verificado
→ predicción interna + markets persistidos
→ evaluatePrediction()
→ prediction_results persistido
→ visualización en /admin/beta-lab
```

### MVP público

Estado: **pendiente**.

Las superficies públicas todavía no consumen datos reales completamente:

- `/predictions` sigue mock/parcial.
- `/matches/[slug]` sigue mock/parcial.
- `/transparency` no usa métricas reales agregadas.
- `/pricing` no tiene backend de entitlements.

---

## Stack técnico

- Next.js App Router.
- TypeScript.
- Tailwind.
- Supabase remoto.
- Auth email/password.
- Roles `free_user` y `admin`.
- RLS en tablas sensibles.
- Server Actions para flujos admin.

---

## Módulos importantes

### `lib/prediction-engine/`

Prediction Engine v0.1 Lab.

Uso actual:

- módulo puro;
- tests existentes;
- no se ejecuta desde UI admin;
- no genera predicciones automáticamente.

### `lib/model-evaluation/`

Model Evaluation Lab.

Uso actual:

- módulo puro;
- tests existentes;
- usado por B06c para persistir evaluaciones en `prediction_results`.

### `lib/supabase/lab-queries.ts`

Lee datos reales para `/admin/beta-lab`:

- fixtures;
- teams;
- competitions;
- prediction_versions;
- prediction_markets;
- match_results;
- prediction_results;
- model_versions.

No ejecuta evaluación; solo lee y deriva estados.

---

## Supabase y migraciones

Remoto aplicado manualmente hasta:

```txt
0010_admin_lab_evaluation_persistence.sql
```

Migraciones clave recientes:

| Migración | Propósito |
|---|---|
| `0007_admin_lab_fixture_review_actions.sql` | Update admin-only para review de fixtures Lab. |
| `0008_admin_lab_match_result_actions.sql` | Insert/update admin-only para resultados Lab, sin delete. |
| `0009_seed_internal_lab_prediction_markets.sql` | Backfill/seed de markets internos BTTS y OU 2.5. |
| `0010_admin_lab_evaluation_persistence.sql` | Select admin-only de markets y persistencia admin-only de evaluaciones. |

---

## Estado de `/admin/beta-lab`

Funciona:

- Revisión de fixtures.
- Captura/edición de resultados.
- Detección de resultado verificado.
- Detección de markets completos.
- Persistencia/actualización de evaluaciones.
- Visualización de métricas persistidas.

Sigue mock:

- workerRuns.

No debe hacerse público.

---

## Últimas tareas cerradas

```txt
#15 feat: add lab fixture review actions
#16 feat: add lab match result actions
#17 chore: seed internal lab prediction markets
#18 feat: persist lab evaluations
```

---

## Siguiente bloque recomendado

Si docs no están sincronizados:

```txt
docs/update-project-context-after-lab-admin-flow
```

Después:

```txt
feature/public-predictions-from-db
```

Con decisión previa:

```txt
Definir qué predicciones pasan de internal_lab a public_product.
```

---

## No implementado todavía

- Supabase CLI local.
- Google Auth.
- Workers reales.
- API deportiva.
- Odds.
- LLM narrativo.
- Pagos.
- Entitlements backend.
- Paywall backend.
- Staging final.
- Public predictions DB.
- Public match detail DB.
- Transparency real.

---

## Reglas para futuras tareas

- No trabajar directo en `main`.
- Crear rama por tarea.
- Pedir reconocimiento antes de implementar.
- Mantener alcance pequeño.
- Para migraciones: revisar SQL antes de aplicar.
- Para RLS: validar policies, grants y columnas.
- No tocar `.env.local`.
- No usar service role salvo tarea explícita de backend segura.
- No mezclar pagos/LLM/odds/workers con features públicas iniciales.
