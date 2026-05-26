# CODEX_WORKFLOW.md — Protocolo de trabajo con Codex

## Propósito

Codex debe usarse como ejecutor técnico sobre el repo. ChatGPT puede apoyar planificación, prompts, revisión de alcance y control de ramas/PRs.

Este documento está actualizado al estado posterior al PR #18 (`feat: persist lab evaluations`).

Principio permanente:

> El modelo estadístico calcula. La IA explica.

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.

---

## Regla principal

Una conversación de Codex debe trabajar sobre una épica o sub-épica clara.

No mezclar en una sola rama:

- documentación general;
- Supabase schema;
- Auth;
- motor predictivo;
- evaluación;
- APIs deportivas;
- odds;
- Resend;
- workers;
- pagos;
- UI polish;
- Google Auth;
- acciones admin;
- features públicas.

Una rama debe tener un objetivo claro y pequeño. Sí, el software ya es suficientemente caótico sin meter cinco incendios en el mismo commit.

---

## Antes de modificar archivos

Codex debe ejecutar o revisar:

```bash
git branch
git status
```

Si arranca desde `main`:

```bash
git checkout main
git pull origin main
```

Luego debe leer documentación clave:

- `README.md`
- `PROJECT_RULES.md`
- `.env.example`
- `package.json`
- `docs/START_HERE_FOR_NEW_CONVERSATIONS.md`
- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `docs/CODEX_HANDOFF_CURRENT.md`
- `docs/EPIC_PROGRESS_MATRIX.md`
- `docs/NEXT_EPICS_PLAN.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/OPEN_DECISIONS.md`
- `docs/DOCS_AND_SOURCES_INVENTORY.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_V01.md`

Si algún documento secundario contradice las fuentes activas, priorizar:

1. `START_HERE_FOR_NEW_CONVERSATIONS.md`
2. `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
3. `CURRENT_PROJECT_STATUS.md`
4. `CODEX_HANDOFF_CURRENT.md`
5. `EPIC_PROGRESS_MATRIX.md`
6. `NEXT_EPICS_PLAN.md`
7. `ROADMAP_AND_BACKLOG.md`
8. `OPEN_DECISIONS.md`
9. este documento

---

## Estado operativo actual relevante

`main` incluye hasta PR #18:

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

Ya existen:

- Prediction Engine v0.1 Lab en `lib/prediction-engine/`.
- Model Evaluation Lab en `lib/model-evaluation/`.
- Lab Supabase Queries en `lib/supabase/lab-queries.ts`.
- Auth email/password.
- Roles `free_user` y `admin`.
- `/admin/beta-lab` protegido con `requireAdmin`.
- Lab Admin Flow completo:
  - revisión de fixtures Lab;
  - creación/edición de `match_results`;
  - lectura de `prediction_markets`;
  - persistencia/actualización de `prediction_results`.
- RLS/grants Lab reforzados hasta `0010`.

No existe todavía:

- predicciones públicas desde DB;
- detalle público real desde DB;
- paywall backend;
- entitlements reales;
- workers reales;
- API deportiva;
- odds;
- LLM real;
- pagos;
- Google Auth;
- Supabase CLI local;
- staging final.

`workerRuns` sigue mock. No rehacerlo en features que no sean workers.

---

## Reglas para épicas con Supabase

Si Codex crea o modifica migraciones/seed, debe informar:

- migración creada o modificada;
- orden de ejecución;
- cambios en `types/database.ts` si aplica;
- si cambia `supabase/seed/seed.sql`;
- queries de verificación manual;
- si Supabase CLI está disponible o no;
- si el cambio requiere SQL Editor en Supabase.

Codex no debe leer, imprimir ni modificar `.env.local`.

Supabase CLI todavía no está configurado. Hasta nueva decisión, las migraciones se aplican manualmente con Supabase SQL Editor.

Para cambios RLS:

- pegar SQL completo;
- usar `drop policy if exists` cuando sea apropiado;
- incluir queries para verificar policies;
- verificar grants por tabla y por columna cuando aplique;
- verificar admin/no-admin cuando aplique;
- no usar service role para alimentar UI salvo justificación explícita.

---

## Reglas para features públicas

La siguiente feature técnica recomendada después de la rama docs es:

```txt
feature/public-predictions-from-db
```

Antes de implementarla se debe decidir cómo separar:

```txt
internal_lab → public_product
```

Reglas:

- No exponer datos `internal_lab` ni `lab_only` en rutas públicas.
- No enviar datos premium al frontend sin backend gating.
- No ejecutar Prediction Engine desde rutas públicas.
- No llamar LLM.
- No introducir pagos, odds, workers o API deportiva dentro de C01.
- Empezar con lectura controlada desde Supabase.

---

## Reglas para build

Codex debe correr:

```bash
npm run lint
npm run build
```

Si hay tests:

```bash
npm run test
```

Si `next-env.d.ts` se modifica durante build, debe revertirlo si no forma parte del cambio:

```bash
git restore next-env.d.ts
```

Para ramas docs-only, al menos debe correr:

```bash
git diff --check
git diff --name-only -- . ':!docs/'
```

El segundo comando debe producir salida vacía en una rama docs-only.

---

## GitHub CLI

GitHub CLI está disponible/autenticado en el entorno del usuario.

Codex no debe hacer commit, push ni PR salvo instrucción explícita.

Flujo recomendado para el usuario:

```bash
git push -u origin <branch>
gh pr create --base main --head <branch> --title "..." --body "..."
gh pr view --web
```

Merge solo después de revisión.

---

## Servicios reales

Por defecto, Codex no debe conectar servicios reales salvo instrucción explícita:

- API deportiva;
- odds;
- LLM;
- Resend;
- pagos;
- workers reales;
- Google Auth.

Supabase ya está conectado para schema/auth/lab. Nuevas escrituras, policies o queries reales deben ser acotadas y revisadas.

---

## Formato de respuesta final

Al terminar una tarea, Codex debe responder:

1. Rama actual.
2. Objetivo implementado.
3. Archivos creados/modificados.
4. Cambios en BD si aplica.
5. Cambios en seed si aplica.
6. SQL completo si aplica.
7. Qué no implementó deliberadamente.
8. Resultado de test/lint/build.
9. Estado final de git.
10. Riesgos o decisiones abiertas.
11. Recomendación de commit/push.

---

## Commits y push

Codex no debe hacer commit ni push salvo instrucción explícita.

Flujo recomendado:

1. Codex modifica.
2. Codex valida.
3. Usuario revisa.
4. Usuario hace commit.
5. Usuario hace push.
6. Usuario abre PR.
7. Usuario mergea tras revisión.
