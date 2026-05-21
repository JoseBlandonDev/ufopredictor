# DATA_DICTIONARY.md — UFO Predictor

Este diccionario de datos define las tablas tentativas del MVP. Codex debe usarlo como referencia para nombres de entidades, tipos TypeScript y mocks. Los campos pueden ajustarse más adelante cuando se creen migraciones reales.

---

# 1. Usuarios y perfiles

## `profiles`

Perfil extendido del usuario autenticado.

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | Igual al id de Supabase Auth user |
| `email` | text | Email principal |
| `full_name` | text | Nombre del usuario |
| `avatar_url` | text | Avatar opcional |
| `country` | text | País |
| `preferred_language` | text | `es`, `en`, etc. |
| `role` | text | `free_user`, `premium_user`, `admin` |
| `created_at` | timestamptz | Fecha creación |
| `updated_at` | timestamptz | Última actualización |

---

# 2. Planes y acceso

## `plans`

Planes configurables.

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID del plan |
| `name` | text | Nombre visible |
| `slug` | text | Slug único |
| `description` | text | Descripción |
| `price` | numeric | Precio |
| `currency` | text | USD, COP, EUR |
| `billing_type` | text | `free`, `one_time`, `monthly`, `custom_pack` |
| `is_active` | boolean | Si está activo |
| `starts_at` | timestamptz | Inicio de disponibilidad |
| `ends_at` | timestamptz | Fin de disponibilidad |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Actualización |

## `plan_features`

Features asociadas a planes.

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `plan_id` | uuid | FK a plans |
| `feature_key` | text | Ej. `golden_hour_delta` |
| `feature_value` | jsonb | Valor flexible |
| `created_at` | timestamptz | Creación |

Ejemplos de `feature_key`:

- `advanced_predictions`
- `expected_score`
- `top_scores`
- `model_vs_market`
- `golden_hour_delta`
- `prediction_timeline`
- `premium_alerts`
- `matches_limit`
- `competition_scope`
- `stage_scope`
- `team_scope`

## `subscriptions`

Suscripciones o compras activas.

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `user_id` | uuid | Usuario |
| `plan_id` | uuid | Plan comprado |
| `status` | text | `active`, `expired`, `cancelled`, `pending` |
| `starts_at` | timestamptz | Inicio |
| `ends_at` | timestamptz | Fin |
| `payment_provider` | text | Stripe, PayPal, Mercado Pago |
| `provider_customer_id` | text | ID cliente externo |
| `provider_subscription_id` | text | ID suscripción externa |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Actualización |

## `user_entitlements`

Permisos granulares derivados de planes o compras.

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `user_id` | uuid | Usuario |
| `entitlement_type` | text | `full_access`, `match_pack`, `stage_access`, etc. |
| `resource_type` | text | `competition`, `match`, `stage`, `team` |
| `resource_id` | text/uuid | ID del recurso |
| `quantity` | integer | Cantidad disponible, si aplica |
| `starts_at` | timestamptz | Inicio |
| `ends_at` | timestamptz | Fin |
| `source_plan_id` | uuid | Plan origen |
| `created_at` | timestamptz | Creación |

## `user_match_unlocks`

Partidos desbloqueados por el usuario, útil para packs de 10 partidos.

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `user_id` | uuid | Usuario |
| `match_id` | uuid | Partido desbloqueado |
| `source_plan_id` | uuid | Plan que permitió el unlock |
| `unlocked_at` | timestamptz | Fecha desbloqueo |
| `expires_at` | timestamptz | Fecha expiración |

---

# 3. Fútbol

## `competitions`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `external_id` | text | ID proveedor externo |
| `name` | text | Nombre |
| `slug` | text | Slug |
| `country` | text | País |
| `type` | text | `international`, `league`, `cup` |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Actualización |

## `seasons`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `competition_id` | uuid | Competición |
| `name` | text | Temporada |
| `year` | integer | Año |
| `starts_at` | date | Inicio |
| `ends_at` | date | Fin |

## `teams`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `external_id` | text | ID proveedor |
| `name` | text | Nombre |
| `slug` | text | Slug |
| `country` | text | País |
| `logo_url` | text | Logo |
| `flag_url` | text | Bandera |
| `fifa_rank` | integer | Ranking FIFA si aplica |
| `elo_rating` | numeric | Elo si aplica |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Actualización |

## `players`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `external_id` | text | ID proveedor |
| `team_id` | uuid | Equipo actual |
| `name` | text | Nombre |
| `position` | text | Posición |
| `is_key_player` | boolean | Si es jugador clave |
| `created_at` | timestamptz | Creación |

## `venues`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `external_id` | text | ID proveedor |
| `name` | text | Estadio |
| `city` | text | Ciudad |
| `country` | text | País |
| `capacity` | integer | Capacidad |

## `matches`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `external_id` | text | ID proveedor |
| `competition_id` | uuid | Competición |
| `season_id` | uuid | Temporada |
| `home_team_id` | uuid | Equipo local/equipo A |
| `away_team_id` | uuid | Equipo visitante/equipo B |
| `venue_id` | uuid | Sede |
| `kickoff_at` | timestamptz | Fecha/hora |
| `stage` | text | Grupo, octavos, etc. |
| `status` | text | `scheduled`, `live`, `finished`, etc. |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Actualización |

## `team_form_snapshots`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `team_id` | uuid | Equipo |
| `snapshot_date` | date | Fecha snapshot |
| `last_matches_count` | integer | Cantidad de partidos |
| `wins` | integer | Victorias |
| `draws` | integer | Empates |
| `losses` | integer | Derrotas |
| `goals_for` | integer | Goles a favor |
| `goals_against` | integer | Goles en contra |
| `form_score` | numeric | Score normalizado |

## `lineups`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `match_id` | uuid | Partido |
| `team_id` | uuid | Equipo |
| `is_confirmed` | boolean | Confirmada o probable |
| `formation` | text | Formación |
| `players_json` | jsonb | Titulares/suplentes |
| `captured_at` | timestamptz | Fecha captura |
| `source` | text | Proveedor |

## `odds_snapshots`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `match_id` | uuid | Partido |
| `bookmaker` | text | Casa/proveedor |
| `market` | text | `1x2`, `over_under`, etc. |
| `selection` | text | Local, empate, visitante, over, under |
| `odds_decimal` | numeric | Cuota decimal |
| `implied_probability` | numeric | Probabilidad implícita normalizada |
| `captured_at` | timestamptz | Captura |
| `source` | text | Fuente |

---

# 4. Predicciones

## `model_versions`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `version` | text | Ej. `v0.1` |
| `description` | text | Cambios |
| `weights_json` | jsonb | Pesos del modelo |
| `is_active` | boolean | Activa |
| `created_at` | timestamptz | Creación |

## `prediction_versions`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `match_id` | uuid | Partido |
| `model_version_id` | uuid | Versión del modelo |
| `prediction_type` | text | `pre_match_24h`, `pre_match_6h`, `post_lineup`, `pre_kickoff` |
| `home_win_prob` | numeric | Probabilidad equipo A |
| `draw_prob` | numeric | Probabilidad empate |
| `away_win_prob` | numeric | Probabilidad equipo B |
| `expected_home_goals` | numeric | xG equipo A |
| `expected_away_goals` | numeric | xG equipo B |
| `most_likely_score` | text | Ej. `1-1` |
| `top_scores_json` | jsonb | Top marcadores |
| `confidence_score` | numeric | 0-100 |
| `risk_level` | text | `low`, `medium`, `high` |
| `created_at` | timestamptz | Creación |

## `prediction_markets`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `prediction_version_id` | uuid | Predicción |
| `market` | text | `match_winner`, `over_2_5`, `btts`, `exact_score` |
| `selection` | text | Selección |
| `probability` | numeric | Probabilidad |
| `confidence` | numeric | Confianza |
| `is_premium` | boolean | Premium o free |
| `created_at` | timestamptz | Creación |

## `prediction_narratives`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `prediction_version_id` | uuid | Predicción |
| `locale` | text | `es`, `en` |
| `free_summary` | text | Resumen free |
| `premium_analysis` | text | Análisis premium |
| `why_it_changed` | text | Explicación de cambios |
| `risk_notes` | text | Notas de riesgo |
| `created_at` | timestamptz | Creación |

## `prediction_results`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `prediction_version_id` | uuid | Predicción validada |
| `actual_home_goals` | integer | Goles equipo A |
| `actual_away_goals` | integer | Goles equipo B |
| `winner_correct` | boolean | Acertó ganador |
| `btts_correct` | boolean | Acertó BTTS |
| `over_2_5_correct` | boolean | Acertó OU 2.5 |
| `exact_score_correct` | boolean | Acertó marcador exacto |
| `goal_error` | numeric | Error absoluto goles |
| `error_summary` | text | Resumen error |
| `validated_at` | timestamptz | Validación |

---

# 5. Operación y emails

## `worker_runs`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `worker_name` | text | Nombre worker |
| `status` | text | `running`, `success`, `failed` |
| `started_at` | timestamptz | Inicio |
| `finished_at` | timestamptz | Fin |
| `records_processed` | integer | Registros |
| `error_message` | text | Error |
| `metadata_json` | jsonb | Metadata |
| `created_at` | timestamptz | Creación |

## `email_events`

| Campo | Tipo sugerido | Descripción |
|---|---|---|
| `id` | uuid | ID |
| `user_id` | uuid | Usuario opcional |
| `email` | text | Destinatario |
| `type` | text | Tipo de email |
| `status` | text | `queued`, `sent`, `failed` |
| `provider_message_id` | text | ID Resend |
| `metadata_json` | jsonb | Metadata |
| `sent_at` | timestamptz | Enviado |
| `created_at` | timestamptz | Creado |
| `error_message` | text | Error |
