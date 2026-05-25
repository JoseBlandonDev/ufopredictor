# OPEN_DECISIONS.md — UFO Predictor

## Propósito

Este documento lista decisiones pendientes. Su objetivo es evitar implementar soluciones definitivas antes de que el equipo cierre criterios de producto, datos, infraestructura o monetización.

---

# Infraestructura

## Supabase CLI / entorno local

**Estado:** pendiente / en radar.

Opciones:

1. Seguir validando migraciones en Supabase remoto/staging con SQL Editor.
2. Instalar Supabase CLI con Docker para entorno local.
3. Usar ambos: migraciones versionadas + staging remoto + local para pruebas.

**Estado actual:** las migraciones hasta `0006_admin_lab_read_policies.sql` se han aplicado manualmente en Supabase SQL Editor.

**Recomendación:** crear `feature/supabase-cli-local-setup` cuando el equipo quiera optimizar flujo. No bloquear Lab Admin Review por esto.

## Railway staging

**Estado:** pendiente.

Decidir:

- rama de deploy;
- variables de entorno;
- Supabase staging;
- proceso de rollback.

---

# Auth

## Google Auth

**Estado:** en radar.

Conviene implementarlo como épica separada:

```txt
feature/google-auth
```

Alcance futuro:

- configurar Google Provider en Supabase;
- botón de login/register;
- callback;
- profile automático;
- rol inicial `free_user`;
- admin sigue siendo asignación controlada/manual.

No mezclar con Lab Admin Review Flow.

---

# Datos deportivos

## API-Football vs Sportmonks

**Estado:** pendiente.

Criterios:

- cobertura Mundial 2026;
- fixtures;
- resultados;
- alineaciones;
- forma reciente;
- límites y costos;
- estabilidad;
- documentación.

## Competiciones para Lab real

**Estado:** pendiente.

Decidir qué competiciones/amistosos se usarán para calibración interna antes del Mundial.

Importante: esto es Beta Lab, no producto público multi-liga.

---

# Modelo predictivo

## Criterio de aceptación del modelo v0.1

**Estado:** pendiente.

Ya existe:

- Prediction Engine v0.1 Lab.
- Model Evaluation Lab.
- Lab Supabase Queries.

Falta definir qué nivel de consistencia/calibración esperamos antes de usarlo para predicciones públicas.

## Calibración

**Estado:** futuro.

No cambiar pesos/fórmula sin datos de evaluación suficientes.

Posible rama futura:

```txt
feature/model-calibration-lab
```

---

# Lab Admin

## Lab Fixture Review Actions

**Estado:** próximo.

Decidir detalles de UX y alcance:

- acciones rápidas;
- server actions vs route handlers;
- campos editables;
- RLS update admin-only.

## Match Result Actions

**Estado:** próximo/después.

Decidir si crear/editar `match_results` se hace junto a fixture review o en sub-épica separada.

Recomendación actual: sub-épica separada.

## Evaluation Persistence

**Estado:** próximo/después.

Decidir flujo para persistir `prediction_results` usando `lib/model-evaluation/`.

---

# Odds

## Proveedor de odds

**Estado:** pendiente.

Opciones:

- odds del proveedor deportivo principal;
- The Odds API;
- otro proveedor.

Regla vigente: no usar lenguaje agresivo de apuestas ni prometer ganancias.

---

# IA narrativa

## Proveedor LLM

**Estado:** pendiente.

Opciones:

- OpenAI;
- Gemini;
- Claude;
- combinación.

Regla permanente: el LLM no calcula probabilidades; solo explica resultados ya calculados.

---

# Pagos y monetización

## Pasarela de pago

**Estado:** pendiente.

Opciones:

- Stripe;
- PayPal;
- Mercado Pago;
- combinación.

## Precios y planes finales

**Estado:** pendiente.

El sistema debe permitir planes configurables; no hardcodear precios finales en lógica.

---

# Producto

## Ligas v2

**Estado:** futuro.

No forma parte del MVP Mundial. El Beta Lab puede usar ligas/amistosos internamente, pero el soporte comercial multi-liga debe planearse aparte.

## Módulo polla/quiniela/pool

**Estado:** fuera del MVP principal.

No debe bloquear el producto principal de predicciones probabilísticas.
