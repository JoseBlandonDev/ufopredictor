# DATA_DICTIONARY.md — UFO Predictor

## Propósito

Diccionario de datos operativo para MVP, Lab interno y futuras integraciones.

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente:

> El modelo estadístico calcula. La IA explica.

---

# Usuarios

## `profiles`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Igual al id de Supabase Auth user. |
| `email` | text | Email principal. |
| `full_name` | text | Nombre opcional. |
| `avatar_url` | text | Avatar opcional. |
| `country` | text | País. |
| `preferred_language` | text | Idioma preferido. |
| `role` | text | `free_user`, `premium_user`, `admin`. |
| `created_at` | timestamptz | Creación. |
| `updated_at` | timestamptz | Actualización. |

---

# Competiciones y partidos

## `competitions`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | ID. |
| `external_id` | text | ID proveedor externo. |
| `name` | text | Nombre. |
| `slug` | text | Slug. |
| `country` | text | País. |
| `type` | text | `international`, `league`, `cup`, etc. |
| `usage_scope` | text | `public_product` o `internal_lab`. |
| `created_at` | timestamptz | Creación. |
| `updated_at` | timestamptz | Actualización. |

### Uso

- `public_product`: competición visible o pensada para producto principal.
- `internal_lab`: competición usada solo para laboratorio interno pre-Mundial.

## `matches`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | ID. |
| `external_id` | text | ID proveedor externo. |
| `competition_id` | uuid | FK a competitions. |
| `season_id` | uuid | FK a seasons. |
| `home_team_id` | uuid | Equipo local. |
| `away_team_id` | uuid | Equipo visitante. |
| `venue_id` | uuid | Sede. |
| `kickoff_at` | timestamptz | Fecha/hora. |
| `stage` | text | Fase. |
| `status` | text | `scheduled`, `live`, `finished`, etc. |
| `access_scope` | text | `public`, `premium`, `admin_only`, `lab_only`. |
| `lab_status` | text | `candidate`, `ready`, `review`, `needs_data`, `archived`. Solo si `access_scope = lab_only`. |
| `intake_source` | text | `mock`, `manual`, `csv_import`. |
| `data_quality` | text | `unreviewed`, `reviewed`, `verified`, `rejected`. |
| `source_note` | text | Nota de procedencia. |
| `reviewed_at` | timestamptz | Fecha de revisión. |
| `reviewed_by` | uuid | Usuario que revisó. |
| `created_at` | timestamptz | Creación. |
| `updated_at` | timestamptz | Actualización. |

### Uso admin actual

Desde `/admin/beta-lab`, un admin puede actualizar campos de revisión Lab:

- `lab_status`;
- `data_quality`;
- `source_note`;
- `reviewed_at`;
- `reviewed_by`.

RLS/grants limitan esta escritura a fixtures `lab_only` asociados a competiciones `internal_lab`.

---

# Resultados reales

## `match_results`

Fuente validada del marcador real de un partido.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | ID. |
| `match_id` | uuid | FK única a `matches`. |
| `home_goals` | integer | Goles local. |
| `away_goals` | integer | Goles visitante. |
| `verification_status` | text | `pending_review`, `verified`, `rejected`. |
| `intake_source` | text | `mock`, `manual`, `csv_import`. |
| `source_note` | text | Nota de procedencia. |
| `reviewed_at` | timestamptz | Fecha de revisión. |
| `reviewed_by` | uuid | Usuario admin/revisor. |
| `recorded_at` | timestamptz | Fecha de registro. |

### Uso admin actual

Desde `/admin/beta-lab`, un admin puede crear o editar `match_results` para fixtures Lab.

Reglas:

- insert/update admin-only;
- sin delete para `anon` ni `authenticated`;
- limitado a partidos `lab_only` en competiciones `internal_lab`;
- `reviewed_at` y `reviewed_by` se setean server-side.

### Diferencia clave

- `match_results` representa el resultado real/validado del partido.
- `prediction_results` representa la evaluación de una predicción contra ese resultado.

No mezclar ambas responsabilidades. Parece obvio, por eso lo escribimos dos veces en espíritu.

---

# Predicciones

## `model_versions`

Versiona el modelo estadístico.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | ID. |
| `version` | text | Ej. `v0.1`. |
| `description` | text | Descripción. |
| `weights_json` | jsonb | Pesos/configuración. |
| `is_active` | boolean | Activa. |
| `created_at` | timestamptz | Creación. |

## `prediction_versions`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | ID. |
| `match_id` | uuid | Partido. |
| `model_version_id` | uuid | Versión del modelo. |
| `prediction_type` | text | `pre_match_24h`, `pre_match_6h`, `post_lineup`, `pre_kickoff`. |
| `run_scope` | text | `public_product` o `internal_lab`. |
| `home_win_prob` | numeric | Probabilidad local. |
| `draw_prob` | numeric | Probabilidad empate. |
| `away_win_prob` | numeric | Probabilidad visitante. |
| `expected_home_goals` | numeric | xG local. |
| `expected_away_goals` | numeric | xG visitante. |
| `most_likely_score` | text | Marcador probable. |
| `top_scores_json` | jsonb | Top marcadores. |
| `confidence_score` | numeric | 0-100. |
| `risk_level` | text | `low`, `medium`, `high`. |
| `created_at` | timestamptz | Creación. |

### Uso actual

- Predicciones internas usan `run_scope = internal_lab`.
- Predicciones públicas futuras deberán usar `run_scope = public_product` o criterio equivalente decidido en C01.

## `prediction_markets`

Mercados asociados a una versión de predicción.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | ID. |
| `prediction_version_id` | uuid | FK a `prediction_versions`. |
| `market` | text | Mercado. Ej. `match_winner`, `btts`, `over_2_5`, `exact_score`. |
| `selection` | text | Selección del mercado. Ej. `yes`, `no`, `over`, `under`, equipo, marcador. |
| `probability` | numeric | Probabilidad en escala 0-100. |
| `confidence` | numeric | Confianza 0-100. |
| `is_premium` | boolean | Si debe considerarse premium. |
| `created_at` | timestamptz | Creación. |

### Uso Lab actual

Para predicciones internas Lab existen mercados mínimos:

- `btts` + `yes`;
- `btts` + `no`;
- `over_2_5` + `over`;
- `over_2_5` + `under`.

La migración `0009_seed_internal_lab_prediction_markets.sql` hace backfill/seed de esos markets.

La migración `0010_admin_lab_evaluation_persistence.sql` agrega lectura admin-only de markets internos Lab.

## `prediction_results`

Evaluación de una predicción contra un resultado real/validado.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | ID. |
| `prediction_version_id` | uuid | Predicción evaluada. |
| `actual_home_goals` | integer | Goles reales local. |
| `actual_away_goals` | integer | Goles reales visitante. |
| `winner_correct` | boolean | Acierto 1X2. |
| `btts_correct` | boolean | Acierto BTTS. |
| `over_2_5_correct` | boolean | Acierto OU 2.5. |
| `exact_score_correct` | boolean | Acierto marcador exacto. |
| `goal_error` | numeric | Error absoluto goles. |
| `error_summary` | text | Resumen. |
| `validated_at` | timestamptz | Fecha validación. |

### Evaluación actual

La lógica pura existe en `lib/model-evaluation/`.

B06c ya permite persistir/actualizar `prediction_results` desde `/admin/beta-lab`.

Reglas:

- Se evalúan solo resultados verificados.
- Se requiere predicción interna Lab.
- Se requieren mercados completos BTTS y OU 2.5.
- La Server Action acepta solo `predictionVersionId`.
- Las métricas se calculan server-side con `evaluatePrediction()`.
- Insert/update admin-only.
- Sin delete.
- `prediction_version_id` no es actualizable en update.

---

# Planes y acceso

Tablas principales:

- `plans`
- `plan_features`
- `subscriptions`
- `user_entitlements`
- `user_match_unlocks`

Pendiente: implementar backend real de paywall y entitlements.

---

# Operación

## `worker_runs`

Registra ejecuciones de workers presentes o futuros.

Actualmente, worker runs visibles en UI siguen mock. Workers reales no están implementados.

---

# RLS Lab actual

Migraciones relevantes:

- `0005_restrict_lab_match_results_rls.sql`: restringe lectura no-admin de resultados Lab.
- `0006_admin_lab_read_policies.sql`: habilita lecturas admin-only para datos Lab necesarios en `/admin/beta-lab`.
- `0007_admin_lab_fixture_review_actions.sql`: habilita update admin-only de campos de revisión de `matches`.
- `0008_admin_lab_match_result_actions.sql`: habilita insert/update admin-only de `match_results`, sin delete.
- `0009_seed_internal_lab_prediction_markets.sql`: seed/backfill de mercados internos mínimos.
- `0010_admin_lab_evaluation_persistence.sql`: habilita lectura admin-only de `prediction_markets` y persistencia admin-only de `prediction_results`, sin delete.

Regla vigente:

- Datos `lab_only` / `internal_lab` son internos/admin.
- No exponer Lab en rutas públicas.
- Datos premium deben filtrarse desde backend.
