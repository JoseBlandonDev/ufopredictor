# NEXT_EPICS_PLAN.md — UFO Predictor

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Estado base para este plan

B06a, B06b, B06-pre y B06c ya están cerradas.

Ya existe flujo admin Lab completo:

```txt
revisar fixture → guardar resultado → persistir evaluación
```

Por tanto, **no volver a planear Lab Fixture Review, Lab Match Result Actions ni Lab Evaluation Persistence como pendientes**.

---

## Siguiente paso inmediato

### DOCS01 — `docs/update-project-context-after-lab-admin-flow`

Objetivo: sincronizar documentación oficial tras PR #15-#18.

Archivos principales a actualizar:

- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CURRENT_PROJECT_STATUS.md`
- `CODEX_HANDOFF_CURRENT.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `EPIC_PROGRESS_MATRIX.md`
- `NEXT_EPICS_PLAN.md`
- `ROADMAP_AND_BACKLOG.md`
- `DOCS_AND_SOURCES_INVENTORY.md`
- `OPEN_DECISIONS.md`

No tocar código ni migraciones.

---

## Siguiente feature técnica recomendada

### C01 — `feature/public-predictions-from-db`

Objetivo: conectar `/predictions` a datos reales publicables desde Supabase.

#### Decisión previa obligatoria

Definir criterio para que una predicción pase de:

```txt
internal_lab → public_product
```

Opciones posibles:

1. Agregar/usar campo de scope existente en `prediction_versions`.
2. Crear flujo admin de publicación.
3. Seed controlado de predicciones publicables para MVP.
4. Empezar con read-only de predicciones ya marcadas como `public_product`.

#### Alcance recomendado C01

- Leer solo predicciones publicables.
- Mantener Lab aislado.
- No mostrar datos premium sin backend gating.
- No crear paywall falso solo frontend.
- No ejecutar Prediction Engine.
- No llamar LLM.
- No workers.

#### Archivos probables

- `app/predictions/page.tsx`
- `app/matches/[slug]/page.tsx` si entra en alcance
- `lib/supabase/public-queries.ts` o equivalente
- `types/database.ts`
- posible migración si falta scope/policy pública

---

## Después de C01

### C02 — `feature/plans-entitlements-backend`

Objetivo: establecer backend real para acceso free/premium/admin.

Debe definir:

- usuario free;
- usuario premium;
- admin;
- qué campos se pueden servir a cada rol;
- cómo se representan entitlements.

No requiere pagos al inicio.

### C03 — `feature/paywall-enforcement`

Objetivo: asegurar que datos premium no viajen al cliente sin permiso.

No basta esconder UI. El servidor debe filtrar.

### C04 — `feature/transparency-real-v01`

Objetivo: usar `prediction_results` para mostrar métricas reales agregadas.

Alcance mínimo:

- métricas Lab o publicables;
- win accuracy;
- BTTS accuracy;
- OU 2.5 accuracy;
- exact score rate;
- goal error promedio.

### C06 — `feature/staging-deploy`

Objetivo: ambiente estable para QA.

---

## Later

- Supabase CLI local.
- Google Auth.
- API deportiva.
- Odds.
- Workers reales.
- LLM narrative.
- Pagos.

---

## Regla de alcance

El Lab interno no debe volverse público por accidente. El público debe consumir una capa separada, filtrada y explícitamente marcada como publicable.
