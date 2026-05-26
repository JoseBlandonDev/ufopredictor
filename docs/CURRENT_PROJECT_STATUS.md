# CURRENT_PROJECT_STATUS.md — UFO Predictor

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Estado ejecutivo

UFO Predictor ya tiene un **MVP interno de Lab para desarrolladores/admin**. No es aún MVP público/comercial.

El flujo interno funciona así:

```txt
/admin/beta-lab
  → lee fixtures internos Lab
  → permite revisión admin
  → permite crear/editar resultados reales
  → lee predicciones internas y markets persistidos
  → calcula evaluación con lib/model-evaluation
  → persiste/actualiza prediction_results
```

---

## Estado Git / PRs recientes

Mergeado en `main`:

```txt
#15 feat: add lab fixture review actions
#16 feat: add lab match result actions
#17 chore: seed internal lab prediction markets
#18 feat: persist lab evaluations
```

---

## Estado Supabase remoto

Migraciones aplicadas manualmente hasta:

```txt
0010_admin_lab_evaluation_persistence.sql
```

Migraciones relevantes recientes:

```txt
0007_admin_lab_fixture_review_actions.sql
0008_admin_lab_match_result_actions.sql
0009_seed_internal_lab_prediction_markets.sql
0010_admin_lab_evaluation_persistence.sql
```

### RLS / grants recientes

- `matches`: update admin-only para campos de revisión Lab.
- `match_results`: insert/update admin-only para resultados Lab verificados o pendientes; sin delete.
- `prediction_markets`: select admin-only para markets internos Lab.
- `prediction_results`: insert/update admin-only para evaluaciones Lab; sin delete.
- Grants de escritura limitados por columna donde aplica.

---

## Funcionalidades operativas

### App y auth

- Next.js App Router.
- Supabase remoto conectado.
- Auth email/password.
- Roles `free_user` y `admin`.
- `/dashboard` y `/admin` protegidos.
- `/admin/beta-lab` requiere admin.

### Lab Admin

`/admin/beta-lab` ya permite:

- leer fixtures Lab reales desde Supabase;
- mostrar equipos, competiciones, predicciones, model versions, resultados y evaluaciones;
- revisar fixtures:
  - `lab_status`;
  - `data_quality`;
  - `source_note`;
  - `reviewed_at`;
  - `reviewed_by`;
- crear/editar `match_results`:
  - goles local/visita;
  - `verification_status`;
  - `intake_source`;
  - `source_note`;
  - `reviewed_at`;
  - `reviewed_by`;
- leer `prediction_markets` internos Lab;
- persistir/actualizar `prediction_results` usando `lib/model-evaluation/`.

### Motor y evaluación

- `lib/prediction-engine/` existe y tiene tests.
- `lib/model-evaluation/` existe y tiene tests.
- B06c usa `evaluatePrediction()` para persistir métricas.
- La UI admin **no ejecuta Prediction Engine** ni genera nuevas predicciones.

---

## Datos actuales relevantes

- Hay fixtures Lab `lab_only`.
- Hay competiciones `internal_lab`.
- Hay `prediction_versions` internas.
- Hay `prediction_markets` mínimos para Lab:
  - `btts` yes/no;
  - `over_2_5` over/under.
- Hay `match_results` para fixtures Lab.
- Hay al menos una evaluación persistida en `prediction_results`.

---

## Sigue mock / no implementado

- `workerRuns` sigue mock.
- No hay workers reales.
- No hay API deportiva.
- No hay odds reales.
- No hay LLM real.
- No hay pagos.
- No hay Google Auth.
- No hay Supabase CLI local.
- No hay predicciones públicas desde DB.
- No hay backend de entitlements/paywall.
- No hay staging final.
- No hay Transparency real conectada a métricas.

---

## Siguiente recomendación

Después de actualizar docs, seguir con:

```txt
feature/public-predictions-from-db
```

Decisión previa necesaria:

```txt
Definir qué prediction_versions pasan de internal_lab a public_product.
```

No publicar datos Lab internos por accidente. Parece obvio, lo que significa que alguien lo rompería si no lo escribimos.
