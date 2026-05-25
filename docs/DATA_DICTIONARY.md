<!-- UFO Predictor | Updated roadmap after Beta Lab + Data Intake -->
<!-- Status assumes feature/data-intake-minimal has been committed, pushed, PR'd and merged before the team meeting. -->

# DATA_DICTIONARY.md — UFO Predictor

## Propósito

Diccionario de datos operativo para MVP, Lab interno y futuras integraciones.

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

### Diferencia clave

- `match_results` representa el resultado real/validado del partido.
- `prediction_results` representa la evaluación de una predicción contra ese resultado.

No mezclar ambas responsabilidades.

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

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | ID. |
| `worker_name` | text | Nombre. |
| `status` | text | `running`, `success`, `failed`. |
| `started_at` | timestamptz | Inicio. |
| `finished_at` | timestamptz | Fin. |
| `records_processed` | integer | Registros. |
| `error_message` | text | Error. |
| `metadata_json` | jsonb | Metadata. |
| `created_at` | timestamptz | Creación. |
