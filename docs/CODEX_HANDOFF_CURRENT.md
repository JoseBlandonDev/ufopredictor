# CODEX_HANDOFF_CURRENT.md — UFO Predictor

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Contexto operativo

Antes de cualquier tarea:

```bash
git status
git branch
git pull origin main
```

Debe trabajarse desde `main` limpio y actualizado, creando una rama específica.

No tocar `.env.local`. No usar service role en flujos UI/server actions normales.

---

## Estado actual en `main`

`main` incluye hasta:

```txt
#18 feat: persist lab evaluations
```

PRs recientes cerrados:

```txt
#15 feat: add lab fixture review actions
#16 feat: add lab match result actions
#17 chore: seed internal lab prediction markets
#18 feat: persist lab evaluations
```

Supabase remoto tiene migraciones aplicadas manualmente hasta:

```txt
0010_admin_lab_evaluation_persistence.sql
```

---

## Qué ya existe

### Lab Admin Flow

`/admin/beta-lab` permite:

- revisar fixtures Lab;
- crear/editar `match_results`;
- leer `prediction_markets` internos;
- persistir/actualizar `prediction_results`;
- ver estados de readiness:
  - resultado verificado;
  - markets completos;
  - evaluación persistida.

### Seguridad/RLS reciente

- `0007`: update admin-only para campos de revisión de `matches` Lab.
- `0008`: insert/update admin-only para `match_results` Lab, sin delete.
- `0009`: seed/backfill de markets internos mínimos.
- `0010`: select admin-only para `prediction_markets`; insert/update admin-only para `prediction_results`, sin delete.

### Motor/evaluación

- `lib/prediction-engine/` existe.
- `lib/model-evaluation/` existe.
- B06c usa `evaluatePrediction()`.
- La UI admin no ejecuta Prediction Engine.

---

## Qué no existe todavía

- Predicciones públicas desde DB.
- Public match detail desde DB.
- Paywall backend.
- Entitlements reales.
- Workers reales.
- API deportiva.
- Odds.
- LLM real.
- Pagos.
- Google Auth.
- Supabase CLI local.
- Staging final.

---

## Próxima tarea recomendada

### Si la documentación aún no está actualizada

Rama:

```bash
docs/update-project-context-after-lab-admin-flow
```

Solo docs. No código. No migraciones.

### Si docs ya están sincronizados

Rama recomendada:

```bash
feature/public-predictions-from-db
```

Primero hacer reconocimiento. No implementar directo.

Objetivo: conectar superficies públicas a predicciones reales publicables.

Decisión previa:

```txt
Definir criterio internal_lab → public_product.
```

---

## Prompt corto para próxima feature técnica

```txt
Quiero iniciar feature/public-predictions-from-db.
Primero solo haz reconocimiento técnico y plan. No modifiques archivos.
Antes de cualquier cambio ejecuta git branch y git status.
Debo estar en main limpio.
Revisa cómo separar internal_lab de public_product y propón alcance mínimo para conectar /predictions a datos reales sin exponer Lab ni premium.
No implementes paywall, pagos, odds, LLM, workers ni Prediction Engine.
```

---

## Validaciones estándar

Para cada rama:

```bash
npm run test
npm run lint
npm run build
git status
```

Si `next-env.d.ts` cambia por build y no corresponde:

```bash
git restore next-env.d.ts
```

Para migraciones Supabase:

- aplicar manualmente en SQL Editor si no hay CLI local;
- verificar `pg_policies`;
- verificar `information_schema.column_privileges`;
- probar UI;
- solo después commit/push/PR.
