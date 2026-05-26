# EPIC_PROGRESS_MATRIX.md — UFO Predictor

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Matriz de progreso

| ID | Épica / tarea | Estado | Notas |
|---|---|---|---|
| A01 | Project context & docs foundation | Done | Fuentes iniciales creadas. |
| A02 | Initial UFO Predictor prototype | Done | Prototipo Next/Tailwind inicial. |
| A03 | Initial Supabase schema | Done | Schema base. |
| A04 | Match season/competition integrity | Done | Integridad corregida. |
| A05 | Supabase runtime clients | Done | Browser/server clients. |
| A06 | Supabase auth and role guards | Done | Email/password + `free_user`/`admin`. |
| B01 | Beta Lab Foundation | Done | `/admin/beta-lab` protegido. |
| B02 | Data Intake Foundation | Done | Fixtures/resultados mínimos. |
| B03 | Prediction Engine v0.1 Lab | Done | `lib/prediction-engine/` + tests. |
| SEC01 | Restrict lab match results RLS | Done | RLS reforzada para resultados Lab. |
| B04 | Model Evaluation Lab | Done | `lib/model-evaluation/` + tests. |
| B05 | Lab Supabase Queries | Done | `/admin/beta-lab` lee datos reales. |
| B06a | Lab Fixture Review Actions | Done | PR #15, migración `0007`. |
| B06b | Lab Match Result Actions | Done | PR #16, migración `0008`. |
| B06-pre | Seed Internal Lab Prediction Markets | Done | PR #17, migración `0009`. |
| B06c | Lab Evaluation Persistence | Done | PR #18, migración `0010`. |
| DOCS01 | Update context after Lab Admin Flow | Next | Sincronizar docs/fuentes. |
| C01 | Public Predictions from DB | Next | Conectar `/predictions` a datos publicables. |
| C02 | Plans & Entitlements Backend | Next | Base real free/premium/admin. |
| C03 | Paywall Enforcement | Later | Backend gating, no solo UI. |
| C04 | Transparency Real v0.1 | Later | Métricas desde `prediction_results`. |
| C05 | Match Detail from DB | Later | `/matches/[slug]` real. |
| C06 | Staging Deploy | Later | Deploy estable para QA. |
| C07 | QA/Security Pass | Later | Revisión RLS, auth, rutas. |
| D01 | Google Auth | Later | Mejora UX auth. |
| D02 | Supabase CLI Local Setup | Later | Flujo local sano. |
| E01 | Sports API ingestion | Later | Datos externos reales. |
| E02 | Odds ingestion | Later | Mercado/cuotas. |
| E03 | Worker pipeline | Later | Automatización. |
| E04 | LLM narrative | Later | IA explica outputs ya calculados. |
| E05 | Payments | Later | Comercialización real. |

---

## Estado por bloque

### Fundación

Estado: **cerrada para MVP interno**.

### Lab interno

Estado: **cerrado en núcleo operativo**.

El Lab ya permite:

```txt
fixture review + match result entry + prediction markets + evaluation persistence
```

### Producto público

Estado: **pendiente**.

Superficies públicas siguen mock/parciales:

- `/predictions`;
- `/matches/[slug]`;
- `/pricing`;
- `/transparency`.

---

## Siguiente foco

1. Actualizar documentación.
2. Definir criterio `internal_lab → public_product`.
3. Implementar `feature/public-predictions-from-db`.
