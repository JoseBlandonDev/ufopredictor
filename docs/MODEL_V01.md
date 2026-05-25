<!-- UFO Predictor | Updated roadmap after Beta Lab + Data Intake -->
<!-- Status assumes feature/data-intake-minimal has been committed, pushed, PR'd and merged before the team meeting. -->

# MODEL_V01.md — Modelo predictivo v0.1

## Principio central

El modelo estadístico calcula. La IA explica.

El LLM no debe decidir resultados ni inventar probabilidades.

---

# Estrategia pre-modelo: Lab interno

Antes de lanzar predicciones públicas del Mundial, el modelo v0.1 debe probarse en el Beta Lab.

El Lab usará:

- fixtures internos o manuales,
- competiciones `internal_lab`,
- partidos `lab_only`,
- resultados validados en `match_results`,
- predicciones `run_scope = internal_lab`.

Objetivo: llegar al Mundial con un motor ya probado contra datos revisables, no improvisar cuando empiece el evento.

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

Usar `base_goal_rate`, inicialmente aproximado en 1.35 goles por equipo.

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

# Evaluación en Lab

El motor v0.1 debe guardar predicciones antes del partido y luego evaluarlas contra `match_results`.

Métricas mínimas:

- `winner_correct`.
- `btts_correct`.
- `over_2_5_correct`.
- `exact_score_correct`.
- `goal_error`.

---

# No incluir todavía

- Goleadores.
- Tarjetas.
- Corners.
- Parlays.
- Apuestas directas.
- LLM como calculador.
- Odds reales obligatorias.

---

# Próxima implementación recomendada

```txt
feature/prediction-engine-v01
```

Debe empezar como código puro con tests, usando datos del Lab/mock y sin depender de APIs reales.
