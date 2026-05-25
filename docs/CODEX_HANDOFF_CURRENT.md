# UFO Predictor — Codex Handoff Current

## Propósito

Documento corto para arrancar conversaciones de Codex con contexto actualizado. Codex debe leer esto antes de proponer o modificar archivos.

---

## Estado actual

Rama base esperada para nuevas tareas: `main` actualizado.

Últimas épicas/tareas mergeadas:

1. `feat: add prediction engine v0.1 lab`
2. `fix: restrict lab match results rls`
3. `feat: add model evaluation lab`
4. `feat: add lab Supabase queries`

El proyecto ya tiene:

- Next.js App Router.
- Supabase remoto conectado.
- Supabase Auth email/password.
- Roles `free_user` y `admin`.
- Dashboard/admin protegidos.
- `/admin/beta-lab` protegido con `requireAdmin`.
- Beta Lab Foundation.
- Data Intake Minimal.
- `match_results`.
- `prediction_results`.
- RLS reforzada para Lab.
- `lib/prediction-engine/`.
- `lib/model-evaluation/`.
- `lib/supabase/lab-queries.ts`.
- `/admin/beta-lab` leyendo datos reales de Supabase para fixtures, predicciones, resultados y evaluaciones.

Sigue mock:

- worker runs / estado de workers.

---

## No rehacer

No rehacer:

- prototipo visual;
- Supabase schema inicial;
- Auth/roles;
- Beta Lab Foundation;
- Data Intake Minimal;
- Prediction Engine;
- Model Evaluation;
- Lab Supabase Queries.

---

## Próximo bloque recomendado

Dividir Lab Admin Review Flow en sub-épicas pequeñas.

Próxima rama recomendada:

```txt
feature/lab-fixture-review-actions
```

Objetivo:

- permitir revisión de fixtures Lab desde admin;
- actualizar campos de `matches`;
- no editar todavía `match_results`, salvo decisión explícita;
- no hacer CRUD gigante.

Campos candidatos en `matches`:

- `lab_status`;
- `data_quality`;
- `source_note`;
- `reviewed_at`;
- `reviewed_by`.

---

## Reglas para Codex

Antes de modificar:

```bash
git branch
git status
```

Si corresponde:

```bash
git checkout main
git pull origin main
git checkout -b <rama>
```

No hacer commit, push ni PR salvo instrucción explícita.

No tocar:

- `.env.local`;
- secretos;
- pagos;
- API deportiva;
- odds;
- LLM;
- workers reales;
- rutas públicas, salvo que la épica lo pida.

Para tareas con Supabase:

- explicar migración;
- pegar SQL completo;
- incluir queries manuales de verificación;
- indicar si requiere SQL Editor;
- no usar service role para alimentar UI salvo justificación explícita.

Supabase CLI todavía no está configurado. Las migraciones se han aplicado manualmente con Supabase SQL Editor.

GitHub CLI está disponible/autenticado para PRs, pero Codex no debe usarlo sin autorización explícita.

---

## Validaciones esperadas

Para cambios TypeScript/UI:

```bash
npm run test
npm run lint
npm run build
```

Para cambios solo docs:

```bash
npm run lint
npm run build
```

Si `next-env.d.ts` cambia por build, debe restaurarse y no quedar en el diff final.

---

## Formato de respuesta final esperado

1. Rama actual.
2. Objetivo implementado.
3. Archivos modificados/creados.
4. Cambios en BD si aplica.
5. SQL completo si aplica.
6. Validaciones ejecutadas.
7. Estado final de git.
8. Qué no implementó deliberadamente.
9. Riesgos/decisiones abiertas.
10. Recomendación de commit/push.
