<!-- UFO Predictor | Updated roadmap after Beta Lab + Data Intake -->
<!-- Status assumes feature/data-intake-minimal has been committed, pushed, PR'd and merged before the team meeting. -->

# START_HERE_FOR_NEW_CONVERSATIONS.md — UFO Predictor

## Resumen rápido

UFO Predictor es una web/PWA de predicciones probabilísticas de fútbol, inicialmente enfocada en el Mundial 2026.

No es casa de apuestas, no recibe apuestas y no promete ganancias.

Principio central:

> El modelo estadístico calcula. La IA explica.

---

# Estado actual

El proyecto ya tiene:

- Prototipo visual Next.js.
- Supabase schema inicial.
- Supabase remoto aplicado.
- Supabase runtime clients.
- Auth real email/password.
- Roles `free_user` y `admin`.
- Dashboard/admin protegidos.
- Beta Lab Foundation.
- Data Intake Minimal.

La última épica cerrada antes de la reunión es:

```txt
feature/data-intake-minimal
```

Incluye `0004_data_intake_minimal.sql`, `match_results` y fuente/calidad de datos para fixtures internos.

---

# Lo que NO se debe rehacer

- No rehacer el prototipo.
- No recrear Next.js desde cero.
- No duplicar el schema inicial.
- No rehacer Auth.
- No convertir Beta Lab en producto público de ligas.

---

# Próxima épica sugerida

```txt
feature/prediction-engine-v01
```

Objetivo:

Crear el primer motor estadístico v0.1 para usarlo en Beta Lab.

No debe incluir:

- APIs deportivas reales.
- Odds reales.
- LLM.
- Pagos.
- Paywall.
- Workers reales.

---

# Flujo recomendado con Codex

1. Actualizar `main`.
2. Crear rama específica.
3. Pedir reconocimiento/acotación.
4. Revisar respuesta en ChatGPT.
5. Implementar alcance pequeño.
6. Correr lint/build.
7. Validar local/Supabase si aplica.
8. Commit/push/PR.

---

# Archivos clave

- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/OPEN_DECISIONS.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_V01.md`
- `docs/CODEX_WORKFLOW.md`

---

# Reglas permanentes

- No trabajar directo en `main`.
- No exponer secretos.
- No tocar `.env.local` desde Codex.
- No prometer ganancias.
- No implementar polla/quiniela/pool en el MVP principal.
- Los datos premium deben filtrarse desde backend.
- El LLM no decide resultados.
