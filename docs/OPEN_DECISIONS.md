<!-- UFO Predictor | Updated roadmap after Beta Lab + Data Intake -->
<!-- Status assumes feature/data-intake-minimal has been committed, pushed, PR'd and merged before the team meeting. -->

# OPEN_DECISIONS.md — UFO Predictor

## Propósito

Este documento lista decisiones pendientes. Su objetivo es evitar que se implementen soluciones definitivas antes de que el equipo cierre criterios de producto, datos, infraestructura o monetización.

---

# Infraestructura

## Supabase CLI / entorno local

**Estado:** pendiente.

Opciones:

1. Seguir validando migraciones en Supabase remoto/staging con SQL Editor.
2. Instalar Supabase CLI con Docker para entorno local.
3. Usar ambos: migraciones versionadas + staging remoto + local para pruebas.

**Recomendación:** crear una épica pequeña `feature/supabase-cli-local-setup` antes de que crezcan las migraciones.

## Railway staging

**Estado:** pendiente.

Decidir:

- rama de deploy,
- variables de entorno,
- Supabase staging,
- proceso de rollback.

---

# Datos deportivos

## API-Football vs Sportmonks

**Estado:** pendiente.

Criterios:

- cobertura Mundial 2026,
- fixtures,
- resultados,
- alineaciones,
- forma reciente,
- límites y costos,
- estabilidad,
- documentación.

## Competiciones para Lab pre-Mundial

**Estado:** pendiente.

Decidir qué competiciones/amistosos se usarán para calibración interna antes del Mundial.

Ejemplos candidatos:

- Champions League.
- amistosos internacionales.
- ligas latinoamericanas o europeas cercanas a terminar.
- torneos con datos fáciles de validar manualmente.

Importante: esto es Beta Lab, no producto público multi-liga.

---

# Modelo predictivo

## Métricas mínimas de Prediction Engine v0.1

**Estado:** pendiente.

Medir inicialmente:

- 1X2.
- BTTS.
- Over/Under 2.5.
- error de goles.
- calibración básica de probabilidades.

## Criterio de aceptación del modelo v0.1

**Estado:** pendiente.

Definir qué nivel de consistencia o trazabilidad esperamos para considerar útil el motor lab.

---

# Odds

## Proveedor de odds

**Estado:** pendiente.

Opciones:

- odds del proveedor deportivo principal,
- The Odds API,
- otro proveedor.

Regla vigente: no usar lenguaje agresivo de apuestas ni prometer ganancias.

---

# IA narrativa

## Proveedor LLM

**Estado:** pendiente.

Opciones:

- OpenAI,
- Gemini,
- Claude,
- combinación.

Regla permanente: el LLM no calcula probabilidades; solo explica resultados ya calculados.

---

# Pagos y monetización

## Pasarela de pago

**Estado:** pendiente.

Opciones:

- Stripe,
- PayPal,
- Mercado Pago,
- combinación.

## Precios y planes finales

**Estado:** pendiente.

El sistema debe permitir planes configurables; no hardcodear precios finales en lógica.

---

# Auth y operación

## Asignación de administradores

**Estado:** temporalmente manual.

Actual: edición manual de `profiles.role`.  
Pendiente: definir flujo operacional o panel seguro.

## Lab review flow

**Estado:** pendiente.

Decidir cómo se revisarán fixtures/resultados desde admin:

- acciones server-side,
- panel CRUD limitado,
- proceso manual temporal.

---

# Producto

## Ligas v2

**Estado:** futuro.

No forma parte del MVP Mundial. El Beta Lab puede usar ligas/amistosos internamente, pero el soporte comercial multi-liga debe planearse aparte.

## Módulo polla/quiniela/pool

**Estado:** fuera del MVP principal.

No debe bloquear el producto principal de predicciones probabilísticas.
