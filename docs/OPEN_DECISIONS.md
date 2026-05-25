# OPEN_DECISIONS.md — Decisiones abiertas de UFO Predictor

## 1. Propósito

Este documento lista decisiones pendientes del proyecto **UFO Predictor**.

Su objetivo es evitar que Codex, ChatGPT o cualquier integrante del equipo asuma decisiones que todavía no están cerradas.

Las decisiones aquí no bloquean todas las épicas, pero sí deben resolverse antes de implementar ciertos módulos reales.

---

## 2. Decisiones de infraestructura y entorno

### 2.1 Supabase local vs remoto

**Estado:** pendiente.

Opciones:

1. Usar Supabase CLI local para desarrollo.
2. Crear migraciones SQL en repo y probarlas en proyecto Supabase remoto/staging.
3. Combinar ambas: migraciones versionadas + entorno remoto staging.

**Recomendación inicial:**

Crear migraciones versionadas en el repo y preparar estructura compatible con Supabase CLI. No depender únicamente de cambios manuales en el dashboard.

**Bloquea o afecta:**

- `feature/supabase-schema`
- `feature/auth-roles`
- `feature/dynamic-plans-paywall`
- `feature/railway-workers`

---

### 2.2 Railway staging

**Estado:** pendiente.

Decidir:

- cuándo crear proyecto Railway,
- qué rama despliega a staging,
- qué variables usar,
- cómo se conectará con Supabase staging.

**Bloquea o afecta:**

- `feature/staging-deploy`
- `feature/railway-workers`

---

## 3. Decisiones de datos deportivos

### 3.1 API-Football vs Sportmonks

**Estado:** pendiente.

Criterios a evaluar:

- cobertura Mundial 2026,
- fixtures,
- equipos,
- resultados,
- alineaciones,
- lesiones/bajas si existen,
- estadísticas de forma,
- límites del plan,
- costos,
- estabilidad,
- documentación,
- facilidad de integración.

**Recomendación inicial:**

No integrar proveedor real hasta comparar opciones actualizadas. Mientras tanto, crear una interfaz neutral de provider si se necesita avanzar arquitectura.

**Bloquea o afecta:**

- `feature/football-api`
- `feature/railway-workers`
- `feature/transparency-real`

---

### 3.2 Fuente de rankings/Elo/FIFA

**Estado:** pendiente.

Decidir si se usará:

- ranking FIFA,
- Elo público,
- dato del proveedor deportivo,
- ranking interno calculado.

**Bloquea o afecta:**

- `feature/prediction-engine-v01`
- `feature/football-api`

---

## 4. Decisiones de odds

### 4.1 Proveedor de odds

**Estado:** pendiente.

Opciones:

- odds incluidas en el proveedor deportivo principal,
- The Odds API,
- otro proveedor especializado.

Criterios:

- cobertura internacional,
- mercados disponibles,
- frecuencia de actualización,
- costo,
- límites,
- legalidad/uso permitido,
- facilidad para calcular implied probability.

**Bloquea o afecta:**

- `feature/odds-model-market`
- `feature/railway-workers`

---

### 4.2 Lenguaje de Model vs Market

**Estado:** parcialmente definido.

Regla vigente:

No usar lenguaje agresivo de apuestas.

Usar expresiones como:

- “posible valor detectado”,
- “diferencia frente al mercado”,
- “señal probabilística”,
- “edge del modelo”.

Evitar:

- “apuesta segura”,
- “mete dinero”,
- “pick garantizado”,
- “fixed”,
- “100% ganador”.

---

## 5. Decisiones de IA narrativa

### 5.1 Proveedor LLM

**Estado:** pendiente.

Opciones:

- OpenAI,
- Gemini,
- Claude,
- combinación por costo/calidad.

Criterios:

- salida estructurada,
- costo,
- calidad en español e inglés,
- latencia,
- facilidad de validación con Zod,
- robustez ante prompts largos.

**Regla permanente:**

El LLM no calcula predicciones. Solo explica resultados ya calculados.

**Bloquea o afecta:**

- `feature/ai-narrative`
- `feature/admin-beta-lab-real`
- `feature/resend-emails`

---

### 5.2 Idiomas iniciales

**Estado:** pendiente.

Opciones:

1. Español primero.
2. Español e inglés desde beta.
3. Español en UI, inglés preparado para siguiente fase.

**Recomendación inicial:**

Mantener código y keys internas en inglés, UI inicial en español, y preparar estructura para i18n posterior.

---

## 6. Decisiones de pagos y monetización

### 6.1 Pasarela de pago

**Estado:** pendiente.

Opciones:

- Stripe,
- PayPal,
- Mercado Pago,
- combinación según mercado.

Criterios:

- mercado objetivo inicial,
- facilidad de integración,
- soporte para suscripciones,
- soporte para pagos únicos,
- comisiones,
- disponibilidad en Colombia/LatAm/global.

**Bloquea o afecta:**

- `feature/dynamic-plans-paywall`
- `feature/payments`

La épica de planes/paywall puede avanzar sin pagos reales usando entitlements mock o manuales.

---

### 6.2 Precios exactos

**Estado:** pendiente.

Planes previstos:

- Gratis.
- World Cup Pass.
- Pack de 10 partidos.
- Pase fase eliminatoria.
- Pase por selección.
- Premium mensual.

**Recomendación inicial:**

No hardcodear precios finales en lógica. Mantenerlos configurables desde base de datos.

---

## 7. Decisiones de Auth

### 7.1 Métodos de login

**Estado:** pendiente.

Opciones:

- email/password,
- magic link,
- Google OAuth,
- combinación.

**Recomendación inicial:**

Definir antes de `feature/auth-roles`.

---

### 7.2 Asignación de admins

**Estado:** pendiente.

Opciones:

- asignación manual en base de datos,
- allowlist de emails,
- panel interno posterior.

**Recomendación inicial:**

Para MVP, asignación manual o allowlist controlada.

---

## 8. Decisiones de testing

### 8.1 Framework de tests

**Estado:** pendiente.

Opciones:

- Vitest,
- Jest,
- Node test runner.

**Recomendación inicial:**

Usar Vitest para `feature/prediction-engine-v01`, porque el motor predictivo debe ser testeable y reproducible.

**Bloquea o afecta:**

- `feature/prediction-engine-v01`

---

### 8.2 Qué probar primero

Prioridad de tests:

1. Poisson.
2. Matriz de marcadores.
3. 1X2.
4. Over/Under 2.5.
5. BTTS.
6. Confidence/risk.
7. Market blend.

---

## 9. Decisiones de analytics

### 9.1 Analytics inicial

**Estado:** pendiente.

Opciones:

- PostHog,
- GA4,
- ambos.

Eventos importantes futuros:

- visita landing,
- click CTA,
- view match detail,
- premium lock viewed,
- pricing viewed,
- plan selected,
- match unlocked,
- Golden Hour alert opened.

No es prioridad antes de Supabase/motor.

---

## 10. Decisiones de producto

### 10.1 Módulo polla/quiniela/pool

**Estado:** fuera del MVP principal.

No debe implementarse dentro de las épicas actuales de UFO Predictor.

Puede manejarse más adelante como:

- módulo separado,
- producto complementario,
- lead magnet,
- app paralela.

No debe bloquear el MVP predictivo principal.

---

### 10.2 Estrategia de idiomas

**Estado:** pendiente.

El prototipo actual tiene UI en español y código técnico en inglés.

Más adelante se debe decidir:

- i18n formal,
- rutas localizadas,
- narrativas por idioma,
- prioridad entre español e inglés.

---

### 10.3 Dominio final

**Estado:** pendiente.

Nombre del producto:

```txt
UFO Predictor
```

Dominio final pendiente.

---

## 11. Cómo usar este documento

Antes de iniciar una épica, revisar si hay decisiones abiertas que la bloquean.

Si una decisión no está cerrada:

- no asumirla,
- no implementarla como definitiva,
- usar interfaces neutrales o placeholders,
- documentar TODOs.

Cuando una decisión se cierre, actualizar este documento.
