# MODEL_V01.md — Modelo predictivo v0.1

## 1. Principio central

El modelo estadístico calcula. La IA explica.

No permitir que el LLM decida resultados por intuición textual. El LLM solo recibe un JSON calculado y genera narrativa clara.

---

# 2. Flujo general

```txt
Datos del partido
↓
Normalización de variables
↓
Team Power Score
↓
Expected Goals
↓
Distribución Poisson
↓
Matriz de marcadores
↓
Mercados: 1X2, OU 2.5, BTTS, marcador probable
↓
Market Blend
↓
Confidence Score + Risk Level
↓
Narrativa IA
```

---

# 3. Variables del Team Power Score

Cada variable se normaliza de 0 a 1.

| Variable | Peso | Descripción |
|---|---:|---|
| `rating_score` | 25% | Fuerza general según Elo/ranking |
| `recent_form_score` | 20% | Últimos 5-10 partidos |
| `attack_score` | 15% | Capacidad ofensiva reciente |
| `defense_score` | 15% | Solidez defensiva reciente |
| `market_score` | 15% | Señal de cuotas |
| `lineup_context_score` | 10% | Alineación, bajas, sede, contexto |

Fórmula:

```txt
Team Power Score =
0.25 * rating_score
+ 0.20 * recent_form_score
+ 0.15 * attack_score
+ 0.15 * defense_score
+ 0.15 * market_score
+ 0.10 * lineup_context_score
```

---

# 4. Expected Goals

Usar `base_goal_rate`, inicialmente aproximado en 1.35 goles por equipo por partido.

```txt
xG_A = base_goal_rate
* attack_multiplier_A
* defense_multiplier_B
* strength_multiplier_A
* context_multiplier_A
```

```txt
xG_B = base_goal_rate
* attack_multiplier_B
* defense_multiplier_A
* strength_multiplier_B
* context_multiplier_B
```

Límites:

- xG mínimo: 0.20.
- xG máximo: 3.50.

---

# 5. Multiplicadores

## Attack multiplier

```txt
attack_multiplier = 0.75 + (attack_score * 0.50)
```

## Defense multiplier

```txt
defense_multiplier = 1.25 - (defense_score * 0.50)
```

## Strength multiplier

```txt
strength_multiplier = 0.85 + (team_power_score * 0.30)
```

## Context multiplier

```txt
context_multiplier = 0.90 + (lineup_context_score * 0.20)
```

---

# 6. Poisson

Fórmula:

```txt
P(k goles) = (λ^k * e^-λ) / k!
```

Donde:

- λ = goles esperados.
- k = número de goles.

Calcular de 0 a 5 goles para cada equipo y generar matriz de marcadores.

---

# 7. Mercados

## 1X2

```txt
home_win_prob = sum(P(score_A > score_B))
draw_prob = sum(P(score_A = score_B))
away_win_prob = sum(P(score_A < score_B))
```

## Over/Under 2.5

```txt
over_2_5 = sum(P(total_goals >= 3))
under_2_5 = sum(P(total_goals <= 2))
```

## BTTS

```txt
btts_yes = sum(P(score_A >= 1 AND score_B >= 1))
btts_no = 1 - btts_yes
```

## Marcador probable

Ordenar matriz por probabilidad y tomar top 3.

---

# 8. Market Blend

Combinar modelo propio con mercado:

```txt
final_probabilities = 0.70 * model_probabilities + 0.30 * market_probabilities
```

Este peso puede ajustarse tras beta.

---

# 9. Confidence Score

Factores:

- data_quality.
- probability_gap.
- market_alignment.
- lineup_confirmed.
- model_stability.

Fórmula inicial:

```txt
confidence_score =
0.25 * data_quality
+ 0.25 * probability_gap_score
+ 0.20 * market_alignment
+ 0.20 * lineup_confirmed_score
+ 0.10 * model_stability
```

---

# 10. Risk Level

Factores:

- low_probability_gap.
- high_draw_probability.
- knockout_match.
- rotation_uncertainty.
- missing_lineups.
- odds_volatility.
- team_inconsistency.

Fórmula inicial:

```txt
risk_score =
0.25 * closeness_risk
+ 0.20 * draw_risk
+ 0.20 * odds_volatility
+ 0.15 * lineup_uncertainty
+ 0.10 * knockout_context
+ 0.10 * team_inconsistency
```

Clasificación:

- 0.00 - 0.33 = Low.
- 0.34 - 0.66 = Medium.
- 0.67 - 1.00 = High.

---

# 11. Golden Hour Delta

Cuando salen alineaciones oficiales:

```txt
delta_home = post_lineup_home_prob - pre_lineup_home_prob
delta_draw = post_lineup_draw_prob - pre_lineup_draw_prob
delta_away = post_lineup_away_prob - pre_lineup_away_prob
```

Si `abs(delta) >= 5%`, mostrar Golden Hour Delta.

---

# 12. Model vs Market

```txt
edge = model_probability - market_probability
```

Clasificación:

- 0-3% = no edge.
- 3-6% = slight edge.
- 6-10% = notable edge.
- 10%+ = strong edge.

No decir “apuesta”. Usar “posible valor detectado”.

---

# 13. JSON de salida esperado

```json
{
  "match_id": "colombia-portugal-2026",
  "model_version": "v0.1",
  "prediction_type": "pre_match_24h",
  "home_win_prob": 25,
  "draw_prob": 27,
  "away_win_prob": 48,
  "expected_home_goals": 1.05,
  "expected_away_goals": 1.48,
  "most_likely_score": "1-1",
  "top_scores": [
    {"score": "1-1", "probability": 12.2},
    {"score": "1-2", "probability": 10.8},
    {"score": "0-1", "probability": 9.7}
  ],
  "over_2_5": 49,
  "under_2_5": 51,
  "btts_yes": 53,
  "btts_no": 47,
  "confidence_score": 62,
  "risk_level": "medium"
}
```
