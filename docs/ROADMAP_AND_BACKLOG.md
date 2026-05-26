# ROADMAP_AND_BACKLOG.md — UFO Predictor

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Roadmap actualizado

### Fase 1 — Fundación técnica

Estado: **Done**

- Proyecto Next.js.
- Prototipo inicial.
- Supabase schema inicial.
- Auth/roles.
- Admin guard.
- Runtime clients.

### Fase 2 — Lab interno

Estado: **Done para MVP interno de desarrolladores**

Incluye:

- Beta Lab Foundation.
- Data Intake Minimal.
- Prediction Engine v0.1.
- Model Evaluation Lab.
- Lab Supabase Queries.
- Fixture Review Actions.
- Match Result Actions.
- Internal Lab Prediction Markets Seed.
- Lab Evaluation Persistence.

Resultado:

```txt
/admin/beta-lab ya permite operar manualmente el ciclo interno de evaluación del modelo.
```

### Fase 3 — Producto público mínimo

Estado: **Next**

Objetivo: que superficies públicas consuman datos reales de Supabase sin exponer Lab ni premium indebidamente.

Backlog recomendado:

1. `feature/public-predictions-from-db`
2. `feature/match-detail-from-db`
3. `feature/plans-entitlements-backend`
4. `feature/paywall-enforcement`
5. `feature/transparency-real-v01`
6. `feature/staging-deploy`
7. `feature/qa-security-pass`

### Fase 4 — Automatización y datos externos

Estado: **Later**

- API deportiva.
- Workers reales.
- Sync fixtures/results.
- Odds ingestion.
- Backtesting batch.
- Observabilidad.

### Fase 5 — Comercial/IA

Estado: **Later**

- Pagos.
- LLM narrativo.
- Google Auth.
- Correos/notificaciones.

---

## Backlog por prioridad

### P0 — inmediato

#### DOCS01 — Update project context after Lab Admin Flow

Actualizar docs/fuentes para que conversaciones nuevas no intenten rehacer B06.

### P1 — MVP público mínimo

#### C01 — Public Predictions from DB

Conectar `/predictions` a Supabase.

Pendiente decisión:

```txt
Qué datos son public_product y cómo se separan de internal_lab.
```

#### C02 — Plans & Entitlements Backend

Base real de permisos free/premium/admin.

#### C03 — Paywall Enforcement

Filtrado backend. No enviar premium al cliente sin permiso.

#### C04 — Transparency Real v0.1

Métricas reales desde `prediction_results`.

### P2 — Operación

#### C06 — Staging Deploy

Deploy estable para QA.

#### C07 — QA/Security Pass

Revisión de:

- RLS;
- grants;
- server actions;
- rutas admin;
- exposición accidental de Lab.

### P3 — Mejoras

- Supabase CLI local.
- Google Auth.
- Mejor UX admin.
- Backtesting manual/semiautomático.

### P4 — Automatización avanzada

- Sports API.
- Odds.
- Workers.
- LLM narrative.
- Payments.

---

## No alcance para el siguiente sprint

- No pagos.
- No LLM.
- No odds.
- No workers.
- No API deportiva.
- No rehacer Lab.
- No convertir Lab en producto público.
