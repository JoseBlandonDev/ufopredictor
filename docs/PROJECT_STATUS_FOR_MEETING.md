# PROJECT_STATUS_FOR_MEETING.md — UFO Predictor

## Resumen ejecutivo

UFO Predictor ya dejó de ser solo una maqueta visual. El proyecto cuenta con una base técnica real: Supabase, Auth, roles, Admin/Beta Lab, motor predictivo v0.1, evaluación de predicciones y lecturas reales de datos Lab desde Supabase.

El producto sigue en fase interna pre-Mundial. Todavía no es un MVP público final.

Principio permanente:

> El modelo estadístico calcula. La IA explica.

---

## Qué ya existe

### Producto / UI

- App Next.js navegable.
- Branding UFO Predictor.
- Home, predicciones, detalle de partido, pricing, transparency, dashboard y admin.
- Login/register con Supabase Auth.
- Dashboard protegido.
- Admin protegido.
- Beta Lab admin protegido.

### Supabase / Auth

- Schema inicial aplicado.
- Auth email/password.
- Roles `free_user` y `admin`.
- Profiles automáticos.
- Runtime clients.
- RLS inicial.
- Policies Lab reforzadas.

### Beta Lab

- Competiciones internas `internal_lab`.
- Partidos `lab_only`.
- Fuente/calidad de datos.
- Resultados reales registrados en `match_results`.
- Predicciones internas en `prediction_versions`.
- Evaluaciones persistidas en `prediction_results`.
- `/admin/beta-lab` ya lee datos reales desde Supabase.

### Motor predictivo

- `lib/prediction-engine/` implementado.
- Calcula probabilidades 1X2, BTTS, Over/Under 2.5, xG, marcadores probables, confidence/risk.
- Tests con Vitest.

### Evaluación del modelo

- `lib/model-evaluation/` implementado.
- Calcula aciertos y errores contra resultados reales.
- Produce métricas individuales y agregadas.
- Tests con Vitest.

---

## Qué validamos recientemente

- `npm run test`.
- `npm run lint`.
- `npm run build`.
- Supabase SQL Editor con migraciones `0005` y `0006`.
- Usuario admin puede ver `/admin/beta-lab`.
- Incógnito/no autenticado redirige a login para `/admin/beta-lab`.

Datos visibles actuales en Beta Lab:

- 3 fixtures Lab.
- 2 predicciones Lab.
- 1 resultado registrado.
- 1 evaluación persistida.
- 2 fixtures pendientes de revisión.

---

## Qué sigue siendo mock o pendiente

- Worker runs siguen mock.
- No hay escritura admin desde UI todavía.
- No hay CRUD/review flow.
- No hay workers reales.
- No hay API deportiva.
- No hay odds reales.
- No hay LLM real.
- No hay pagos.
- No hay Google Auth.
- No hay predicciones públicas desde DB.
- No hay paywall backend real.

---

## Próximo bloque recomendado

Dividir Lab Admin Review Flow en tareas pequeñas.

### Próxima tarea recomendada

```txt
feature/lab-fixture-review-actions
```

Objetivo: permitir que admin revise fixtures Lab desde UI.

Campos candidatos:

- `matches.lab_status`.
- `matches.data_quality`.
- `matches.source_note`.
- `matches.reviewed_at`.
- `matches.reviewed_by`.

### Después

```txt
feature/lab-match-result-actions
feature/lab-evaluation-persistence
```

---

## Mensaje simple para equipo

Ya tenemos el laboratorio interno funcionando con datos reales de Supabase. Podemos ver fixtures de prueba, predicciones, resultados y evaluaciones desde el panel admin. El siguiente paso es permitir que el admin revise y actualice esos datos desde la interfaz, en vez de depender del SQL Editor.
