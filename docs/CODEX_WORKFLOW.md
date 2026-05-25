# CODEX_WORKFLOW.md — Protocolo de trabajo con Codex

## 1. Propósito

Este documento define cómo debe trabajar Codex dentro del repositorio de **UFO Predictor**.

Codex debe usarse como ejecutor técnico sobre el repo. La planificación, revisión de alcance y decisión de prioridades puede apoyarse en ChatGPT, pero Codex debe modificar archivos solo bajo instrucciones acotadas.

---

## 2. Regla principal

Una conversación de Codex debe trabajar sobre **una épica o una parte clara de una épica**.

No mezclar en una sola rama:

- Supabase,
- Auth,
- motor predictivo,
- APIs deportivas,
- odds,
- Resend,
- workers,
- pagos,
- UI polish,
- publicidad.

Mezclar épicas genera PRs grandes, conflictos y resultados difíciles de revisar.

---

## 3. Antes de modificar archivos

Codex debe iniciar cada sesión revisando el estado real del proyecto.

Comandos sugeridos:

```bash
git branch
git status
```

Si la sesión arranca desde `main`:

```bash
git checkout main
git pull origin main
```

Luego leer documentación clave:

- `README.md`
- `PROJECT_RULES.md`
- `.env.example`
- `package.json`
- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/CODEX_WORKFLOW.md`
- `docs/OPEN_DECISIONS.md`
- `docs/PROJECT_CONTEXT_UFO_PREDICTOR.md`
- `docs/ARCHITECTURE_SUMMARY.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_V01.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/HUMAN_TECH_OVERVIEW.md`
- `docs/TEAM_BRIEF_AFTER_PROTOTYPE.md`

Después debe inspeccionar la estructura real:

- `app/`
- `components/`
- `lib/`
- `types/`
- `workers/`
- `supabase/` si existe
- `public/brand/`

---

## 4. Ramas

Nunca trabajar directo sobre `main`.

Crear una rama por épica:

```bash
git checkout main
git pull origin main
git checkout -b feature/nombre-de-la-epica
```

Ramas recomendadas:

- `feature/supabase-schema`
- `feature/auth-roles`
- `feature/dynamic-plans-paywall`
- `feature/prediction-engine-v01`
- `feature/football-api`
- `feature/odds-model-market`
- `feature/railway-workers`
- `feature/resend-emails`
- `feature/admin-beta-lab-real`
- `feature/transparency-real`
- `feature/ui-polish-mobile`
- `feature/staging-deploy`

Para documentación:

```txt
docs/operational-context
```

---

## 5. Alcance por defecto

Codex debe respetar el alcance de la épica actual.

Si la épica es `feature/supabase-schema`, NO debe:

- implementar auth completo,
- conectar UI,
- conectar APIs externas,
- implementar pagos,
- modificar branding,
- tocar publicidad,
- implementar motor predictivo real salvo tipos mínimos necesarios.

Si la épica es `feature/prediction-engine-v01`, NO debe:

- crear Supabase schema,
- conectar DB,
- conectar APIs reales,
- llamar LLM,
- implementar pagos,
- tocar UI masivamente.

---

## 6. Restricciones permanentes del producto

Codex debe respetar siempre:

- UFO Predictor no es casa de apuestas.
- No recibe apuestas.
- No promete ganancias.
- No usar lenguaje tipo “apuesta segura”, “fixed”, “100% ganador”.
- El módulo de polla/quiniela/pool está fuera del MVP principal.
- El modelo estadístico calcula; la IA explica.
- El LLM no debe inventar probabilidades.
- Los datos premium deben filtrarse desde backend cuando exista backend real.
- No exponer secretos ni API keys.
- No crear `.env` real con credenciales.
- `.env.example` debe usar placeholders.

---

## 7. Servicios reales

Por defecto, Codex NO debe conectar servicios reales salvo instrucción explícita.

Servicios que deben permanecer mock/skeleton si la épica no los requiere:

- Supabase real.
- Railway deploy real.
- Resend real.
- API deportiva real.
- Odds provider real.
- LLM real.
- Auth real.
- Pagos reales.

---

## 8. Validación obligatoria

Antes de decir que una tarea está lista, Codex debe correr:

```bash
npm run lint
npm run build
```

Si aplica:

```bash
npm test
```

Si modifica dependencias:

```bash
npm install
```

Si crea migraciones o scripts de DB, debe explicar cómo probarlos.

---

## 9. Formato de respuesta final de Codex

Al terminar una tarea, Codex debe responder con:

1. Rama actual.
2. Resumen de objetivo implementado.
3. Archivos creados/modificados.
4. Archivos que no tocó deliberadamente.
5. Comandos ejecutados.
6. Resultado de `npm run lint`.
7. Resultado de `npm run build`.
8. Resultado de tests si aplica.
9. Qué quedó pendiente.
10. Riesgos o decisiones abiertas.
11. Recomendación: listo para commit/push o requiere revisión.

---

## 10. Commits y push

Codex no debe hacer commit o push salvo que el usuario lo pida explícitamente.

Flujo recomendado:

1. Codex modifica archivos.
2. Codex corre validaciones.
3. Usuario revisa visual/técnicamente.
4. Usuario hace commit.
5. Usuario hace push.
6. Usuario abre PR.

Comandos típicos:

```bash
git status
git add .
git commit -m "feat: short description"
git push origin feature/nombre-de-rama
```

---

## 11. Pull Requests

Cada PR debe incluir:

- Qué épica aborda.
- Qué cambió.
- Qué no incluye.
- Validaciones ejecutadas.
- Riesgos.
- Próximos pasos.

No mergear PRs que:

- rompan build,
- rompan lint,
- mezclen demasiadas épicas,
- agreguen secretos,
- implementen servicios reales fuera de alcance,
- cambien copy para prometer ganancias.

---

## 12. Checklist antes de PR

Antes de abrir PR:

- [ ] Estoy en una rama que no es `main`.
- [ ] La rama corresponde a una épica clara.
- [ ] No mezclé funcionalidades sin necesidad.
- [ ] No agregué secretos.
- [ ] No rompí `docs/`.
- [ ] No borré assets de `public/brand/`.
- [ ] No conecté servicios reales fuera de alcance.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] Tests pasan si existen.
- [ ] El resumen final explica qué se hizo.

---

## 13. Relación ChatGPT + Codex

El flujo recomendado es:

- ChatGPT: guía técnica, planificación, revisión de resultados, preparación de prompts y control de alcance.
- Codex: ejecución en repo, modificación de archivos, validación local.

El usuario puede copiar la respuesta final de Codex en ChatGPT para revisión antes de hacer commit/push.
