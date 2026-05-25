# Roadmap y backlog - UFO Predictor

Este documento organiza el trabajo posterior al prototipo por épicas. No reemplaza tickets detallados, pero sirve como mapa para decidir ramas, dependencias y criterios de terminado.

## Prioridad sugerida

- P0: necesario para tener base real del MVP.
- P1: necesario para beta cerrada.
- P2: mejora importante, pero puede esperar.

---

## Épica 1: Supabase schema

**Prioridad:** P0  
**Rama sugerida:** `feature/supabase-schema`

**Objetivo:** Crear la base de datos real para usuarios, partidos, predicciones, planes, workers y resultados.

**Tareas principales:**

- Crear migraciones Supabase.
- Crear tablas principales según el diccionario de datos.
- Crear seeds mínimos para entorno local/staging.
- Definir relaciones básicas.
- Preparar tipos generados o tipos internos alineados.

**Dependencias:** Ninguna, pero debe respetar `docs/DATA_DICTIONARY.md`.

**Carpetas/archivos probables:**

- `supabase/migrations/`
- `supabase/seed/`
- `types/database.ts`
- `lib/supabase/`

**Criterio de terminado:**

- Las migraciones corren en entorno limpio.
- Hay seed mínimo para probar el prototipo con datos reales.
- No hay secretos en el repo.

---

## Épica 2: Auth y roles

**Prioridad:** P0  
**Rama sugerida:** `feature/auth-roles`

**Objetivo:** Permitir usuarios reales con roles y permisos base.

**Tareas principales:**

- Configurar Supabase Auth.
- Crear perfiles.
- Definir roles: free user, premium user, admin.
- Proteger dashboard y admin.
- Preparar RLS inicial.

**Dependencias:** Supabase schema.

**Carpetas/archivos probables:**

- `lib/supabase/`
- `lib/permissions/`
- `app/dashboard/`
- `app/admin/`
- `types/database.ts`

**Criterio de terminado:**

- Un usuario puede iniciar sesión.
- Un admin puede acceder a admin.
- Un usuario normal no puede acceder a admin.
- RLS no depende solo del frontend.

---

## Épica 3: Planes dinámicos y paywall

**Prioridad:** P0  
**Rama sugerida:** `feature/dynamic-plans-paywall`

**Objetivo:** Convertir los planes mock en planes configurables y permisos reales.

**Tareas principales:**

- Leer planes desde base de datos.
- Implementar entitlements.
- Implementar match unlocks.
- Crear helper backend para filtrar datos premium.
- Mantener locks visuales como apoyo, no como seguridad.

**Dependencias:** Supabase schema, Auth y roles.

**Carpetas/archivos probables:**

- `lib/permissions/`
- `lib/supabase/`
- `app/pricing/`
- `app/matches/[slug]/`
- `types/plans.ts`

**Criterio de terminado:**

- Free y premium reciben datos distintos desde servidor.
- Los datos premium no viajan al frontend sin permiso.
- Los planes pueden cambiar sin hardcodear toda la UI.

---

## Épica 4: Motor predictivo v0.1

**Prioridad:** P0  
**Rama sugerida:** `feature/prediction-engine-v01`

**Objetivo:** Implementar el primer motor estadístico explicable.

**Tareas principales:**

- Implementar Team Power Score.
- Implementar expected goals.
- Implementar Poisson.
- Calcular 1X2.
- Calcular marcador probable y top 3.
- Calcular Over/Under 2.5.
- Calcular BTTS.
- Calcular confidence y risk.
- Guardar versiones de predicción.

**Dependencias:** Supabase schema. Puede iniciar con fixtures mock.

**Carpetas/archivos probables:**

- `lib/prediction-engine/`
- `types/prediction.ts`
- `workers/generate-prediction.ts`
- `docs/MODEL_V01.md`

**Criterio de terminado:**

- El motor genera predicciones reproducibles desde inputs conocidos.
- Hay pruebas unitarias para cálculos básicos.
- La IA no participa en el cálculo.

---

## Épica 5: API deportiva

**Prioridad:** P1  
**Rama sugerida:** `feature/football-api`

**Objetivo:** Conectar proveedor deportivo para fixtures, equipos, resultados, forma y alineaciones.

**Tareas principales:**

- Elegir API-Football o Sportmonks.
- Crear adapter de proveedor.
- Normalizar fixtures.
- Normalizar equipos.
- Sincronizar resultados.
- Manejar fallbacks si el proveedor falla.

**Dependencias:** Supabase schema.

**Carpetas/archivos probables:**

- `lib/football-api/`
- `workers/sync-fixtures.ts`
- `workers/sync-teams.ts`
- `workers/sync-form.ts`
- `workers/sync-lineups.ts`
- `types/football.ts`

**Criterio de terminado:**

- Podemos poblar partidos reales en Supabase.
- El sistema no se rompe si falta una alineación.
- Los IDs externos quedan mapeados.

---

## Épica 6: Odds y Model vs Market

**Prioridad:** P1  
**Rama sugerida:** `feature/odds-model-market`

**Objetivo:** Conectar cuotas y comparar probabilidad del modelo contra mercado.

**Tareas principales:**

- Elegir proveedor de odds.
- Crear adapter.
- Guardar snapshots.
- Calcular probabilidad implícita.
- Mostrar edge sin lenguaje de apuesta agresivo.
- Ocultar sección si no hay odds.

**Dependencias:** Supabase schema, motor predictivo.

**Carpetas/archivos probables:**

- `lib/odds-api/`
- `workers/sync-odds.ts`
- `components/model-vs-market.tsx`
- `types/prediction.ts`

**Criterio de terminado:**

- Model vs Market se calcula con datos reales.
- Hay historial de odds.
- Si faltan cuotas, la UI muestra un fallback claro.

---

## Épica 7: Workers Railway

**Prioridad:** P1  
**Rama sugerida:** `feature/railway-workers`

**Objetivo:** Ejecutar procesos backend para sincronización, predicción, validación y alertas.

**Tareas principales:**

- Crear runner común de workers.
- Registrar cada ejecución en `worker_runs`.
- Configurar workers/crons en Railway.
- Implementar retries básicos.
- Separar workers de acciones de usuario.

**Dependencias:** Supabase schema, API deportiva, motor predictivo.

**Carpetas/archivos probables:**

- `workers/`
- `lib/workers/`
- `railway.json`
- `lib/supabase/`

**Criterio de terminado:**

- Workers corren fuera del request del usuario.
- Cada worker deja logs persistentes.
- Admin puede ver estado real.

---

## Épica 8: Resend y emails

**Prioridad:** P1  
**Rama sugerida:** `feature/resend-emails`

**Objetivo:** Enviar emails transaccionales y alertas premium.

**Tareas principales:**

- Configurar Resend.
- Crear templates React Email.
- Enviar bienvenida.
- Enviar confirmación de compra.
- Enviar Golden Hour Alert.
- Enviar resumen diario.
- Registrar eventos de email.

**Dependencias:** Auth, planes/paywall, workers.

**Carpetas/archivos probables:**

- `lib/email/`
- `workers/alert-premium.ts`
- `workers/send-daily-summary.ts`
- `types/email.ts`

**Criterio de terminado:**

- Emails se envían en staging.
- Se registran eventos enviados/fallidos.
- No se envían emails reales desde entorno local sin intención.

---

## Épica 9: Admin/Beta Lab real

**Prioridad:** P1  
**Rama sugerida:** `feature/admin-beta-lab-real`

**Objetivo:** Convertir el panel mock en herramienta operativa interna.

**Tareas principales:**

- Mostrar partidos reales.
- Mostrar predicciones generadas.
- Mostrar worker runs reales.
- Permitir recalcular predicción.
- Permitir regenerar narrativa.
- Mostrar errores y metadata.

**Dependencias:** Auth/roles, Supabase, workers, motor predictivo.

**Carpetas/archivos probables:**

- `app/admin/`
- `components/admin-worker-status.tsx`
- `lib/supabase/`
- `workers/`

**Criterio de terminado:**

- Solo admins pueden entrar.
- Acciones sensibles quedan auditadas.
- El panel ayuda a operar beta sin tocar base de datos manualmente.

---

## Épica 10: Transparency Center real

**Prioridad:** P1  
**Rama sugerida:** `feature/transparency-real`

**Objetivo:** Mostrar rendimiento real del modelo, incluyendo aciertos y fallos.

**Tareas principales:**

- Validar resultados al terminar partidos.
- Guardar métricas por mercado.
- Separar prelineup vs postlineup.
- Mostrar historial de predicciones.
- Mostrar disclaimers claros.

**Dependencias:** Supabase, motor predictivo, API deportiva, workers.

**Carpetas/archivos probables:**

- `app/transparency/`
- `components/transparency-stats.tsx`
- `workers/validate-results.ts`
- `types/prediction.ts`

**Criterio de terminado:**

- Las métricas salen de resultados reales.
- Se pueden revisar aciertos y errores.
- No se ocultan fallos del modelo.

---

## Épica 11: UI polish y mobile

**Prioridad:** P2  
**Rama sugerida:** `feature/ui-polish-mobile`

**Objetivo:** Mejorar experiencia visual y responsive antes de beta.

**Tareas principales:**

- Revisar mobile-first.
- Pulir tablas y cards.
- Mejorar estados vacíos, loading y error.
- Ajustar contraste.
- Revisar accesibilidad básica.
- Alinear con brand board.

**Dependencias:** Puede avanzar en paralelo, pero conviene esperar a módulos reales para pulir estados finales.

**Carpetas/archivos probables:**

- `app/`
- `components/`
- `app/globals.css`
- `public/brand/`

**Criterio de terminado:**

- No hay overflow móvil.
- La UI se siente premium y clara.
- No hay estética de casino.
- La navegación principal es cómoda en mobile.

---

## Épica 12: Deploy y staging

**Prioridad:** P0/P1  
**Rama sugerida:** `feature/staging-deploy`

**Objetivo:** Tener un entorno staging estable para revisión del equipo.

**Tareas principales:**

- Configurar Railway.
- Configurar variables de entorno.
- Conectar Supabase staging.
- Validar `npm run build`.
- Definir proceso de deploy.
- Documentar cómo probar staging.

**Dependencias:** Base Next lista. Para staging funcional real, depende de Supabase.

**Carpetas/archivos probables:**

- `railway.json`
- `.env.example`
- `README.md`
- `docs/`

**Criterio de terminado:**

- Staging despliega desde rama definida.
- Variables están documentadas.
- No hay secretos versionados.
- El equipo puede revisar una URL estable.

---

## Nota de alcance

El módulo de polla/quiniela/pool queda fuera del MVP principal actual. Puede convertirse en producto o módulo separado después, pero no debe bloquear el MVP de predicciones probabilísticas.

