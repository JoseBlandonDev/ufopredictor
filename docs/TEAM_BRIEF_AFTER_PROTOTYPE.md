# Brief para el equipo después del prototipo

## Qué ya se logró

Ya tenemos un primer prototipo navegable de UFO Predictor.

El prototipo permite revisar:

- Identidad visual inicial con branding UFO Predictor.
- Home del producto.
- Listado de predicciones.
- Detalle de partido.
- Planes dinámicos mock.
- Simulación free/premium.
- Golden Hour Delta.
- Modelo vs Mercado.
- Línea de tiempo de predicción.
- Dashboard de usuario mock.
- Admin/Beta Lab mock.
- Transparency Center mock.

También quedó una estructura técnica base con Next.js, TypeScript, Tailwind y carpetas preparadas para futuras integraciones.

## Qué pueden esperar del prototipo

Este prototipo sirve para:

- Revisar experiencia visual.
- Alinear producto y narrativa.
- Validar páginas principales.
- Conversar sobre planes premium.
- Ver cómo se mostrarían predicciones y señales.
- Tener una base para dividir trabajo por módulos.

Todo lo que ven ahora usa mock data.

## Qué NO deben esperar todavía

Todavía no hay:

- Datos reales.
- Usuarios reales.
- Login.
- Pagos.
- Base de datos.
- Motor predictivo real.
- Emails.
- Workers.
- Odds reales.
- IA real.
- Accuracy real.
- Admin operativo.

Tampoco incluye el módulo de polla/quiniela/pool. Ese módulo no hace parte del MVP principal actual.

## Qué sigue ahora

El siguiente paso no debería ser “agregar más pantallas” sin control. Lo recomendable es avanzar por módulos:

1. Definir schema Supabase.
2. Implementar Auth y roles.
3. Crear planes dinámicos y paywall backend.
4. Implementar motor predictivo v0.1.
5. Conectar proveedor deportivo.
6. Conectar odds y Model vs Market.
7. Crear workers Railway.
8. Agregar narrativa IA.
9. Agregar Resend/emails.
10. Convertir Admin/Beta Lab y Transparency en módulos reales.
11. Preparar deploy/staging.

## Cómo trabajar por ramas

Evitemos trabajar directo en `main`.

Ramas sugeridas:

- `feature/supabase-schema`
- `feature/auth-roles`
- `feature/dynamic-plans-paywall`
- `feature/prediction-engine-v01`
- `feature/football-api`
- `feature/odds-model-market`
- `feature/railway-workers`
- `feature/resend-emails`
- `feature/admin-beta-lab-real`
- `feature/transparency-real`
- `feature/ui-polish-mobile`
- `feature/staging-deploy`

Regla práctica: una rama debe tocar un módulo claro. Si una tarea empieza a tocar demasiadas carpetas, probablemente está mezclando épicas.

## Mensaje clave

UFO Predictor ya tiene forma de producto. Ahora toca convertir la simulación en sistema real, sin perder dos principios:

- Probabilidades, no promesas.
- El modelo calcula; la IA explica.

