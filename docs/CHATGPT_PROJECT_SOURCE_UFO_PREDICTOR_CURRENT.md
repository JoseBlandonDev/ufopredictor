# UFO Predictor — Fuente actual del proyecto para ChatGPT

## Propósito

Este documento resume el estado real actual de UFO Predictor para nuevas conversaciones de ChatGPT dentro del proyecto. Debe usarse como fuente principal de contexto operativo.

UFO Predictor es una web/PWA de predicciones probabilísticas de fútbol, inicialmente enfocada en el Mundial 2026.

No es una casa de apuestas, no recibe apuestas y no promete ganancias.

Principio permanente:

> El modelo estadístico calcula. La IA explica.

El LLM no debe calcular probabilidades, decidir resultados ni inventar métricas. La IA futura solo debe narrar o explicar outputs ya calculados por el modelo estadístico.

---

## Estado actual resumido

El proyecto ya superó la fase de prototipo puro. Existe una base técnica funcional con Next.js, Supabase, Auth, roles, Beta Lab interno, datos Lab en Supabase, motor predictivo v0.1 y evaluación de predicciones.

Ya están mergeadas en `main` estas épicas/tareas:

1. `chore: add UFO Predictor project context`
2. `feat: create initial UFO Predictor prototype`
3. `feat: add initial supabase schema`
4. `fix: enforce match season competition integrity`
5. `feat: add Supabase runtime clients`
6. `feat: add Supabase auth and role guards`
7. `feat: add beta lab foundation`
8. `feat: add data intake foundation`
9. `docs: update roadmap after lab foundation`
10. `feat: add prediction engine v0.1 lab`
11. `fix: restrict lab match results rls`
12. `feat: add model evaluation lab`
13. `feat: add lab Supabase queries`

---

## Estado técnico actual

### Frontend

- App Next.js con App Router.
- TypeScript.
- Tailwind CSS.
- Branding UFO Predictor.
- UI en español.
- Rutas existentes:
  - `/`
  - `/predictions`
  - `/matches/[slug]`
  - `/pricing`
  - `/transparency`
  - `/dashboard`
  - `/admin`
  - `/admin/beta-lab`
  - `/login`
  - `/register`
  - `/auth/callback`

### Supabase

- Supabase remoto conectado.
- Schema aplicado hasta `0006_admin_lab_read_policies.sql`.
- Supabase Auth email/password funcionando.
- Profiles automáticos.
- Roles `free_user` y `admin`.
- RLS inicial y policies Lab reforzadas.
- Runtime clients browser/server/admin existentes.

### Seguridad / Auth

- `/dashboard` protegido.
- `/admin` protegido.
- `/admin/beta-lab` protegido con `requireAdmin`.
- Usuario anónimo en `/admin/beta-lab` redirige a login.
- RLS evita exponer datos `lab_only` / `internal_lab` a usuarios no-admin.

### Beta Lab

El Beta Lab es una capa interna/admin para probar datos, predicciones y evaluación antes del Mundial 2026.

Soporte actual:

- `competitions.usage_scope = 'internal_lab'`.
- `matches.access_scope = 'lab_only'`.
- `matches.lab_status`.
- `matches.intake_source`.
- `matches.data_quality`.
- `matches.source_note`.
- `matches.reviewed_at`.
- `matches.reviewed_by`.
- `prediction_versions.run_scope = 'internal_lab'`.
- `match_results` para resultados reales validados.
- `prediction_results` para evaluaciones persistidas.

`/admin/beta-lab` ya lee datos reales desde Supabase para:

- fixtures Lab;
- equipos local/visitante;
- prediction versions `internal_lab`;
- match results;
- prediction results;
- model versions.

Sigue mock:

- worker runs / estado de workers.

---

## Motor predictivo

Existe `lib/prediction-engine/`.

Incluye:

- Configuración versionada `v0.1-lab`.
- Normalización de inputs.
- Defaults seguros.
- Team Power Score.
- Expected goals.
- Distribución Poisson.
- Matriz de marcadores.
- Probabilidades 1X2.
- BTTS.
- Over/Under 2.5.
- Top scorelines.
- Most likely score.
- Confidence/risk.
- Factors/notes explicables.
- Fixtures sintéticos.
- Tests con Vitest.

Regla: el output público/exportado usa probabilidades en `0..100`. Internamente puede calcular en `0..1`.

---

## Evaluación del modelo

Existe `lib/model-evaluation/`.

Incluye evaluación pura y determinística contra resultados verificados:

- `winner_correct`.
- `btts_correct`.
- `over_2_5_correct`.
- `exact_score_correct`.
- `goal_error`.
- `error_summary`.
- métricas agregadas.
- manejo de mercados ambiguos.
- manejo de resultados no verificados.

Fórmula de `goal_error`:

```txt
abs(predicted_home_goals - actual_home_goals)
+ abs(predicted_away_goals - actual_away_goals)
```

La fuente única del marcador predicho para `exact_score_correct`, `goal_error` y `error_summary` es `mostLikelyScore`.

---

## Validaciones recientes

Realizadas durante las últimas épicas:

- `npm run test` aprobado.
- `npm run lint` aprobado.
- `npm run build` aprobado.
- Supabase SQL Editor validado para migraciones `0005` y `0006`.
- Admin puede ver `/admin/beta-lab` con datos reales.
- Incógnito/no autenticado redirige a login para `/admin/beta-lab`.

---

## Qué NO existe todavía

- Escrituras admin desde UI.
- CRUD/review flow de fixtures/resultados.
- Workers reales.
- API deportiva real.
- Odds reales.
- LLM real.
- Pagos.
- Google Auth.
- Supabase CLI/local setup.
- Public predictions desde DB.
- Paywall backend real.
- Entitlements reales.
- Transparency real desde métricas productivas.
- Staging/deploy final.

---

## Siguiente bloque recomendado

No implementar una épica gigante de Lab Admin Review Flow. Dividir en sub-épicas:

1. `feature/lab-fixture-review-actions`
   - actualizar `matches.lab_status`;
   - actualizar `matches.data_quality`;
   - actualizar `matches.source_note`;
   - setear `matches.reviewed_at`;
   - setear `matches.reviewed_by`;
   - mantener admin-only;
   - usar server actions o route handlers seguros;
   - agregar RLS update admin-only si hace falta.

2. `feature/lab-match-result-actions`
   - crear/editar `match_results` desde admin;
   - validar goles;
   - manejar `verification_status`;
   - mantener admin-only.

3. `feature/lab-evaluation-persistence`
   - tomar `prediction_version` + `match_result`;
   - usar `lib/model-evaluation/`;
   - crear/actualizar `prediction_results`.

En radar, pero no inmediato obligatorio:

- `feature/google-auth`.
- `feature/supabase-cli-local-setup`.
- `feature/public-predictions-from-db`.
- `feature/plans-entitlements-backend`.

---

## Reglas permanentes

- No trabajar directo en `main`.
- Una rama por épica o sub-épica clara.
- No tocar `.env.local`.
- No exponer secretos.
- No conectar APIs deportivas sin decisión explícita.
- No conectar odds sin decisión explícita.
- No implementar LLM como calculador.
- No prometer ganancias.
- No implementar polla/quiniela/pool en el MVP principal.
- No convertir Beta Lab en producto público de ligas.
- Los datos premium deben filtrarse desde backend.
- El Lab sigue siendo interno/admin.
