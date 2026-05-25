# CURRENT_PROJECT_STATUS.md — UFO Predictor

## 1. Propósito

Este documento resume el estado operativo actual de **UFO Predictor** para que una nueva conversación de ChatGPT, Codex o cualquier integrante del equipo pueda entender rápidamente dónde está el proyecto y qué sigue.

No reemplaza los documentos técnicos principales. Su función es evitar que cada nueva sesión tenga que reconstruir contexto desde cero.

---

## 2. Estado actual del proyecto

El primer prototipo base de **UFO Predictor** ya fue creado y mergeado en la rama `main` del repositorio.

El proyecto ya no está en fase de idea ni de prototipo desde cero. La siguiente etapa es convertir la simulación/mock en módulos funcionales reales, trabajando por épicas y ramas separadas.

---

## 3. Qué existe actualmente

El prototipo actual incluye:

- Web/PWA inicial construida con Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Branding visual básico de UFO Predictor.
- Interfaz visible en español.
- Código, tipos, nombres de componentes y estructura técnica en inglés.
- Datos mock para partidos, predicciones, planes, métricas y workers.
- Assets de marca en `public/brand/`.
- Rutas principales navegables:
  - `/`
  - `/predictions`
  - `/matches/[slug]`
  - `/pricing`
  - `/transparency`
  - `/dashboard`
  - `/admin`
  - `/admin/beta-lab`
- Componentes base para:
  - partidos,
  - probabilidades,
  - badges de confianza/riesgo,
  - planes,
  - locks premium,
  - Prediction Timeline,
  - Golden Hour Delta,
  - Model vs Market,
  - Transparency Center,
  - Admin/Beta Lab.
- Skeletons/TODOs para:
  - Supabase,
  - API deportiva,
  - odds,
  - Resend,
  - IA narrativa,
  - workers,
  - motor predictivo,
  - permisos/paywall.

---

## 4. Qué NO existe todavía

El proyecto todavía no tiene:

- Supabase real conectado.
- Base de datos real.
- Auth real.
- Roles reales.
- RLS real.
- Paywall backend real.
- Planes dinámicos desde base de datos.
- Pagos reales.
- API deportiva real.
- Odds reales.
- Motor predictivo funcional.
- LLM real.
- Narrativa IA real.
- Resend real.
- Emails reales.
- Workers Railway reales.
- Admin/Beta Lab operativo.
- Transparency Center con resultados reales.
- Deploy/staging final.
- Módulo de polla/quiniela/pool dentro del MVP principal.

---

## 5. Qué NO se debe rehacer

No se debe crear de nuevo:

- Otro prototipo base desde cero.
- Otra estructura inicial de Next.js.
- Otro sistema de branding inicial.
- Otra documentación masiva de contexto general.
- Otro mock completo de páginas principales salvo que se esté haciendo una épica de UI polish.

El prototipo actual debe tratarse como base de trabajo, no como algo desechable.

---

## 6. Documentos importantes del proyecto

Antes de modificar código, revisar:

- `PROJECT_RULES.md`
- `README.md`
- `.env.example`
- `docs/PROJECT_CONTEXT_UFO_PREDICTOR.md`
- `docs/ARCHITECTURE_SUMMARY.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_V01.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/HUMAN_TECH_OVERVIEW.md`
- `docs/TEAM_BRIEF_AFTER_PROTOTYPE.md`
- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/CODEX_WORKFLOW.md`
- `docs/OPEN_DECISIONS.md`

---

## 7. Principios que siguen vigentes

- UFO Predictor es una web/PWA, no una app nativa en esta fase.
- No es casa de apuestas.
- No recibe apuestas.
- No promete ganancias.
- No debe usar lenguaje como “apuesta segura”, “fixed” o “100% ganador”.
- El módulo de polla/quiniela/pool queda fuera del MVP principal actual.
- Los datos premium deben filtrarse en backend, no solo bloquearse visualmente.
- El modelo estadístico calcula; la IA explica.
- El LLM no debe inventar probabilidades ni decidir resultados.
- El producto debe hablar de probabilidades, riesgo, señales y transparencia.

---

## 8. Orden recomendado de próximas épicas

### 1. Supabase schema

Rama sugerida:

```txt
feature/supabase-schema
```

Objetivo:

Crear migraciones, seed mínimo y estructura inicial de base de datos.

Debe desbloquear:

- Auth,
- roles,
- planes,
- entitlements,
- matches reales,
- predicciones persistidas,
- workers,
- admin real,
- transparency real.

Alcance inicial recomendado:

- Crear `supabase/migrations/`.
- Crear migración inicial basada en `docs/DATA_DICTIONARY.md`.
- Crear `supabase/seed/` con datos mínimos.
- Alinear `types/database.ts`.
- No conectar todavía toda la UI.
- No implementar auth completo en esta misma rama.
- No implementar pagos.
- No conectar APIs reales.

---

### 2. Motor predictivo v0.1

Rama sugerida:

```txt
feature/prediction-engine-v01
```

Puede avanzar en paralelo con Supabase schema si se mantiene como código puro.

Alcance recomendado:

- Implementar funciones puras en `lib/prediction-engine/`.
- Usar datos mock.
- Implementar tests.
- No conectar DB.
- No llamar LLM.
- No llamar API deportiva.
- No tocar UI salvo una demo mínima si se decide explícitamente.

---

### 3. Auth y roles

Rama sugerida:

```txt
feature/auth-roles
```

Depende de Supabase schema.

---

### 4. Planes dinámicos y paywall

Rama sugerida:

```txt
feature/dynamic-plans-paywall
```

Depende de Supabase schema y Auth.

---

### 5. API deportiva

Rama sugerida:

```txt
feature/football-api
```

Debe esperar la decisión del proveedor o iniciar con interfaz neutral.

---

### 6. Odds y Model vs Market

Rama sugerida:

```txt
feature/odds-model-market
```

Depende de schema, motor predictivo y decisión de proveedor de odds.

---

### 7. Workers Railway

Rama sugerida:

```txt
feature/railway-workers
```

Depende de schema y de algunos módulos previos.

---

### 8. Resend/emails

Rama sugerida:

```txt
feature/resend-emails
```

Depende de Auth, planes/paywall y workers.

---

### 9. Admin/Beta Lab real

Rama sugerida:

```txt
feature/admin-beta-lab-real
```

Depende de Auth, Supabase, workers y motor predictivo.

---

### 10. Transparency Center real

Rama sugerida:

```txt
feature/transparency-real
```

Depende de Supabase, resultados reales, workers y motor predictivo.

---

### 11. UI polish/mobile

Rama sugerida:

```txt
feature/ui-polish-mobile
```

Puede esperar hasta tener más datos reales.

---

### 12. Deploy/staging

Rama sugerida:

```txt
feature/staging-deploy
```

Puede avanzar cuando el proyecto tenga una base más estable para probar.

---

## 9. Posible trabajo paralelo

Puede haber trabajo paralelo si se respetan ramas y carpetas:

- Persona A: `feature/supabase-schema`.
- Persona B: `feature/prediction-engine-v01`.
- Persona C: evaluación de proveedores deportivos o UI polish menor.

Evitar que varias personas trabajen al mismo tiempo sobre las mismas páginas o componentes sin coordinación.

---

## 10. Qué vive en repo y qué vive en Drive

### Repo

Debe contener:

- código,
- documentación técnica,
- roadmap markdown,
- diccionario de datos,
- modelo predictivo,
- decisiones abiertas,
- workflow de Codex,
- contexto operativo.

### Drive / Google Sheets

Debe contener:

- backlog tracker operativo,
- asignación humana de tareas,
- documentos compartidos para lectura del equipo,
- briefs creativos,
- referencias visuales,
- material de publicidad.

No subir el Excel vivo del backlog al repo salvo que se decida guardar una copia congelada. Para gestión diaria, usar Google Sheets.

---

## 11. Decisiones abiertas importantes

Ver `docs/OPEN_DECISIONS.md`.

Las principales decisiones pendientes son:

- API-Football vs Sportmonks.
- Proveedor de odds.
- OpenAI vs Gemini vs Claude para narrativa.
- Pasarela de pago.
- Precios exactos.
- Dominio final.
- Estrategia de Auth.
- Estrategia de Supabase CLI/local/remoto.
- Estrategia de testing.
- Analytics.

---

## 12. Recomendación inmediata

Antes de iniciar cualquier épica:

1. Actualizar `main` local.
2. Revisar que el prototipo corre.
3. Leer documentación.
4. Crear rama específica.
5. Trabajar una sola épica.
6. Correr lint/build.
7. Abrir PR.

Primera épica recomendada:

```txt
feature/supabase-schema
```

Segunda épica posible en paralelo:

```txt
feature/prediction-engine-v01
```
