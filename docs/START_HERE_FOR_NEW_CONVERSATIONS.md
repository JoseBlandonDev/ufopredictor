# START_HERE_FOR_NEW_CONVERSATIONS.md — UFO Predictor

## 1. Propósito

Este documento sirve como punto de entrada para nuevas conversaciones de ChatGPT o Codex relacionadas con **UFO Predictor**.

Debe leerse junto con:

- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/CODEX_WORKFLOW.md`
- `docs/OPEN_DECISIONS.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/PROJECT_CONTEXT_UFO_PREDICTOR.md`

---

## 2. Resumen rápido

UFO Predictor es una web/PWA de predicciones probabilísticas de fútbol, enfocada inicialmente en el Mundial 2026.

El producto combina:

- datos deportivos,
- modelo estadístico propio,
- probabilidades,
- señales de mercado,
- narrativa IA,
- transparencia de resultados.

No es una casa de apuestas, no recibe apuestas y no promete ganancias.

---

## 3. Estado actual

El prototipo base ya está mergeado en `main`.

Ya existe:

- UI navegable,
- branding básico,
- copy en español,
- código técnico en inglés,
- mock data,
- skeletons de integraciones,
- documentación base.

No existe todavía:

- Supabase real,
- Auth real,
- motor predictivo real,
- API deportiva real,
- odds reales,
- pagos,
- Resend real,
- workers reales,
- deploy/staging final.

---

## 4. Flujo recomendado de trabajo

Usar dos tipos de conversación:

### ChatGPT

Rol:

- guía técnica,
- arquitecto de ejecución,
- revisor de resultados de Codex,
- preparador de prompts,
- controlador de alcance.

ChatGPT debe ayudar a decidir qué pedirle a Codex y revisar si las respuestas tienen sentido.

### Codex

Rol:

- ejecutar cambios en el repo,
- modificar archivos,
- correr validaciones,
- reportar resultados.

Codex debe trabajar una épica por rama.

---

## 5. Primera épica recomendada

```txt
feature/supabase-schema
```

Objetivo:

Crear la base de datos real mediante migraciones y seeds mínimos.

No debe implementar todavía:

- auth completo,
- pagos,
- APIs reales,
- motor predictivo completo,
- UI nueva.

---

## 6. Segunda épica posible en paralelo

```txt
feature/prediction-engine-v01
```

Objetivo:

Crear el motor estadístico en código puro con tests, usando datos mock.

No debe conectar:

- Supabase,
- APIs reales,
- LLM,
- pagos.

---

## 7. Regla de alcance

Si una tarea empieza a tocar demasiadas carpetas o épicas, probablemente está mal definida.

Primero dividir. Luego implementar.

---

## 8. Documentos clave por tipo de tarea

### Para Supabase

- `docs/DATA_DICTIONARY.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/OPEN_DECISIONS.md`

### Para motor predictivo

- `docs/MODEL_V01.md`
- `docs/PROJECT_CONTEXT_UFO_PREDICTOR.md`
- `docs/ROADMAP_AND_BACKLOG.md`

### Para arquitectura general

- `docs/ARCHITECTURE_SUMMARY.md`
- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/CODEX_WORKFLOW.md`

### Para producto y alcance

- `docs/HUMAN_TECH_OVERVIEW.md`
- `docs/TEAM_BRIEF_AFTER_PROTOTYPE.md`
- `docs/PROJECT_CONTEXT_UFO_PREDICTOR.md`

---

## 9. Reglas permanentes

- No trabajar directo en `main`.
- No rehacer el prototipo.
- No prometer ganancias.
- No implementar módulo de polla/quiniela/pool en el MVP principal.
- No conectar servicios reales sin instrucción explícita.
- No hacer commit/push sin revisión.
- Correr `npm run lint` y `npm run build` antes de cerrar una tarea.

---

## 10. Qué hacer al abrir una nueva conversación

Primero reconocer contexto.

Después elegir una épica.

Después crear rama.

Después implementar.

No saltar directo a construir media plataforma.
