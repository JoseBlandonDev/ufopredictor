# DOCS_AND_SOURCES_INVENTORY.md — Inventario de fuentes y documentación

## Propósito

Este inventario indica qué conservar, actualizar, crear o quitar de fuentes activas tanto en ChatGPT como en el repo `/docs`.

---

# Fuentes del proyecto en ChatGPT

## Conservar como fuentes principales actualizadas

| Archivo | Acción |
|---|---|
| `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md` | Crear/subir como fuente principal nueva. |
| `START_HERE_FOR_NEW_CONVERSATIONS.md` | Reemplazar por versión actualizada. |
| `CURRENT_PROJECT_STATUS.md` | Reemplazar por versión actualizada. |
| `EPIC_PROGRESS_MATRIX.md` | Reemplazar por versión actualizada. |
| `NEXT_EPICS_PLAN.md` | Reemplazar por versión actualizada. |
| `ROADMAP_AND_BACKLOG.md` | Reemplazar por versión actualizada. |
| `CODEX_HANDOFF_CURRENT.md` | Crear/subir como fuente técnica para handoff a Codex. |

## Conservar como contexto de soporte

| Archivo | Acción |
|---|---|
| `IMPLEMENTATION_PLAN.md` | Reemplazar por versión actualizada o conservar como soporte si ya se actualiza en repo. |
| `ARCHITECTURE_SUMMARY.md` | Reemplazar por versión actualizada. |
| `DATA_DICTIONARY.md` | Reemplazar por versión actualizada. |
| `MODEL_V01.md` | Reemplazar por versión actualizada. |
| `OPEN_DECISIONS.md` | Reemplazar por versión actualizada. |
| `CODEX_WORKFLOW.md` | Reemplazar por versión actualizada. |
| `PROJECT_CONTEXT_UFO_PREDICTOR.md` | Conservar como contexto fundacional/histórico. |

## Mantener como histórico opcional

| Archivo | Acción |
|---|---|
| `UFO_Predictor_Brief_Equipo.md` | Mantener si sirve para visión/equipo, no como fuente técnica principal. |
| `UFO_Predictor_Documentacion_Equipo.md` | Mantener si sirve para visión/equipo, no como fuente técnica principal. |
| `HUMAN_TECH_OVERVIEW.md` | Conservar como overview humano si no contradice estado actual. |
| `TEAM_BRIEF_AFTER_PROTOTYPE.md` | Mejor quitar de fuentes activas o marcar como histórico. |

## Quitar de fuentes activas técnicas

| Archivo | Motivo |
|---|---|
| `Prompts guias.pdf` | Documento de prompts/creativo; no es fuente técnica operativa del repo. |
| `TEAM_BRIEF_AFTER_PROTOTYPE.md` | Puede confundir porque describe una etapa superada. |

---

# Repo `/docs`

## Reemplazar/actualizar con versiones de este paquete

| Archivo destino | Archivo del paquete |
|---|---|
| `docs/START_HERE_FOR_NEW_CONVERSATIONS.md` | `START_HERE_FOR_NEW_CONVERSATIONS.md` |
| `docs/CURRENT_PROJECT_STATUS.md` | `CURRENT_PROJECT_STATUS.md` |
| `docs/EPIC_PROGRESS_MATRIX.md` | `EPIC_PROGRESS_MATRIX.md` |
| `docs/NEXT_EPICS_PLAN.md` | `NEXT_EPICS_PLAN.md` |
| `docs/ROADMAP_AND_BACKLOG.md` | `ROADMAP_AND_BACKLOG.md` |
| `docs/PROJECT_STATUS_FOR_MEETING.md` | `PROJECT_STATUS_FOR_MEETING.md` |
| `docs/ARCHITECTURE_SUMMARY.md` | `ARCHITECTURE_SUMMARY.md` |
| `docs/OPEN_DECISIONS.md` | `OPEN_DECISIONS.md` |
| `docs/IMPLEMENTATION_PLAN.md` | `IMPLEMENTATION_PLAN.md` |
| `docs/DATA_DICTIONARY.md` | `DATA_DICTIONARY.md` |
| `docs/MODEL_V01.md` | `MODEL_V01.md` |
| `docs/CODEX_WORKFLOW.md` | `CODEX_WORKFLOW.md` |

## Crear nuevos en `/docs`

| Archivo nuevo | Motivo |
|---|---|
| `docs/CODEX_HANDOFF_CURRENT.md` | Handoff corto para nuevas conversaciones de Codex. |
| `docs/CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md` | Fuente principal versionada para ChatGPT, opcional pero recomendada. |

## Conservar sin reemplazo completo

| Archivo | Acción |
|---|---|
| `docs/PROJECT_CONTEXT_UFO_PREDICTOR.md` | Conservar como contexto fundacional. Opcional agregar nota de que no es estado actual. |

## Revisar manualmente / opcional

| Archivo | Acción |
|---|---|
| `README.md` | Usar `README_UPDATE_NOTES.md` para actualizar sección de estado si se desea. |
| `lib/supabase/README.md` | Ya fue actualizado durante B05; revisar si sigue consistente. |
| `lib/prediction-engine/README.md` | Conservar si refleja B03 correctamente. |
| `lib/model-evaluation/README.md` | Conservar si refleja B04 correctamente. |

## No borrar del repo por ahora

No borrar documentación del repo salvo decisión explícita. Si algún documento queda histórico, agregar nota de contexto en lugar de eliminarlo.

---

# Orden recomendado de actualización manual

1. Reemplazar `START_HERE_FOR_NEW_CONVERSATIONS.md`.
2. Reemplazar `CURRENT_PROJECT_STATUS.md`.
3. Reemplazar `EPIC_PROGRESS_MATRIX.md`.
4. Reemplazar `NEXT_EPICS_PLAN.md`.
5. Reemplazar `ROADMAP_AND_BACKLOG.md`.
6. Crear `CODEX_HANDOFF_CURRENT.md`.
7. Crear `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`.
8. Actualizar documentos de soporte.
9. Subir fuentes actualizadas a ChatGPT.

---

# Rama sugerida para versionar estos cambios

```bash
git checkout main
git pull origin main
git checkout -b docs/update-project-context-after-lab-supabase
```

Commit sugerido:

```bash
git add README.md docs
git commit -m "docs: update project context after lab Supabase queries"
```
