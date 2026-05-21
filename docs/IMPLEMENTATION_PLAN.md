# IMPLEMENTATION_PLAN.md — UFO Predictor

Este plan divide el desarrollo en épicas. No está organizado por fechas porque el equipo trabajará en tiempo libre. El orden importa más que el calendario, pequeño detalle que evita convertir el proyecto en una máquina de culpa.

---

# Épica 1: Setup del proyecto

## Objetivo
Crear la base técnica y documental del proyecto.

## Tareas

1. Crear/usar repo GitHub `ufopredictor`.
2. Crear rama de trabajo `feature/project-context` para subir contexto.
3. Agregar archivos:
   - `PROJECT_RULES.md`
   - `docs/PROJECT_CONTEXT_UFO_PREDICTOR.md`
   - `docs/DATA_DICTIONARY.md`
   - `docs/IMPLEMENTATION_PLAN.md`
   - `prompts/CODEX_00_RECOGNIZE_CONTEXT.md`
   - `prompts/CODEX_01_CREATE_PROTOTYPE.md`
4. Crear `.env.example`.
5. Crear README inicial.
6. Definir convención de ramas.

## Criterio de listo
El repo tiene el contexto completo subido y puede ser leído por Codex antes de escribir código.

---

# Épica 2: Prototipo visual con mock data

## Objetivo
Crear primera versión navegable sin conectar servicios reales.

## Tareas

1. Inicializar Next.js App Router + TypeScript.
2. Instalar Tailwind CSS.
3. Instalar/configurar shadcn/ui.
4. Crear layout base.
5. Crear `lib/mock-data.ts`.
6. Crear páginas:
   - `/`
   - `/predictions`
   - `/matches/[slug]`
   - `/pricing`
   - `/transparency`
   - `/dashboard`
   - `/admin`
   - `/admin/beta-lab`
7. Crear componentes:
   - `MatchCard`
   - `PredictionSummaryCard`
   - `ProbabilityBar`
   - `ConfidenceBadge`
   - `RiskBadge`
   - `PremiumLockCard`
   - `PlanCard`
   - `PredictionTimeline`
   - `GoldenHourDelta`
   - `ModelVsMarket`
   - `TransparencyStats`
   - `AdminWorkerStatus`
8. Simular free vs premium con props/mock.

## Criterio de listo
La app corre localmente y se puede navegar con datos mock.

---

# Épica 3: Tipos y contratos internos

## Objetivo
Crear tipos TypeScript coherentes antes de conectar base de datos real.

## Tareas

1. Crear `types/football.ts`.
2. Crear `types/prediction.ts`.
3. Crear `types/plans.ts`.
4. Crear `types/database.ts`.
5. Crear `types/email.ts`.
6. Alinear mock data con estos tipos.

## Criterio de listo
El prototipo usa tipos compartidos y no objetos sueltos inventados en cada componente.

---

# Épica 4: Sistema de planes dinámicos mock

## Objetivo
Simular la lógica de planes dinámicos desde el prototipo.

## Tareas

1. Crear mock de planes:
   - Free.
   - World Cup Pass.
   - 10 Match Pack.
   - Knockout Pass.
   - Semifinals + Final Pass.
   - Team Pass.
   - Premium Monthly.
2. Crear tipos `Plan`, `PlanFeature`, `UserEntitlement`, `UserMatchUnlock`.
3. Crear helper mock `canAccessMatch`.
4. Crear UI de features por plan.
5. Crear componentes de bloqueo premium.

## Criterio de listo
La página `/pricing` y `/matches/[slug]` muestran diferencias free/premium coherentes.

---

# Épica 5: Motor predictivo v0.1 mock/funcional local

## Objetivo
Implementar el modelo estadístico en código puro, usando datos fake al inicio.

## Tareas

1. Crear carpeta `lib/prediction-engine/`.
2. Implementar:
   - `normalize.ts`
   - `team-power.ts`
   - `expected-goals.ts`
   - `poisson.ts`
   - `markets.ts`
   - `confidence-risk.ts`
   - `generate-prediction.ts`
3. Implementar Poisson.
4. Generar matriz de marcadores.
5. Calcular 1X2.
6. Calcular Over/Under 2.5.
7. Calcular BTTS.
8. Calcular top 3 marcadores.
9. Calcular confidence y risk.
10. Mostrar resultado en UI.

## Criterio de listo
El prototipo puede generar una predicción local a partir de inputs mock.

---

# Épica 6: Skeleton de Supabase

## Objetivo
Preparar estructura para conectar Supabase después.

## Tareas

1. Crear `lib/supabase/client.ts`.
2. Crear `lib/supabase/server.ts`.
3. Crear placeholders de queries.
4. Crear carpeta `supabase/migrations`.
5. Crear SQL draft o notas con tablas principales.
6. Crear TODOs para RLS.

## Criterio de listo
El código tiene lugar claro para conectar Supabase sin reescribir toda la app.

---

# Épica 7: Skeleton de APIs externas

## Objetivo
Preparar integración futura con API-Football/Sportmonks y odds.

## Tareas

1. Crear `lib/football-api/provider.ts`.
2. Crear `lib/football-api/api-football.ts`.
3. Crear `lib/football-api/sportmonks.ts`.
4. Crear `lib/odds-api/provider.ts`.
5. Definir interfaces:
   - `fetchFixtures`.
   - `fetchLineups`.
   - `fetchResults`.
   - `fetchOdds`.
6. No llamar APIs reales todavía.

## Criterio de listo
La arquitectura permite cambiar proveedor sin reescribir UI o workers.

---

# Épica 8: Skeleton de workers

## Objetivo
Dejar estructura de workers/crons lista para Railway.

## Tareas

1. Crear carpeta `workers/`.
2. Crear workers vacíos con TODOs:
   - `sync-fixtures.ts`
   - `sync-teams.ts`
   - `sync-form.ts`
   - `sync-odds.ts`
   - `sync-lineups.ts`
   - `generate-prediction.ts`
   - `generate-narrative.ts`
   - `validate-results.ts`
   - `alert-premium.ts`
   - `send-daily-summary.ts`
   - `check-plan-expirations.ts`
3. Crear helper `lib/workers/run-worker.ts`.
4. Crear mock worker runs para admin.

## Criterio de listo
Admin/Beta Lab puede mostrar workers mock y el repo tiene estructura real para implementarlos después.

---

# Épica 9: Skeleton de IA narrativa

## Objetivo
Preparar capa intercambiable para OpenAI/Gemini/Claude.

## Tareas

1. Crear `lib/ai/provider.ts`.
2. Crear `lib/ai/schemas/prediction-narrative.ts`.
3. Crear `prompts/narrative.ts`.
4. Crear función mock `generateNarrative`.
5. Validar output conceptual con Zod.
6. No llamar LLM real todavía.

## Criterio de listo
El prototipo puede mostrar narrativa mock con estructura lista para LLM real.

---

# Épica 10: Skeleton de Resend

## Objetivo
Preparar emails transaccionales y alertas.

## Tareas

1. Crear `lib/email/resend.ts`.
2. Crear `lib/email/send-email.ts`.
3. Crear templates:
   - `welcome.tsx`.
   - `purchase-confirmation.tsx`.
   - `golden-hour-alert.tsx`.
   - `daily-summary.tsx`.
   - `plan-expiration.tsx`.
4. Usar mocks/TODOs, no enviar emails reales.

## Criterio de listo
La estructura de Resend existe y no rompe build aunque no haya API key.

---

# Épica 11: Admin/Beta Lab

## Objetivo
Crear panel interno para visualizar estado del sistema.

## Tareas

1. Crear `/admin`.
2. Crear `/admin/beta-lab`.
3. Mostrar partidos mock.
4. Mostrar predicciones mock.
5. Mostrar worker runs mock.
6. Mostrar métricas mock.
7. Crear botones deshabilitados/TODO:
   - Recalcular predicción.
   - Regenerar narrativa.
   - Sync odds.

## Criterio de listo
Existe panel visual para operación futura.

---

# Épica 12: Transparency Center

## Objetivo
Mostrar rendimiento del modelo.

## Tareas

1. Crear mock de predicciones pasadas.
2. Mostrar accuracy por mercado.
3. Mostrar tabla de historial.
4. Mostrar pre-lineup vs post-lineup.
5. Agregar disclaimers.

## Criterio de listo
La página `/transparency` existe y comunica transparencia sin prometer resultados.

---

# Épica 13: Preparación para Railway

## Objetivo
Dejar el proyecto listo para despliegue futuro.

## Tareas

1. Crear `.env.example`.
2. Crear notas de Railway en README.
3. Evitar dependencias innecesarias.
4. Confirmar `npm run build`.
5. Confirmar `npm run dev`.

## Criterio de listo
El proyecto puede correr local y está listo para configurar Railway después.

---

# Épica 14: QA inicial

## Objetivo
Evitar errores obvios en el prototipo.

## Tareas

1. Revisar rutas.
2. Revisar responsive.
3. Revisar imports.
4. Revisar TypeScript.
5. Revisar que no haya secretos.
6. Revisar que no se haya incluido módulo de polla/quiniela.
7. Revisar que no haya promesas de ganancias.

## Criterio de listo
El prototipo compila y representa correctamente el MVP.

---

# Orden recomendado

1. Épica 1: Setup.
2. Épica 2: UI mock.
3. Épica 3: Tipos.
4. Épica 4: Planes dinámicos mock.
5. Épica 5: Motor predictivo local.
6. Épica 6-10: Skeletons de integraciones.
7. Épica 11: Admin/Beta Lab.
8. Épica 12: Transparency.
9. Épica 13: Railway readiness.
10. Épica 14: QA.

---

# Primer prototipo funcional mínimo

Debe demostrar:

- Home funcional.
- Listado de partidos mock.
- Detalle de partido mock.
- Planes dinámicos mock.
- Simulación free/premium.
- Prediction Timeline.
- Golden Hour Delta mock.
- Model vs Market mock.
- Transparency Center mock.
- Admin/Beta Lab mock.
- Skeletons de Supabase, Resend, APIs externas, LLM y workers.
