<!-- UFO Predictor | Status updated for Model Evaluation / Backtesting Lab -->

# NEXT_EPICS_PLAN.md — UFO Predictor

## Propósito

Definir las próximas épicas después de Data Intake Minimal. Este documento debe guiar prompts de Codex y evitar mezclar alcance.

---

# 1. Prediction Engine v0.1 Lab

**Estado:** Done. Motor puro y testeado mergeado en `main`.

## Objetivo

Crear el primer motor estadístico explicable, determinístico y testeable.

## Alcance

- `lib/prediction-engine/`.
- Normalización de inputs.
- Team Power Score.
- Expected goals.
- Poisson.
- Mercados 1X2, OU 2.5, BTTS.
- Top scores.
- Confidence/risk.
- Tests básicos.

## No-alcance

- APIs reales.
- LLM.
- Odds reales.
- Paywall.
- Workers reales.
- UI pública masiva.

## Archivos probables

- `lib/prediction-engine/`
- `types/prediction.ts`
- `docs/MODEL_V01.md`
- tests con Vitest o framework decidido.

## Validación

- Tests unitarios.
- `npm run lint`.
- `npm run build`.

---

# 2. Model Evaluation / Backtesting

**Estado:** In progress en `feature/model-evaluation-lab`.

## Objetivo

Comparar predicciones con resultados validados.

## Alcance

- Usar `match_results` como verdad del partido.
- Generar payloads compatibles con `prediction_results`, sin persistirlos en esta epica.
- Calcular métricas por mercado.
- Preparar datos para Transparency.

## No-alcance

- Backtesting masivo avanzado.
- Experimentos múltiples complejos.
- Tabla `model_evaluations` si no es estrictamente necesaria.
- Lectura o escritura real en Supabase.

## Validación

- Tests contra fixtures conocidos.
- Verificar métricas esperadas.

## Dependencia de seguridad cerrada

- `fix/lab-results-rls` ya restringe resultados `internal_lab` / `lab_only`
  para que no sean legibles por usuarios no-admin.

---

# 3. Lab Supabase Queries

## Objetivo

Mover Beta Lab de mock extendido a consultas server-side controladas.

## Alcance

- Leer `competitions`, `matches`, `prediction_versions`, `match_results`.
- Filtrar `internal_lab` y `lab_only`.
- Mantener admin-only.

## No-alcance

- CRUD completo.
- Escrituras desde UI.
- Publicar Lab en frontend público.

## Validación

- Admin puede ver datos reales.
- Free user no puede acceder.
- No se exponen datos lab públicamente.

---

# 4. Lab Admin Review Flow

## Objetivo

Permitir revisión básica de fixtures/resultados desde admin.

## Alcance

- Marcar `data_quality`.
- Registrar/actualizar `match_results`.
- Acciones server-side.
- RLS/role guard admin.

## No-alcance

- Upload CSV real.
- API real.
- Workers.

---

# 5. Public Predictions from DB

## Objetivo

Conectar `/predictions` y `/matches/[slug]` a datos de Supabase.

## Alcance

- Leer partidos públicos.
- Leer predicciones publicables.
- Mantener datos premium filtrados.

## Dependencias

- Prediction Engine.
- Paywall básico o helper de permisos.

---

# Recomendación de orden

1. Prediction Engine v0.1 Lab.
2. Model Evaluation / Backtesting.
3. Lab Supabase Queries.
4. Lab Admin Review Flow.
5. Public Predictions from DB.
