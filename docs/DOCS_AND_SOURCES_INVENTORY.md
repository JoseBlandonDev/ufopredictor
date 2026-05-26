# DOCS_AND_SOURCES_INVENTORY.md — UFO Predictor

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Fuentes principales activas

Estos documentos deben considerarse fuentes activas para nuevas conversaciones:

| Documento | Rol |
|---|---|
| `START_HERE_FOR_NEW_CONVERSATIONS.md` | Entrada rápida para nuevas conversaciones. |
| `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md` | Fuente principal consolidada para ChatGPT. |
| `CURRENT_PROJECT_STATUS.md` | Estado técnico actual. |
| `CODEX_HANDOFF_CURRENT.md` | Handoff operativo para Codex. |
| `EPIC_PROGRESS_MATRIX.md` | Matriz de Done/Next/Later. |
| `NEXT_EPICS_PLAN.md` | Plan de próximas épicas. |
| `ROADMAP_AND_BACKLOG.md` | Roadmap amplio y backlog. |
| `OPEN_DECISIONS.md` | Decisiones abiertas. |
| `CODEX_WORKFLOW.md` | Protocolo de trabajo con Codex. |

---

## Documentos de soporte

| Documento | Uso recomendado |
|---|---|
| `ARCHITECTURE_SUMMARY.md` | Resumen arquitectónico, actualizar solo si cambia arquitectura real. |
| `DATA_DICTIONARY.md` | Diccionario de datos, actualizar si cambian tablas/columnas. |
| `MODEL_V01.md` | Contrato del modelo/evaluación, no cambiar fórmula sin decisión explícita. |
| `IMPLEMENTATION_PLAN.md` | Puede quedar como histórico o plan de referencia. |
| `PROJECT_STATUS_FOR_MEETING.md` | Uso puntual para reuniones; no debe ser fuente principal si queda viejo. |
| `PROJECT_CONTEXT_UFO_PREDICTOR.md` | Contexto fundacional/histórico. |

---

## Estado de actualización post B06c

Deben estar sincronizados con:

```txt
PR #15, #16, #17, #18
Migraciones 0007, 0008, 0009, 0010
```

Especialmente:

- B06a/B06b/B06c ya no son Next; son Done.
- `feature/lab-prediction-markets-seed` fue tarea desbloqueadora y también está Done.
- El siguiente foco ya no es Lab Admin Flow; es documentación y luego public predictions from DB.

---

## Qué reemplazar en fuentes del proyecto

Para actualizar las fuentes activas del proyecto, reemplazar como mínimo:

```txt
START_HERE_FOR_NEW_CONVERSATIONS.md
CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md
CURRENT_PROJECT_STATUS.md
CODEX_HANDOFF_CURRENT.md
EPIC_PROGRESS_MATRIX.md
NEXT_EPICS_PLAN.md
ROADMAP_AND_BACKLOG.md
DOCS_AND_SOURCES_INVENTORY.md
OPEN_DECISIONS.md
```

Opcionalmente revisar:

```txt
ARCHITECTURE_SUMMARY.md
DATA_DICTIONARY.md
MODEL_V01.md
```

---

## Riesgo de fuentes desactualizadas

Si una conversación nueva usa fuentes viejas, probablemente intentará:

- rehacer B06a/B06b/B06c;
- ignorar migraciones `0007` a `0010`;
- suponer que `/admin/beta-lab` no escribe datos;
- recomendar tareas equivocadas;
- mezclar Lab con producto público.

Ese es el tipo de caos que Markdown produce cuando nadie lo vigila.
