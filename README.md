# UFO Predictor

Web/PWA de predicciones probabilísticas de fútbol, enfocada inicialmente en el Mundial 2026.

UFO Predictor no es una casa de apuestas, no recibe apuestas y no promete ganancias. El producto busca combinar datos deportivos, modelo estadístico propio, probabilidades y narrativa IA.

## Estado técnico actual

El proyecto ya cuenta con:

- App Next.js con App Router.
- TypeScript.
- Tailwind CSS.
- Branding inicial UFO Predictor.
- Supabase schema inicial.
- Supabase Auth.
- Roles `free_user` y `admin`.
- Dashboard y Admin protegidos.
- Beta Lab Foundation.
- Data Intake Minimal.

## Principio del modelo

> El modelo estadístico calcula. La IA explica.

El LLM no debe calcular probabilidades ni decidir resultados.

## Fases actuales

1. Fundación técnica — completada.
2. Lab interno pre-Mundial — en progreso avanzado.
3. MVP Mundial funcional — siguiente bloque.
4. Producto comercial / post-Mundial — posterior.

## Documentación clave

- `docs/START_HERE_FOR_NEW_CONVERSATIONS.md`
- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ROADMAP_AND_BACKLOG.md`
- `docs/DATA_DICTIONARY.md`
- `docs/MODEL_V01.md`
- `docs/CODEX_WORKFLOW.md`

## Desarrollo

```bash
npm install
npm run dev
npm run lint
npm run build
```

No trabajar directo en `main`. Cada épica debe tener su propia rama.

## Variables

Usar `.env.example` como referencia. No versionar `.env.local` ni secretos.
