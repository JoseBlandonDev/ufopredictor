# MODEL_V01.md — Modelo predictivo v0.1

## Principio central

El modelo estadístico calcula. La IA explica.

El LLM no debe decidir resultados ni inventar probabilidades.

---

## Estado actual

Prediction Engine v0.1 Lab ya está implementado como módulo puro en:

```txt
lib/prediction-engine/
```

Model Evaluation Lab ya está implementado como módulo puro en:

```txt
lib/model-evaluation/
```

Ambos módulos tienen tests con Vitest.

---

# Estrategia pre-modelo: Lab interno

Antes de lanzar predicciones públicas del Mundial, el modelo v0.1 debe probarse en el Beta Lab.

El Lab usa:

- fixtures internos o manuales;
- competiciones `internal_lab`;
- partidos `lab_only`;
- resultados validados en `match_results`;
- predicciones `run_scope = internal_lab`;
- evaluaciones en `prediction_results`.

Objetivo: llegar al Mundial con un motor probado contra datos revisables, no improvisar cuando empiece el evento.

---

# Flujo general

```txt
Datos del partido
↓
Normalización
↓
Team Power Score
↓
Expected Goals
↓
Poisson
↓
Matriz de marcadores
↓
Mercados: 1X2, OU 2.5, BTTS, marcador probable
↓
Confidence + Risk
↓
Evaluación contra match_results
↓
Narrativa IA futura
```

---

# Variables del Team Power Score

| Variable | Peso inicial | Descripción |
|---|---:|---|
| `rating_score` | 25% | Fuerza general según Elo/ranking. |
| `recent_form_score` | 20% | Últimos 5-10 partidos. |
| `attack_score` | 15% | Capacidad ofensiva reciente. |
| `defense_score` | 15% | Solidez defensiva reciente. |
| `market_score` | 15% | Señal de cuotas, opcional inicialmente. |
| `lineup_context_score` | 10% | Alineación, bajas, sede, contexto. |

Para Lab v0.1, `market_score` y `lineup_context_score` pueden iniciar con defaults si no hay datos reales.

---

# Expected Goals

Usar `baseGoalRate`, inicialmente aproximado en 1.35 goles por equipo.

```txt
xG_A = base_goal_rate * attack_multiplier_A * defense_multiplier_B * strength_multiplier_A * context_multiplier_A
```

```txt
xG_B = base_goal_rate * attack_multiplier_B * defense_multiplier_A * strength_multiplier_B * context_multiplier_B
```

Límites:

- xG mínimo: 0.20.
- xG máximo: 3.50.

---

# Mercados iniciales

## 1X2

- Home win.
- Draw.
- Away win.

## Over/Under 2.5

- Over 2.5.
- Under 2.5.

## BTTS

- Yes.
- No.

## Marcador probable

Top 3 scores desde matriz Poisson.

---

# Output del motor

Reglas vigentes:

- El motor puede calcular internamente probabilidades en `0..1`.
- El output público/exportado usa porcentajes `0..100`.
- La API pública del barrel debe exponer `generatePrediction`, configuración versionada y tipos necesarios.
- Helpers internos como Poisson/matriz no deben exponerse como API pública si devuelven escala `0..1`.

---

# Evaluación en Lab

El módulo `lib/model-evaluation/` compara predicciones contra resultados verificados.

Métricas mínimas:

- `winner_correct`.
- `btts_correct`.
- `over_2_5_correct`.
- `exact_score_correct`.
- `goal_error`.
- `error_summary`.

## Fórmula de `goal_error`

```txt
goal_error = abs(predicted_home_goals - actual_home_goals)
           + abs(predicted_away_goals - actual_away_goals)
```

La fuente del marcador predicho es `mostLikelyScore`, no xG.

`mostLikelyScore` también es fuente única para:

- `exact_score_correct`;
- `goal_error`;
- `error_summary`.

Si `topScorelines[0]` no coincide con `mostLikelyScore`, la evaluación puede registrar warning interno, pero no debe usar `topScorelines[0]` para `exact_score_correct`.

## Resultados no verificados

Resultados con `verification_status` distinto a `verified` quedan no evaluables.

## Mercados ambiguos

Empates probabilísticos dentro de tolerancia se tratan como `ambiguous` / `not_evaluable` para evitar atribuir aciertos artificiales.

---

# No incluir todavía

- Goleadores.
- Tarjetas.
- Corners.
- Parlays.
- Apuestas directas.
- LLM como calculador.
- Odds reales obligatorias.
- Calibración avanzada.
- Workers reales.

---

# Próxima implementación recomendada

No cambiar fórmula del motor sin más datos. El siguiente bloque recomendado es operativo/admin:

```txt
feature/lab-fixture-review-actions
feature/lab-match-result-actions
feature/lab-evaluation-persistence
```

La calibración del modelo debe venir después de acumular más resultados/evaluaciones.
