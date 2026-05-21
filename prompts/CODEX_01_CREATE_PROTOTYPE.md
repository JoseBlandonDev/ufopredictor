# CODEX_01_CREATE_PROTOTYPE.md

## Prompt para crear el primer prototipo

Usar este prompt después de que Codex ya haya ejecutado el prompt de reconocimiento y haya confirmado que entiende los archivos de contexto.

---

Ahora sí crea el primer prototipo visual y estructural de **UFO Predictor**.

Antes de modificar archivos, confirma que leíste:

- `PROJECT_RULES.md`
- `docs/PROJECT_CONTEXT_UFO_PREDICTOR.md`
- `docs/DATA_DICTIONARY.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/MODEL_V01.md`
- `docs/ARCHITECTURE_SUMMARY.md`

## Objetivo

Crear un prototipo funcional con mock data, sin conectar todavía servicios reales.

## Stack obligatorio

- Next.js App Router.
- TypeScript.
- React.
- Tailwind CSS.
- shadcn/ui o componentes compatibles.
- Zod para schemas si hace falta.

## Rutas obligatorias

Crear estas rutas:

- `/`
- `/predictions`
- `/matches/[slug]`
- `/pricing`
- `/transparency`
- `/dashboard`
- `/admin`
- `/admin/beta-lab`

## Componentes mínimos

Crear componentes reutilizables:

- `Navbar`
- `Footer`
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

## Carpetas esperadas

Crear o respetar esta estructura:

- `app/`
- `components/`
- `lib/`
- `types/`
- `workers/`
- `prompts/`
- `docs/`
- `supabase/`

## Datos mock

Crear `lib/mock-data.ts` con:

- equipos.
- partidos.
- predicciones.
- planes dinámicos.
- performance del modelo.
- worker runs.

## Tipos TypeScript

Crear:

- `types/football.ts`
- `types/prediction.ts`
- `types/plans.ts`
- `types/database.ts`
- `types/email.ts`

## Skeletons/TODOs

Crear estructura base, pero sin conectar servicios reales:

- `lib/supabase/`
- `lib/football-api/`
- `lib/odds-api/`
- `lib/ai/`
- `lib/email/`
- `lib/permissions/`
- `workers/`

Debe quedar claro dónde se conectarán después:

- Supabase.
- Railway workers.
- Resend.
- API-Football/Sportmonks.
- The Odds API.
- OpenAI/Gemini/Claude.
- Pasarela de pagos.

## Reglas funcionales

- No conectar Supabase real todavía.
- No conectar Railway real todavía.
- No conectar Resend real todavía.
- No enviar emails reales.
- No conectar APIs deportivas reales.
- No conectar LLM real.
- No implementar pagos reales.
- No implementar módulo de polla/quiniela/pool.
- No prometer ganancias.
- No usar lenguaje de “apuesta segura”.
- Simular free vs premium con mock data.
- Premium debe mostrar locks visuales, pero la arquitectura debe dejar claro que en producción se filtrará en backend.

## Estilo visual

- Mobile-first.
- Futurista sobrio.
- Deportivo.
- Inspiración UFO/sci-fi sutil.
- Nada de estética casino barato.
- UI limpia, moderna y legible.

## Resultado esperado

Al final entrega:

1. Resumen de archivos creados/modificados.
2. Cómo correr localmente.
3. Qué quedó mockeado.
4. Qué skeletons quedaron listos.
5. Próximos pasos recomendados.
6. Cualquier decisión técnica que hayas tomado.

Si el repo ya tiene código, no lo borres sin explicar. Si hay conflicto entre archivos existentes y estos requisitos, avísame antes de hacer cambios destructivos.
