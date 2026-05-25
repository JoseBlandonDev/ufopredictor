# CODEX_WORKFLOW.md — Protocolo de trabajo con Codex

## Propósito

Codex debe usarse como ejecutor técnico sobre el repo. ChatGPT puede apoyar planificación, prompts y revisión de alcance.

---

# Regla principal

Una conversación de Codex debe trabajar sobre una épica o sub-épica clara.

No mezclar en una sola rama:

- Supabase schema;
- Auth;
- motor predictivo;
- APIs deportivas;
- odds;
- Resend;
- workers;
- pagos;
- UI polish;
- documentación general;
- Google Auth;
- acciones admin.

---

# Antes de modificar archivos

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
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/EPIC_PROGRESS_MATRIX.md`
- `docs/NEXT_EPICS_PLAN.md`
- `docs/OPEN_DECISIONS.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_V01.md`
- `docs/CODEX_HANDOFF_CURRENT.md`

---

# Estado operativo actual relevante

Ya existen:

- Prediction Engine v0.1 Lab.
- Model Evaluation Lab.
- Lab Supabase Queries.
- RLS Lab reforzada con `0005` y `0006`.
- `/admin/beta-lab` leyendo datos reales parcialmente.

No rehacer esos módulos salvo que la tarea lo pida explícitamente.

---

# Reglas para épicas con Supabase

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
- verificar admin/no-admin cuando aplique;
- no usar service role para alimentar UI salvo justificación explícita.

---

# Reglas para build

Codex debe correr:

```bash
npm run lint
npm run build
```

Si hay tests:

```bash
npm run test
```

Si `next-env.d.ts` se modifica durante build, debe revertirlo si no forma parte del cambio.

---

# GitHub CLI

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

# Reglas de herramientas

No mezclar instalación de herramientas con una épica funcional salvo autorización explícita.

Ejemplo:

- Instalar Supabase CLI debe ir en su propia tarea/rama si modifica config o flujo.
- No meter Supabase CLI dentro de Lab Admin Review o cualquier épica funcional sin permiso.

---

# Servicios reales

Por defecto, Codex no debe conectar servicios reales salvo instrucción explícita:

- API deportiva;
- odds;
- LLM;
- Resend;
- pagos;
- workers reales;
- Google Auth.

Supabase ya está conectado para schema/auth/lab, pero nuevas escrituras o queries reales deben ser acotadas y revisadas.

---

# Formato de respuesta final

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

# Commits y push

Codex no debe hacer commit ni push salvo instrucción explícita.

Flujo recomendado:

1. Codex modifica.
2. Codex valida.
3. Usuario revisa.
4. Usuario hace commit.
5. Usuario hace push.
6. Usuario abre PR.
7. Usuario mergea tras revisión.
