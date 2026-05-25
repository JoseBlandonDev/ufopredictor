<!-- UFO Predictor | Prediction Engine v0.1 Lab implemented -->

# MODEL_V01.md - Modelo predictivo v0.1 Lab

## Principio central

El modelo estadistico calcula. La IA explica.

Prediction Engine v0.1 Lab es un modulo TypeScript puro y deterministico. No
consulta Supabase, no escribe predicciones, no consume APIs, odds reales ni
LLM.

---

## Implementacion actual

El motor vive en `lib/prediction-engine/` y expone `generatePrediction(input)`.
Recibe dos equipos y contexto minimo, normaliza las senales disponibles y
produce:

- probabilidades `1X2`;
- probabilidades `BTTS`;
- probabilidades `Over/Under 2.5`;
- tres marcadores mas probables y `mostLikelyScore`;
- goles esperados para local y visitante;
- `confidence`, `risk`, `factors` y `notes`;
- proyecciones compatibles conceptualmente con `prediction_versions` y
  `prediction_markets`, sin persistirlas.

Los calculos probabilisticos internos usan escala `0..1`. El output exportado
usa porcentajes `0..100`, compatible con los contratos actuales de base de
datos.

---

## Inputs y defaults

Cada equipo puede entregar las siguientes senales en escala `0..100`:

| Senal | Peso inicial | Default si falta |
|---|---:|---:|
| `ratingScore` | 25% | 50 |
| `recentFormScore` | 20% | 50 |
| `attackScore` | 15% | 50 |
| `defenseScore` | 15% | 50 |
| `marketScore` | 15% | 50 |
| `lineupContextScore` | 10% | 50 |

Valores no finitos se sustituyen por `50`; valores fuera del rango se acotan
a `0..100`. `marketScore = 50` es una senal neutral: no implica consumo de
odds reales.

Contexto:

- `runScope` default: `internal_lab`.
- `predictionType` default: `pre_match_24h`.
- `neutralVenue = true` fuerza contexto local neutral (`50`).
- `homeAdvantageScore` default: `55` si no es sede neutral.

---

## Team Power Score

El power score de cada equipo es un promedio ponderado:

```txt
power = ratingScore * 0.25
      + recentFormScore * 0.20
      + attackScore * 0.15
      + defenseScore * 0.15
      + marketScore * 0.15
      + lineupContextScore * 0.10
```

La configuracion queda versionada como `modelVersion = "v0.1-lab"` en
`config.ts`.

---

## Expected Goals

Configuracion inicial:

```txt
baseGoalRate = 1.35
minExpectedGoals = 0.20
maxExpectedGoals = 3.50
```

Formula implementada para cada lado:

```txt
xG = baseGoalRate
   * attackMultiplier
   * opponentDefenseMultiplier
   * strengthMultiplier
   * venueContextMultiplier
```

Multiplicadores:

```txt
attackMultiplier = 1 + ((attackScore - 50) / 50) * 0.35
opponentDefenseMultiplier = 1 + ((50 - opponentDefenseScore) / 50) * 0.30
strengthMultiplier = clamp(1 + ((power - opponentPower) / 100) * 0.55, 0.65, 1.35)
venueContextMultiplier = 1 + ((contextScore - 50) / 50) * 0.12
```

El resultado final siempre se acota a `0.20..3.50`.

---

## Poisson y mercados

El motor calcula probabilidades Poisson de `0` a `10` goles por equipo,
construye una matriz de marcadores y normaliza la masa cubierta por esa
matriz.

Desde ella deriva:

- `1X2`: local, empate y visitante.
- `BTTS`: si/no.
- `Over/Under 2.5`: over/under.
- `topScorelines`: los tres marcadores con mayor probabilidad.
- `mostLikelyScore`: primer elemento de `topScorelines`.

---

## Confidence, risk y explicabilidad

`confidence` combina cobertura de datos y separacion entre los dos resultados
`1X2` mas probables:

```txt
confidence = clamp(
  40 + dataCompleteness * 30 + min(outcomeMargin, 35) * 0.70,
  0,
  100
)
```

`risk` se clasifica asi:

- `high`: `confidence < 60` o margen `1X2 < 8`.
- `low`: `confidence >= 75` y margen `1X2 >= 15`.
- `medium`: cualquier caso intermedio.

El output incluye factores deterministas sobre diferencias principales de
senales, power score y xG, junto con notas cuando se utilizaron defaults.

---

## Tests implementados

Los fixtures sinteticos Lab y las pruebas Vitest cubren:

- ausencia de `NaN` o infinitos;
- suma aproximada de `1X2 = 100`;
- probabilidades dentro de `0..100`;
- orden descendente de top scorelines;
- determinismo para inputs identicos;
- limites de xG;
- defaults seguros con datos incompletos;
- mayor probabilidad de victoria para un equipo claramente superior;
- proyeccion conceptual para persistencia futura.

---

## Model Evaluation / Backtesting Lab

La capa pura `lib/model-evaluation/` evalua el output del motor contra un
resultado validado, sin consultar ni escribir Supabase.

Reglas implementadas:

- solo resultados con estado `verified` son evaluables;
- mercados probabilisticos con diferencia entre lideres menor o igual a
  `0.01` puntos porcentuales quedan ambiguos y su acierto se representa como
  `null`;
- `mostLikelyScore` es la fuente unica para acierto de marcador exacto y
  `goal_error`; una discrepancia con el primer `topScorelines` genera warning;
- `goal_error` usa `mostLikelyScore`:
  `abs(predicted_home - actual_home) + abs(predicted_away - actual_away)`;
- el payload generado es compatible conceptualmente con `prediction_results`;
- la agregacion calcula accuracies por mercado y error de goles promedio,
  excluyendo valores ambiguos del denominador del mercado correspondiente.

---

## No incluido en estas epicas de logica pura

- persistencia o lectura en Supabase;
- ejecucion automatica contra filas reales de `match_results`;
- integracion UI o Beta Lab;
- workers;
- APIs deportivas;
- odds reales;
- narrativas LLM;
- pagos, permisos o cambios RLS.
