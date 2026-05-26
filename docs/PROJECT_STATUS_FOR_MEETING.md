# PROJECT_STATUS_FOR_MEETING.md — UFO Predictor

## Resumen ejecutivo

UFO Predictor ya dejó de ser solo una maqueta visual. El proyecto cuenta con una base técnica real: Supabase, Auth, roles, Admin/Beta Lab, motor predictivo v0.1, evaluación de predicciones y flujo admin interno con datos reales.

El producto sigue en fase interna pre-Mundial. Todavía no es un MVP público final.

Principio permanente:

> El modelo estadístico calcula. La IA explica.

---

## Qué ya existe

### Producto / UI

- App Next.js navegable.
- Branding UFO Predictor.
- Home, predicciones, detalle de partido, pricing, transparency, dashboard y admin.
- Login/register con Supabase Auth por correo y contraseña.
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
- Migraciones aplicadas manualmente hasta `0010_admin_lab_evaluation_persistence.sql`.

### Beta Lab

`/admin/beta-lab` ya permite operar el flujo interno del modelo:

- Leer competiciones internas `internal_lab`.
- Leer partidos `lab_only`.
- Revisar fixtures desde UI.
- Actualizar estado/calidad/notas de fixtures.
- Crear y editar resultados reales en `match_results`.
- Leer predicciones internas en `prediction_versions`.
- Leer mercados internos en `prediction_markets`.
- Persistir o actualizar evaluaciones en `prediction_results`.
- Mostrar estado de evaluación y métricas persistidas.

### Motor predictivo

- `lib/prediction-engine/` implementado.
- Calcula probabilidades 1X2, BTTS, Over/Under 2.5, xG, marcadores probables, confidence/risk.
- Tests con Vitest.
- No se ejecuta todavía desde UI admin ni desde workers.

### Evaluación del modelo

- `lib/model-evaluation/` implementado.
- Calcula aciertos y errores contra resultados reales verificados.
- B06c ya usa este módulo para persistir evaluaciones desde el Beta Lab.
- Tests con Vitest.

---

## Qué validamos recientemente

- `npm run test`.
- `npm run lint`.
- `npm run build`.
- Supabase SQL Editor con migraciones `0007`, `0008`, `0009` y `0010`.
- Usuario admin puede ver y operar `/admin/beta-lab`.
- Admin puede actualizar evaluación y ver `?evaluation=saved`.
- `prediction_results` guarda métricas calculadas y `validated_at`.
- `DELETE` no está concedido para `anon` ni `authenticated` sobre `prediction_results`.

Datos visibles actuales en Beta Lab:

- Fixtures Lab.
- Predicciones Lab.
- Markets internos.
- Resultados registrados.
- Evaluaciones persistidas.
- Worker runs mock.

---

## Qué sigue siendo mock o pendiente

- Worker runs siguen mock.
- No hay workers reales.
- No hay API deportiva.
- No hay odds reales.
- No hay LLM real.
- No hay pagos.
- No hay Google Auth.
- No hay Supabase CLI local.
- No hay predicciones públicas desde DB.
- No hay detalle público real desde DB.
- No hay paywall backend real.
- No hay entitlements reales.
- No hay staging final.

---

## Punto actual del proyecto

Ya tenemos un MVP interno funcional para desarrolladores/admin:

```txt
fixture Lab → revisión → resultado real → predicción + markets → evaluación → prediction_results
```

El siguiente salto es pasar de Lab interno a superficies públicas con datos reales, sin exponer datos internos ni premium.

---

## Próximo bloque recomendado

Primero cerrar documentación post B06c, si todavía no está mergeada:

```txt
docs/update-project-context-after-lab-admin-flow
```

Después:

```txt
feature/public-predictions-from-db
```

Antes de C01 hay que decidir:

```txt
Qué prediction_versions pasan de internal_lab a public_product.
```

---

## Mensaje simple para equipo

Ya tenemos el laboratorio interno funcionando con datos reales de Supabase. Desde el panel admin se pueden revisar partidos de prueba, cargar resultados reales y guardar evaluaciones del modelo contra esos resultados.

Todavía no es el MVP público final, pero ya tenemos el ciclo interno principal del producto funcionando: predicción, resultado y evaluación.
