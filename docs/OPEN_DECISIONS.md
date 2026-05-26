# OPEN_DECISIONS.md — UFO Predictor

# UFO Predictor — estado actualizado post Lab Admin Flow

Actualizado después de mergear PR #18 (`feat: persist lab evaluations`).

Principio permanente: **el modelo estadístico calcula. La IA explica.**

UFO Predictor no es casa de apuestas, no recibe apuestas y no promete ganancias.


---

## Decisiones abiertas prioritarias

### D01 — Criterio para publicar predicciones

Antes de `feature/public-predictions-from-db`, decidir:

```txt
¿Qué prediction_versions pasan de internal_lab a public_product?
```

Opciones:

1. Usar `prediction_versions.run_scope = 'public_product'`.
2. Crear acción admin para promover predicción interna a pública.
3. Crear seed inicial de predicciones publicables para MVP.
4. Crear tabla/campo adicional de publicación.

Recomendación inicial:

- usar scope explícito;
- no exponer `internal_lab`;
- empezar read-only;
- no agregar flujo de publicación complejo hasta tener C01 funcionando.

---

### D02 — Qué ve un usuario free vs premium

Definir campos visibles para:

- visitante anónimo;
- `free_user`;
- premium futuro;
- admin.

Ejemplo:

| Dato | Free | Premium |
|---|---:|---:|
| 1X2 básico | Sí | Sí |
| confidence | Limitado | Sí |
| top scorelines | Limitado | Sí |
| BTTS/OU | Quizá limitado | Sí |
| explicación IA | No o teaser | Sí |

Nada premium debe viajar al frontend si el usuario no tiene permiso.

---

### D03 — Paywall backend vs visual

Decisión recomendada:

```txt
Paywall debe aplicarse en backend/query layer, no solo en componentes UI.
```

---

### D04 — Transparencia pública

Decidir si `/transparency` inicialmente muestra:

1. métricas Lab internas;
2. métricas solo publicables;
3. métricas agregadas mixtas pero sin revelar Lab.

Recomendación: empezar con métricas publicables o claramente etiquetadas como Lab/Internal.

---

### D05 — Staging

Decidir plataforma y ambiente:

- Vercel para app;
- Supabase remoto separado para staging o usar proyecto actual con cuidado;
- variables `.env` gestionadas fuera del repo.

---

### D06 — Supabase CLI local

Pendiente decidir cuándo invertir en CLI local.

Pros:

- migraciones reproducibles;
- menos SQL manual;
- resets locales.

Contras:

- tiempo de setup;
- riesgo de distracción antes de C01.

Recomendación: hacerlo antes de muchas migraciones públicas/paywall, pero no bloquear C01 si el flujo manual sigue controlado.

---

### D07 — Google Auth

No bloquea MVP interno ni C01.

Recomendación: después de definir producto público y entitlements.

---

### D08 — Workers/API/Odds

No mezclar con C01.

Primero producto público desde datos ya controlados. Luego automatización.

---

## Decisiones ya tomadas

- El Lab es interno/admin.
- El modelo estadístico calcula.
- La IA explica.
- No hay apuestas ni promesas de ganancia.
- Server Actions admin usan sesión real, no service role.
- RLS y grants por columna son obligatorios para escrituras admin sensibles.
- `workerRuns` sigue mock hasta épica de workers reales.
