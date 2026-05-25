# UFO Predictor - visión técnica humana

## Qué es UFO Predictor

UFO Predictor es una web/PWA de predicciones de fútbol con enfoque inicial en el Mundial 2026. El producto mezcla datos deportivos, análisis estadístico, probabilidades y narrativa de IA para ayudar a entender cómo llega cada partido.

La marca usa una estética UFO/sci-fi: una inteligencia no humana observa el caos del fútbol y lo traduce en señales probabilísticas. El producto no es una casa de apuestas, no recibe apuestas y no promete ganancias.

## Qué problema resuelve

Los fans y usuarios que analizan partidos suelen tener información dispersa: forma reciente, cuotas, alineaciones, contexto, rendimiento histórico y opiniones. UFO Predictor busca reunir esas señales en una experiencia clara:

- Probabilidades 1X2.
- Marcador probable.
- Mercados básicos como Over/Under 2.5 y BTTS.
- Cambios cuando salen alineaciones.
- Comparación entre modelo y mercado.
- Explicaciones entendibles, no solo números.
- Transparencia sobre aciertos y errores del modelo.

## Qué tiene el prototipo actual

El prototipo actual es una primera versión visual y estructural hecha con mock data. Sirve para revisar producto, navegación, diseño, arquitectura de carpetas y flujo general.

Incluye:

- Home con branding UFO Predictor.
- Página de predicciones.
- Detalle de partido.
- Pricing con planes mock.
- Transparency Center mock.
- Dashboard de usuario mock.
- Admin y Beta Lab mock.
- Componentes reutilizables para partidos, probabilidades, badges, timeline, Golden Hour Delta, Model vs Market, planes y workers.
- Skeletons/TODOs para futuras integraciones.
- Assets de marca en `public/brand/`.

## Qué NO tiene todavía

El prototipo todavía no tiene:

- Supabase real.
- Auth real.
- Roles reales.
- Pagos reales.
- Railway workers reales.
- Resend real.
- Emails reales.
- API deportiva real.
- Odds reales.
- LLM real.
- Motor predictivo real.
- Base de datos real.
- Paywall backend real.
- Transparency Center con resultados reales.
- Módulo de polla/quiniela/pool.

Los locks premium actuales son visuales y de mock. En producción el backend debe filtrar la información premium antes de enviarla al frontend.

## Cómo funciona el modelo predictivo a alto nivel

La regla base del producto es:

> El modelo estadístico calcula. La IA explica.

El modelo v0.1 previsto debe tomar datos normalizados del partido y convertirlos en probabilidades. A alto nivel:

1. Reunir datos del partido: equipos, forma, fuerza histórica, contexto, cuotas, alineaciones.
2. Calcular un Team Power Score para cada equipo.
3. Estimar goles esperados.
4. Usar Poisson para generar una matriz de marcadores.
5. Derivar mercados: 1X2, marcador probable, top marcadores, Over/Under 2.5 y BTTS.
6. Mezclar señal del modelo con señal de mercado.
7. Calcular confianza y riesgo.
8. Guardar la predicción versionada.

El MVP debe empezar simple, explicable y auditable. No necesitamos un modelo “mágico”; necesitamos uno trazable que podamos mejorar con datos reales.

## Qué papel tiene la IA

La IA no debe decidir resultados ni inventar probabilidades.

Su papel es narrativo:

- Explicar una predicción ya calculada.
- Traducir números en texto claro.
- Generar “Why It Changed” cuando cambia una predicción.
- Crear resúmenes en español e inglés.
- Ayudar a que el usuario entienda incertidumbre, riesgo y contexto.

Si el LLM falla, el sistema debe poder mostrar un resumen por plantilla.

## Stack usado y por qué

Stack actual del prototipo:

- Next.js App Router + React: base web moderna, rutas claras y buen camino a PWA.
- TypeScript: contratos más seguros para datos deportivos, predicciones y planes.
- Tailwind CSS: velocidad para prototipo visual y sistema de estilos consistente.
- Componentes compatibles con shadcn/ui: estructura componible sin casarnos con un diseño cerrado.
- Zod: previsto para validaciones de datos y salidas de IA.
- Supabase: objetivo para Postgres, Auth, RLS y Storage.
- Railway: objetivo para hosting, workers, crons y procesos backend.
- Resend + React Email: objetivo para emails transaccionales y alertas.

La decisión importante: Railway + Supabase encajan mejor que un frontend puro porque el producto necesita procesos backend, workers y datos vivos.

## Módulos principales que faltan

Faltan estos módulos productivos:

- Schema Supabase y migraciones.
- Auth, roles y RLS.
- Sistema real de planes, compras y entitlements.
- Paywall backend.
- Motor predictivo v0.1.
- Integración con proveedor deportivo.
- Integración con odds.
- Workers Railway.
- Narrativa IA real.
- Emails con Resend.
- Admin/Beta Lab real.
- Transparency Center real.
- Deploy staging.
- Observabilidad y manejo de errores.

## Decisiones abiertas

Todavía hay que decidir:

- API-Football vs Sportmonks.
- Proveedor de odds.
- OpenAI vs Gemini vs Claude para narrativa.
- Pasarela de pago: Stripe, PayPal, Mercado Pago u otra combinación.
- Precios exactos.
- Dominio final.
- Primer país/mercado prioritario.
- Nivel de bilingüismo inicial: español primero o español/inglés desde el primer release.

## Riesgos técnicos y de producto

Riesgos a cuidar:

- Prometer demasiado: el producto debe hablar de probabilidades, no certezas.
- Paywall solo visual: en producción sería inseguro. El backend debe filtrar.
- LLM con demasiado poder: no debe decidir resultados.
- Datos deportivos inconsistentes: necesitamos normalización y fallback.
- Workers sin trazabilidad: todo worker debe registrar ejecución.
- Transparencia débil: hay que mostrar aciertos y errores reales.
- Costos de proveedores: deportes, odds y LLM pueden escalar.
- Diseño con estética equivocada: debe sentirse premium/tecnológico, no casino.
- Módulo de polla/quiniela: queda fuera del MVP principal actual para no mezclar alcances.

