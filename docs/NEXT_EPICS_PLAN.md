# NEXT_EPICS_PLAN.md — UFO Predictor

## Propósito

Definir las próximas épicas después de Lab Supabase Queries. Este documento guía prompts de Codex y evita mezclar alcances.

---

## Estado actual

Ya están cerradas:

- Beta Lab Foundation.
- Data Intake Minimal.
- Prediction Engine v0.1 Lab.
- Restrict Lab Match Results RLS.
- Model Evaluation / Backtesting Lab.
- Lab Supabase Queries.

`/admin/beta-lab` ya lee datos reales desde Supabase para fixtures, predicciones, resultados y evaluaciones. Worker runs siguen mock.

---

# 1. Lab Fixture Review Actions

## Rama sugerida

```txt
feature/lab-fixture-review-actions
```

## Objetivo

Permitir que un admin revise fixtures Lab desde `/admin/beta-lab`, sin CRUD completo y sin editar resultados todavía.

## Alcance

- Mantener `requireAdmin`.
- Implementar server actions o route handlers seguros.
- Actualizar en `matches`:
  - `lab_status`;
  - `data_quality`;
  - `source_note`;
  - `reviewed_at`;
  - `reviewed_by`.
- Agregar policies RLS update admin-only si hace falta.
- Refrescar la página después de acciones.
- Mantener filtros `internal_lab` / `lab_only`.

## No-alcance

- Crear/editar `match_results`.
- Ejecutar motor predictivo.
- Persistir evaluaciones.
- Workers reales.
- API deportiva.
- Odds.
- LLM.
- Pagos.
- Google Auth.

---

# 2. Lab Match Result Actions

## Rama sugerida

```txt
feature/lab-match-result-actions
```

## Objetivo

Permitir crear o editar resultados reales de fixtures Lab desde admin.

## Alcance

- Crear/actualizar `match_results`.
- Validar `home_goals` y `away_goals`.
- Manejar `verification_status`.
- Registrar `reviewed_at` y `reviewed_by`.
- Mantener admin-only.
- Mantener RLS.

## No-alcance

- Backtesting masivo.
- Workers.
- API deportiva.
- Evaluación automática si no se decide incluir.

---

# 3. Lab Evaluation Persistence Flow

## Rama sugerida

```txt
feature/lab-evaluation-persistence
```

## Objetivo

Persistir evaluaciones calculadas por `lib/model-evaluation/` en `prediction_results`.

## Alcance

- Tomar `prediction_version` y `match_result`.
- Usar `lib/model-evaluation/`.
- Crear/actualizar `prediction_results`.
- Mantener admin-only o flujo server-side controlado.
- Agregar tests para payloads y edge cases.

## No-alcance

- Workers reales.
- Backtesting avanzado.
- API deportiva.
- Odds.
- LLM.

---

# 4. Google Auth

## Rama sugerida

```txt
feature/google-auth
```

## Estado

En radar, no urgente.

## Objetivo

Reducir fricción de registro/login usando Supabase OAuth con Google.

## Alcance futuro

- Configurar Google Provider en Supabase.
- Botón “Continuar con Google”.
- Validar callback.
- Confirmar creación de profile.
- Rol inicial `free_user`.
- Mantener asignación admin controlada/manual.

---

# 5. Supabase CLI Local Setup

## Rama sugerida

```txt
feature/supabase-cli-local-setup
```

## Estado

En radar. No urgente.

## Objetivo

Mejorar flujo de migraciones y validación local.

## Notas

- Puede requerir Docker.
- Puede consumir espacio local.
- Hasta nueva decisión, migraciones se siguen aplicando manualmente en Supabase SQL Editor.

---

# 6. Public Predictions from DB

## Rama futura

```txt
feature/public-predictions-from-db
```

## Objetivo

Conectar `/predictions` y `/matches/[slug]` a datos reales desde Supabase.

## Dependencias

- Lab más maduro.
- Paywall/permissions helper o estrategia de filtrado.
- Predicciones publicables.

---

## Orden recomendado

1. `feature/lab-fixture-review-actions`.
2. `feature/lab-match-result-actions`.
3. `feature/lab-evaluation-persistence`.
4. `feature/google-auth` o `feature/supabase-cli-local-setup`, según prioridad operativa.
5. `feature/public-predictions-from-db`.
