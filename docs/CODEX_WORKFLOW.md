<!-- UFO Predictor | Updated roadmap after Beta Lab + Data Intake -->
<!-- Status assumes feature/data-intake-minimal has been committed, pushed, PR'd and merged before the team meeting. -->

# CODEX_WORKFLOW.md — Protocolo de trabajo con Codex

## Propósito

Codex debe usarse como ejecutor técnico sobre el repo. ChatGPT puede apoyar planificación, prompts y revisión de alcance.

---

# Regla principal

Una conversación de Codex debe trabajar sobre una épica o sub-épica clara.

No mezclar en una sola rama:

- Supabase schema.
- Auth.
- motor predictivo.
- APIs deportivas.
- odds.
- Resend.
- workers.
- pagos.
- UI polish.
- documentación general.

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
- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/OPEN_DECISIONS.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_V01.md`

---

# Reglas para épicas con Supabase

Si Codex crea o modifica migraciones/seed, debe informar:

- migración creada o modificada,
- orden de ejecución,
- cambios en `types/database.ts`,
- si cambia `supabase/seed/seed.sql`,
- queries de verificación manual,
- si Supabase CLI está disponible o no,
- si el cambio requiere SQL Editor en Supabase.

Codex no debe leer, imprimir ni modificar `.env.local`.

---

# Reglas para build

Codex debe correr:

```bash
npm run lint
npm run build
```

Si `next-env.d.ts` se modifica durante build, debe revertirlo si no forma parte del cambio.

---

# Reglas de herramientas

No mezclar instalación de herramientas con una épica funcional salvo autorización explícita.

Ejemplo:

- Instalar Supabase CLI debe ir en su propia tarea/rama si modifica `package.json` o config.
- No meter Supabase CLI dentro de Data Intake o Prediction Engine sin permiso.

---

# Servicios reales

Por defecto, Codex no debe conectar servicios reales salvo instrucción explícita:

- API deportiva.
- odds.
- LLM.
- Resend.
- pagos.
- workers reales.

Supabase ya está conectado para schema/auth/lab, pero nuevas escrituras o queries reales deben ser acotadas y revisadas.

---

# Formato de respuesta final

Al terminar una tarea, Codex debe responder:

1. Rama actual.
2. Objetivo implementado.
3. Archivos creados/modificados.
4. Cambios en BD si aplica.
5. Cambios en seed si aplica.
6. Qué no implementó deliberadamente.
7. Resultado de lint.
8. Resultado de build.
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
