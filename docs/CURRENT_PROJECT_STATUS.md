# CURRENT_PROJECT_STATUS.md — UFO Predictor

## Estado general

UFO Predictor ya no está en fase de prototipo puro. El proyecto cuenta con una base técnica funcional para avanzar en el Lab pre-Mundial y preparar luego el MVP Mundial.

Estado actual asumido:

- `feature/lab-supabase-queries` ya fue cerrado y mergeado.
- Supabase remoto tiene aplicadas migraciones hasta `0006_admin_lab_read_policies.sql`.
- Las migraciones `0005` y `0006` fueron aplicadas manualmente en Supabase SQL Editor.
- `/admin/beta-lab` ya lee datos reales desde Supabase para fixtures, predicciones, resultados y evaluaciones.

---

## Qué ya existe

### Frontend

- App Next.js con App Router.
- UI base en español.
- Código y nombres técnicos en inglés.
- Branding UFO Predictor.
- Rutas principales:
  - `/`
  - `/predictions`
  - `/matches/[slug]`
  - `/pricing`
  - `/transparency`
  - `/dashboard`
  - `/admin`
  - `/admin/beta-lab`
  - `/login`
  - `/register`
  - `/auth/callback`

### Supabase

- Schema inicial.
- Seed inicial.
- Migraciones versionadas hasta `0006_admin_lab_read_policies.sql`.
- Supabase remoto aplicado.
- Runtime clients browser/server/admin.
- Auth email/password.
- Profiles automáticos.
- Roles `free_user` y `admin`.
- RLS inicial y RLS Lab reforzada.

### Auth / Admin

- Login, registro y logout.
- Callback Auth.
- Perfiles automáticos.
- Dashboard protegido.
- Admin protegido.
- `/admin/beta-lab` protegido con `requireAdmin`.
- Incógnito/no autenticado redirige a login en `/admin/beta-lab`.

### Beta Lab

- Soporte para `internal_lab` en competiciones.
- Soporte para `lab_only` en partidos.
- Soporte para `internal_lab` en ejecuciones de predicción.
- Data Intake Minimal:
  - `intake_source`;
  - `data_quality`;
  - `source_note`;
  - `reviewed_at`;
  - `reviewed_by`;
  - tabla `match_results`.
- `prediction_results` para evaluación persistida.
- `/admin/beta-lab` lee desde Supabase:
  - fixtures Lab;
  - equipos;
  - prediction versions;
  - match results;
  - prediction results;
  - model versions.

### Prediction Engine

Existe en `lib/prediction-engine/`.

Incluye:

- Team Power Score.
- Expected goals.
- Poisson.
- Matriz de marcadores.
- 1X2.
- BTTS.
- Over/Under 2.5.
- Top scorelines.
- Confidence/risk.
- Tests.

### Model Evaluation

Existe en `lib/model-evaluation/`.

Incluye:

- Evaluación individual contra resultados verificados.
- `winner_correct`.
- `btts_correct`.
- `over_2_5_correct`.
- `exact_score_correct`.
- `goal_error`.
- `error_summary`.
- Métricas agregadas.
- Manejo de mercados ambiguos.
- Tests.

---

## Qué existe parcialmente o como mock

- Predicciones públicas visibles en UI.
- Detalle público de partido.
- Pricing.
- Paywall visual.
- Transparency Center.
- Worker status / worker runs.
- Narrativa IA.
- Model vs Market.
- Golden Hour Delta.

En `/admin/beta-lab`, fixtures/predicciones/resultados/evaluaciones ya vienen desde Supabase; worker runs siguen mock y marcados como mock.

---

## Qué NO existe todavía

- Escrituras admin desde UI.
- Review flow de fixtures desde admin.
- Crear/editar `match_results` desde admin.
- Persistencia automática de nuevas evaluaciones.
- Workers reales.
- Lectura pública de predicciones desde DB.
- Paywall backend real.
- Entitlements reales aplicados al contenido.
- API deportiva real.
- Odds reales.
- LLM real.
- Resend real.
- Pagos reales.
- Google Auth.
- Supabase CLI / entorno local.
- Deploy/staging final.
- Producto público multi-liga.

---

## Último trabajo completado

### Lab Supabase Queries

**Rama:** `feature/lab-supabase-queries`  
**Estado:** Done  
**Validación:** Supabase SQL Editor, localhost/admin UI, incógnito redirect, test/lint/build.

Incluye:

- Migración `0006_admin_lab_read_policies.sql`.
- Policies admin-only para lecturas Lab.
- `lib/supabase/lab-queries.ts`.
- `/admin/beta-lab` usando datos reales desde Supabase.
- Worker runs conservados como mock.

---

## Próximo paso recomendado

Dividir Lab Admin Review Flow en sub-épicas.

Primera sub-épica recomendada:

```txt
feature/lab-fixture-review-actions
```

Objetivo: permitir acciones admin controladas para revisar fixtures Lab.

---

## Riesgos actuales

- Empezar escrituras admin sin RLS update claro.
- Mezclar fixture review, result editing y evaluation persistence en una sola rama gigante.
- Usar service role para alimentar UI admin sin necesidad.
- Empezar APIs reales antes de consolidar el Lab.
- Mantener worker runs mock por demasiado tiempo sin etiqueta clara.
- No formalizar Supabase CLI / migraciones locales antes de que crezcan más migraciones.

---

## Regla operativa

Cada nueva épica debe iniciar desde `main` actualizado y en su propia rama. Codex debe revisar contexto, estado de Git y alcance antes de modificar archivos.
