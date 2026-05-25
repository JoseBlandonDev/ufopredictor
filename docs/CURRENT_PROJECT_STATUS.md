<!-- UFO Predictor | Status updated for Model Evaluation / Backtesting Lab -->

# CURRENT_PROJECT_STATUS.md — UFO Predictor

## Estado general

UFO Predictor ya no está en fase de prototipo puro. El proyecto cuenta con una base técnica funcional para avanzar hacia el Lab pre-Mundial y luego al MVP Mundial.

Estado asumido para esta versión del documento:

- `feature/data-intake-minimal` ya fue cerrado y mergeado antes de la reunión.
- Supabase remoto tiene aplicadas las migraciones hasta `0005_restrict_lab_match_results_rls.sql`.
- El seed actualizado fue ejecutado y validado.
- Prediction Engine v0.1 Lab ya fue mergeado.
- La lectura RLS de `match_results` ya restringe resultados internos del Lab.

---

# Qué ya existe

## Frontend

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

## Supabase

- Schema inicial.
- Seed inicial.
- Supabase remoto aplicado.
- Runtime clients browser/server/admin.
- Auth email/password.
- Profiles automáticos.
- Roles `free_user` y `admin`.
- RLS inicial.

## Beta Lab

- Soporte para `internal_lab` en competiciones.
- Soporte para `lab_only` en partidos.
- Soporte para `internal_lab` en ejecuciones de predicción.
- Data Intake Minimal:
  - `intake_source`.
  - `data_quality`.
  - `source_note`.
  - `reviewed_at`.
  - `reviewed_by`.
  - tabla `match_results`.
- Prediction Engine v0.1 Lab puro y testeado.
- RLS restringida para resultados `internal_lab` / `lab_only`.

## Admin

- `/admin` protegido por rol admin.
- `/admin/beta-lab` protegido por rol admin.
- Beta Lab muestra fixtures internos, fuente/calidad de datos y resultados registrados.

---

# Qué existe parcialmente o como mock

- Predicciones visibles en UI pública.
- Detalle de partido.
- Pricing.
- Paywall visual.
- Transparency Center.
- Worker status.
- Narrativa IA.
- Model vs Market.
- Golden Hour Delta.

Estos elementos existen en UI/mock, pero no están completamente conectados a datos reales ni workers.

---

# Qué NO existe todavía

- Backtesting real.
- Evaluación automática contra `match_results`.
- Lecturas reales de Beta Lab desde Supabase.
- CRUD/review flow de Lab desde admin.
- Public predictions desde DB.
- Paywall backend real.
- Entitlements reales aplicados al contenido.
- API deportiva real.
- Odds reales.
- Workers reales.
- LLM real.
- Resend real.
- Pagos reales.
- Deploy/staging final.
- Producto público multi-liga.

---

# Ultimo trabajo completado

## Prediction Engine v0.1 Lab y fix RLS

**Estado:** Done

Incluye:

- Motor puro en `lib/prediction-engine/`.
- Tests deterministas con Vitest.
- Migracion `0005_restrict_lab_match_results_rls.sql`.
- Restriccion de resultados del Lab a la policy admin.

## Data Intake Minimal

**Rama:** `feature/data-intake-minimal`  
**Estado:** Done  
**Ejecución técnica:** Jonathan, con apoyo Codex/ChatGPT  
**Validación:** Supabase SQL Editor, seed, localhost, lint/build.

Incluye:

- Migración `0004_data_intake_minimal.sql`.
- Campos de fuente/calidad en `matches`.
- Tabla `match_results`.
- Seed actualizado.
- UI admin actualizada.

---

# Trabajo actual

```txt
feature/model-evaluation-lab
```

Objetivo: evaluar predicciones contra resultados verificados mediante logica
pura compatible con `prediction_results`, sin persistencia en Supabase.

---

# Riesgos actuales

- Confundir Beta Lab con soporte público multi-liga.
- Empezar APIs reales antes de tener modelo evaluable.
- Mantener demasiadas áreas públicas leyendo mock data por mucho tiempo.
- No formalizar Supabase CLI / migraciones locales.
- Mezclar paywall, motor, APIs y admin en una misma rama.

---

# Regla operativa

Cada nueva épica debe iniciar desde `main` actualizado y en su propia rama. Codex debe revisar contexto, estado de Git y alcance antes de modificar archivos.
