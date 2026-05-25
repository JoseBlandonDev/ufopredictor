<!-- UFO Predictor | Updated roadmap after Beta Lab + Data Intake -->
<!-- Status assumes feature/data-intake-minimal has been committed, pushed, PR'd and merged before the team meeting. -->

# PROJECT_STATUS_FOR_MEETING.md — UFO Predictor

## Resumen ejecutivo

UFO Predictor avanzó de prototipo visual a una base técnica funcional. Ya existen Supabase, Auth, roles, Beta Lab y Data Intake Minimal. Esto permite preparar el siguiente bloque: motor predictivo v0.1 y evaluación interna antes del Mundial 2026.

La ejecución reciente fue coordinada por Jonathan con apoyo de Codex/ChatGPT para implementación y revisión. Las decisiones de producto y priorización siguen abiertas para el equipo.

---

# Qué ya está listo

## Producto / UI

- Prototipo navegable.
- Branding inicial UFO Predictor.
- UI en español.
- Rutas principales del MVP.
- Dashboard y Admin.
- Beta Lab visible.

## Backend / Supabase

- Schema inicial.
- Seed inicial.
- Supabase remoto aplicado.
- Auth email/password.
- Roles `free_user` y `admin`.
- Rutas protegidas.
- RLS inicial.

## Lab interno

- Competiciones internas `internal_lab`.
- Partidos `lab_only`.
- Ejecuciones `internal_lab`.
- Fuente/calidad del dato.
- Resultados validados en `match_results`.
- Panel admin muestra estado de fixtures lab.

---

# Últimas épicas completadas

| Épica | Resultado |
|---|---|
| Auth y roles | Login, registro, perfil, admin/free_user, rutas protegidas. |
| Beta Lab Foundation | Separación entre producto público y laboratorio interno. |
| Data Intake Minimal | Fuente/calidad de datos y resultados validados para Lab. |

---

# Qué cambió respecto al plan inicial

El plan inicial contemplaba un prototipo y skeletons. Al conectar Supabase y Auth surgió una necesidad más clara: construir un Lab interno para probar el modelo antes del Mundial.

Esto agregó nuevas épicas necesarias:

- Beta Lab Foundation.
- Data Intake Minimal.
- Prediction Engine v0.1 Lab.
- Model Evaluation / Backtesting.
- Lab Admin Review Flow.

Esto no es desviación: es la capa necesaria para no llegar al Mundial sin pruebas reales.

---

# Qué falta para una beta interna útil

1. Prediction Engine v0.1.
2. Evaluación del modelo contra resultados.
3. Consultas reales de Supabase en Beta Lab.
4. Flujo admin para revisar fixtures/resultados.
5. Transparency v0.1 interna.

---

# Qué falta para MVP Mundial funcional

- Predicciones públicas desde DB.
- Paywall backend real.
- Entitlements.
- Transparency real.
- Deploy/staging.
- QA/security.

---

# Qué queda para producto comercial

- API deportiva real.
- Odds reales.
- Workers reales.
- Narrativa LLM.
- Emails.
- Pagos.
- Ligas v2.

---

# Próxima prioridad recomendada

```txt
feature/prediction-engine-v01
```

Objetivo: generar predicciones simples y medibles en el Lab.

No debe incluir todavía APIs reales, LLM, pagos ni odds.

---

# Decisiones requeridas del equipo

- Qué competiciones/amistosos usar para Lab.
- Cuándo instalar formalmente Supabase CLI y Docker local.
- Qué proveedor deportivo evaluar primero.
- Cuál será el criterio mínimo para considerar útil el modelo v0.1.
- Qué tan pronto conectar staging.
- Cuándo priorizar paywall frente a motor/evaluación.
