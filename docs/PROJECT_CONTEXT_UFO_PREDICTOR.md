# PROJECT_CONTEXT_UFO_PREDICTOR.md

## 0. Propósito de este documento

Este documento le da a Codex y a cualquier otra IA de desarrollo el contexto completo del proyecto **UFO Predictor** para crear el primer prototipo de la web/PWA. Está pensado para vivir dentro del repositorio, idealmente en `/docs/PROJECT_CONTEXT_UFO_PREDICTOR.md`.

No es un documento de marketing. Es una especificación de producto + arquitectura + implementación inicial. Codex debe leerlo antes de generar código.

---

# 1. Resumen ejecutivo

**UFO Predictor** será una web/PWA de predicciones de fútbol con IA, inicialmente enfocada en el Mundial 2026. El producto usará datos históricos, forma reciente, cuotas de mercado, alineaciones oficiales y un modelo estadístico propio para generar probabilidades y análisis.

La narrativa de marca gira alrededor de inteligencias extraterrestres que detectan una anomalía en la Tierra: cada cuatro años, millones de humanos detienen sus vidas por una esfera durante 90 minutos. UFO Predictor sería el sistema creado para decodificar ese caos con datos, probabilidades e inteligencia no humana.

El producto no es una casa de apuestas, no recibe apuestas y no promete ganancias. Es una herramienta de análisis predictivo y probabilístico.

---

# 2. Principios del producto

## 2.1 Qué es

- Web/PWA de predicciones de fútbol.
- Plataforma de análisis probabilístico.
- Producto freemium con planes dinámicos.
- Sistema con datos vivos, workers y predicciones versionadas.
- Narrativa IA en español e inglés.

## 2.2 Qué no es

- No es app nativa en esta fase.
- No es casa de apuestas.
- No recibe dinero para apostar.
- No promete ganancias.
- No es un grupo VIP de picks.
- No usa el LLM para adivinar resultados.
- No incluye en este MVP el módulo de polla/quiniela/pool. Ese módulo se manejará aparte.

## 2.3 Claim provisional

Español:

> Predicciones de fútbol con IA, actualizadas y verificables.

Inglés:

> AI football predictions, updated and verified.

---

# 3. Usuario objetivo

## 3.1 Usuarios principales

- Fans del Mundial que quieren analizar partidos.
- Apostadores casuales que quieren más datos antes de decidir.
- Usuarios que participan en dinámicas sociales o grupos de fútbol.
- Personas interesadas en predicciones, estadísticas y comparaciones de cuotas.

## 3.2 Necesidades

- Ver qué equipo tiene más probabilidad de ganar.
- Entender por qué el modelo predice cierto escenario.
- Ver marcador probable y mercados básicos.
- Recibir actualizaciones cuando salen alineaciones oficiales.
- Comparar modelo vs mercado.
- Ver rendimiento histórico del modelo.

---

# 4. Funcionalidades del MVP principal

## 4.1 Páginas principales

### `/`
Home / Landing.

Debe incluir:

- Hero con narrativa UFO / Mundial 2026.
- CTA a predicciones.
- Top partidos destacados.
- Cómo funciona.
- Free vs Premium.
- Bloque de transparencia.
- Disclaimer.

### `/predictions`
Predicciones del día.

Debe mostrar:

- Lista de partidos.
- Equipos, banderas/logos, hora.
- Probabilidades 1X2.
- Confidence Score.
- Risk Level.
- Estado de predicción: pre-match, post-lineup, pre-kickoff.
- Bloqueo visual de features premium.

### `/matches/[slug]`
Detalle de partido.

Debe mostrar:

- Header del partido.
- Probabilidades 1X2.
- Expected goals.
- Marcador probable.
- Top 3 marcadores.
- Over/Under 2.5.
- BTTS.
- Model vs Market.
- Prediction Timeline.
- Golden Hour Delta.
- Why It Changed.
- Análisis IA.
- CTA a premium si aplica.

### `/pricing`
Planes dinámicos.

Debe mostrar inicialmente:

- Free.
- World Cup Pass.
- 10 Match Pack.

Debe estar preparado para mostrar:

- Knockout Pass.
- Semifinals + Final Pass.
- Team Pass.
- Premium Monthly.

### `/transparency`
Transparency Center.

Debe mostrar:

- Accuracy general.
- Accuracy por mercado.
- Predicciones pasadas.
- Pre-lineup vs post-lineup.
- Desglose básico por competición.

### `/dashboard`
Área del usuario.

Debe mostrar:

- Plan actual.
- Partidos desbloqueados.
- Accesos disponibles.
- Preferencias.

### `/admin` y `/admin/beta-lab`
Panel interno.

Debe mostrar:

- Partidos beta.
- Predicciones generadas.
- Estado de workers.
- Logs.
- Recalcular predicción.
- Regenerar narrativa.

---

# 5. Features diferenciales

## 5.1 Prediction Timeline

Muestra la evolución de la predicción:

- T-24h: predicción inicial.
- T-6h: actualización con cuotas/datos.
- T-60min: actualización con alineaciones.
- Pre-kickoff: predicción final.

## 5.2 Golden Hour Delta

Actualización premium cuando salen alineaciones oficiales.

Ejemplo:

- Antes: Portugal gana 48%.
- Después: Portugal gana 43%.
- Cambio: -5%.
- Motivo: delantero titular fuera del once.

## 5.3 Why It Changed

Explicación generada por IA cuando cambia la predicción.

## 5.4 Model vs Market

Comparación entre probabilidad del modelo y probabilidad implícita de cuotas.

## 5.5 Transparency Center

Rendimiento real del modelo, incluyendo aciertos y fallos.

---

# 6. Stack técnico definido

## 6.1 Lenguajes y frameworks

- TypeScript.
- Next.js App Router.
- React.
- Tailwind CSS.
- shadcn/ui.
- Zod.

## 6.2 Infraestructura

- Railway: hosting/runtime principal del MVP.
- Supabase: Postgres, Auth, RLS, Storage.
- GitHub: repositorio y colaboración.

## 6.3 Servicios externos

- API-Football o Sportmonks: datos deportivos.
- The Odds API u odds del proveedor principal: cuotas.
- OpenAI/Gemini/Claude API: narrativa IA.
- Resend + React Email: emails transaccionales y alertas.
- PostHog + GA4: analytics.
- Stripe / PayPal / Mercado Pago: pagos, pendiente de decisión.

---

# 7. Arquitectura final recomendada

```txt
GitHub Monorepo
        ↓
Railway
  - Next.js Web/PWA
  - API Routes / Server Actions
  - Workers / Cron Jobs
        ↓
Supabase
  - PostgreSQL
  - Auth
  - RLS
  - Storage
        ↓
Servicios externos
  - API-Football / Sportmonks
  - Odds provider
  - OpenAI / Gemini / Claude
  - Resend
  - Payment provider
```

## 7.1 Por qué Railway

Railway se recomienda sobre Vercel para el MVP porque el proyecto tendrá workers, crons, procesos backend y datos vivos. Vercel es excelente para Next.js puro y frontend global, pero este MVP necesita más backend dinámico.

## 7.2 Por qué Supabase

Supabase evita construir desde cero:

- Auth.
- PostgreSQL.
- RLS.
- Storage.
- Dashboard de base de datos.

No reemplazar Supabase con Railway Postgres en el MVP.

---

# 8. Estructura esperada del proyecto

```txt
app/
  page.tsx
  predictions/
    page.tsx
  matches/
    [slug]/
      page.tsx
  pricing/
    page.tsx
  transparency/
    page.tsx
  dashboard/
    page.tsx
  admin/
    page.tsx
    beta-lab/
      page.tsx
  api/
    predictions/
    matches/
    plans/
    cron/

components/
  layout/
  match/
  prediction/
  plans/
  paywall/
  transparency/
  admin/
  ui/

lib/
  supabase/
  prediction-engine/
  football-api/
  odds-api/
  ai/
  email/
  permissions/
  i18n/
  mock-data.ts
  utils.ts

workers/
  sync-fixtures.ts
  sync-teams.ts
  sync-form.ts
  sync-odds.ts
  sync-lineups.ts
  generate-prediction.ts
  generate-narrative.ts
  validate-results.ts
  alert-premium.ts
  send-daily-summary.ts
  check-plan-expirations.ts

types/
  football.ts
  prediction.ts
  plans.ts
  database.ts
  email.ts

prompts/
  narrative.ts
  why-it-changed.ts

docs/
  PROJECT_CONTEXT_UFO_PREDICTOR.md
  IMPLEMENTATION_PLAN.md
  DATA_DICTIONARY.md
  CODEX_PROMPTS.md

supabase/
  migrations/
  seed/
```

---

# 9. Componentes iniciales requeridos

- `Navbar`.
- `Footer`.
- `MatchCard`.
- `PredictionSummaryCard`.
- `ProbabilityBar`.
- `ConfidenceBadge`.
- `RiskBadge`.
- `PremiumLockCard`.
- `PlanCard`.
- `PredictionTimeline`.
- `GoldenHourDelta`.
- `ModelVsMarket`.
- `TransparencyStats`.
- `AdminWorkerStatus`.

---

# 10. Datos mock iniciales

Crear `lib/mock-data.ts` con:

- equipos ficticios/reales de ejemplo.
- partidos mock.
- predicciones mock.
- planes mock.
- performance mock.
- worker runs mock.

Ejemplo de partido:

```ts
{
  id: "match_colombia_portugal",
  slug: "colombia-vs-portugal",
  competition: "World Cup 2026",
  stage: "Group Stage",
  homeTeam: { name: "Colombia", flag: "🇨🇴" },
  awayTeam: { name: "Portugal", flag: "🇵🇹" },
  kickoffAt: "2026-06-18T20:00:00Z",
  status: "scheduled"
}
```

---

# 11. Modelo predictivo v0.1

## 11.1 Principio

El modelo estadístico calcula. La IA explica.

## 11.2 Flujo

```txt
Datos normalizados
↓
Team Power Score
↓
Expected Goals
↓
Poisson
↓
Matriz de marcadores
↓
1X2 / Over-Under / BTTS / marcador probable
↓
Market Blend
↓
Confidence / Risk
↓
Narrativa IA
```

## 11.3 Team Power Score

```txt
Team Power Score =
25% rating/ELO
20% forma reciente
15% ataque reciente
15% defensa reciente
15% señal de mercado/cuotas
10% alineación/contexto
```

## 11.4 Mercados iniciales

- 1X2.
- Marcador probable.
- Top 3 marcadores.
- Over/Under 2.5.
- BTTS.
- Model vs Market.

## 11.5 No implementar todavía

- Goleadores.
- Tarjetas.
- Corners.
- Asistencias.
- Parlays.
- Apuestas directas.

---

# 12. Planes dinámicos

El sistema debe permitir planes configurables desde base de datos.

## 12.1 Planes iniciales visibles

### Free

Incluye:

- 1X2 básico.
- Confidence básico.
- Risk básico.
- Resumen corto IA.
- 1 análisis completo gratis al día.

### World Cup Pass

Incluye:

- Todos los partidos del Mundial.
- Análisis premium.
- Golden Hour Delta.
- Prediction Timeline.
- Model vs Market.
- Alertas premium.

### 10 Match Pack

Incluye:

- Elegir 10 partidos.
- Acceso premium solo a esos partidos.

## 12.2 Planes preparados para activar después

- Knockout Pass.
- Semifinals + Final Pass.
- Team Pass.
- Premium Monthly.
- Daily Pass.

## 12.3 Concepto de permisos

Usar `user_entitlements` y `user_match_unlocks` para no depender solo de una suscripción fija.

---

# 13. Resend y emails

## 13.1 Uso de Resend

Resend se usará para emails transaccionales y alertas.

## 13.2 Emails MVP

- Bienvenida.
- Confirmación de compra.
- Golden Hour Alert.
- Resumen diario.
- Plan próximo a vencer.

## 13.3 Estructura esperada

```txt
lib/email/
  resend.ts
  send-email.ts
  templates/
    welcome.tsx
    purchase-confirmation.tsx
    golden-hour-alert.tsx
    daily-summary.tsx
    plan-expiration.tsx
```

---

# 14. Workers/crons

## 14.1 Workers del MVP

- `sync-fixtures`.
- `sync-teams`.
- `sync-form`.
- `sync-odds`.
- `sync-lineups`.
- `generate-prediction`.
- `generate-narrative`.
- `validate-results`.
- `alert-premium`.
- `send-daily-summary`.
- `check-plan-expirations`.

## 14.2 Logging obligatorio

Todo worker debe registrar:

- nombre.
- estado.
- inicio.
- fin.
- registros procesados.
- error si existe.
- metadata.

Tabla: `worker_runs`.

---

# 15. Reglas de paywall

## 15.1 Free puede ver

- Probabilidades 1X2.
- Confidence básico.
- Risk básico.
- Resumen corto.
- Algunos análisis completos promocionales.

## 15.2 Premium puede ver

- Expected goals.
- Top 3 marcadores.
- Over/Under.
- BTTS.
- Model vs Market.
- Golden Hour Delta.
- Why It Changed.
- Prediction Timeline completa.
- Análisis premium.

## 15.3 Importante

El backend debe filtrar. No enviar datos premium al frontend si el usuario no tiene permiso.

---

# 16. Idiomas

## 16.1 Iniciales

- Español.
- Inglés.

## 16.2 Posteriores

- Portugués.
- Francés.
- Alemán.

## 16.3 Arquitectura

- Datos numéricos únicos.
- Narrativas por idioma.
- UI traducible.

---

# 17. Contingencias

## 17.1 Si falla API deportiva

Mostrar última predicción disponible.

## 17.2 Si faltan alineaciones

Mostrar:

> Alineaciones oficiales no disponibles todavía. Mostrando análisis estadístico base.

## 17.3 Si falla LLM

Usar resumen por plantilla.

## 17.4 Si faltan odds

Ocultar Model vs Market y mostrar:

> Cuotas no disponibles en este momento.

---

# 18. Primer prototipo esperado

El primer prototipo debe:

- Crear páginas principales.
- Usar mock data.
- Mostrar UI moderna.
- Simular free/premium.
- Simular predicciones.
- Simular planes dinámicos.
- Simular admin/beta-lab.
- Dejar TODOs para Supabase, Railway, Resend, APIs externas, LLM y pagos.

No debe:

- Conectar APIs reales.
- Implementar pagos reales.
- Implementar auth real.
- Implementar Resend real.
- Implementar LLM real.
- Implementar módulo de polla/quiniela.

---

# 19. Decisiones cerradas

- Nombre: UFO Predictor.
- Formato: Web/PWA.
- Stack: Next.js + TypeScript + Tailwind + shadcn/ui.
- Hosting objetivo: Railway.
- DB/Auth objetivo: Supabase.
- Emails: Resend.
- Planes: dinámicos.
- IA: solo narrativa.
- Modelo: estadístico propio.
- Polla/quiniela: fuera del MVP principal.

---

# 20. Decisiones pendientes

- API-Football vs Sportmonks.
- The Odds API sí/no.
- OpenAI vs Gemini vs Claude para narrativa.
- Pasarela de pago.
- Diseño visual final.
- Precios exactos.
- Dominio final.
