# PROJECT_RULES.md — UFO Predictor

Este archivo define reglas obligatorias para cualquier humano o IA que trabaje en este repositorio. Si Codex, Claude, Gemini o cualquier otro asistente propone algo que contradiga estas reglas, debe pedir confirmación antes de aplicarlo. Porque dejar que una IA rediseñe arquitectura sin permiso es una forma moderna de invocar incendios.

## 1. Identidad del proyecto

- Nombre actual del proyecto: **UFO Predictor**.
- Tipo de producto: **web/PWA**, no app nativa en esta fase.
- Dominio de producto: predicciones de fútbol con IA, datos y análisis probabilístico.
- Enfoque inicial: Mundial 2026.
- Continuidad futura: ligas europeas y otras competiciones.
- Narrativa de marca: inteligencia extraterrestre / tecnología no humana / señales cósmicas analizando el caos humano del fútbol.
- No incluir por ahora módulo de polla/quiniela/pool en el MVP principal. Se manejará aparte.

## 2. Stack obligatorio para el prototipo

- Lenguaje: **TypeScript**.
- Framework: **Next.js App Router**.
- UI: **React**.
- Estilos: **Tailwind CSS**.
- Componentes: **shadcn/ui** cuando aplique.
- Runtime/hosting objetivo: **Railway**.
- Base de datos objetivo: **Supabase PostgreSQL**.
- Auth objetivo: **Supabase Auth**.
- Seguridad DB: **Supabase RLS**.
- Emails: **Resend + React Email**.
- Validación de datos: **Zod**.
- Repositorio: **GitHub**.

## 3. Reglas de seguridad

- No exponer API keys en frontend.
- No poner secretos reales en archivos versionados.
- No usar variables sensibles con prefijo `NEXT_PUBLIC_`.
- No llamar APIs externas directamente desde componentes de cliente.
- No devolver datos premium al frontend si el usuario no tiene permiso.
- El paywall no debe ser solo visual. El backend/API debe filtrar los datos.
- Supabase Service Role Key solo se usa en servidor/workers, nunca en cliente.

## 4. Reglas de arquitectura

- El frontend consulta nuestra API interna o Server Actions.
- Los workers actualizan Supabase.
- El usuario no dispara cálculos pesados cada vez que abre una página.
- Los datos numéricos de predicción se calculan y se guardan en base de datos.
- Las narrativas IA se generan cuando cambia una predicción, no por cada visita del usuario.
- La IA no decide resultados. La IA solo explica resultados calculados por el modelo estadístico.
- Toda predicción debe guardarse versionada.
- Todo worker debe registrar su ejecución en `worker_runs`.

## 5. Reglas del modelo predictivo

- El modelo v0.1 usa enfoque estadístico explicable:
  - Team Power Score.
  - Expected Goals.
  - Poisson.
  - Market Blend.
  - Confidence Score.
  - Risk Level.
- Mercados iniciales:
  - 1X2.
  - Marcador probable.
  - Top 3 marcadores.
  - Over/Under 2.5.
  - BTTS.
  - Model vs Market.
- No implementar goleadores, corners, tarjetas, asistencias ni apuestas combinadas en el prototipo.

## 6. Reglas de planes dinámicos

- Los planes deben ser configurables desde base de datos, no hardcodeados.
- El MVP debe soportar conceptualmente:
  - Free.
  - World Cup Pass.
  - 10 Match Pack.
  - Knockout Pass.
  - Semifinals + Final Pass.
  - Team Pass.
  - Premium Monthly.
- El prototipo puede usar mock data, pero debe respetar esta estructura.

## 7. Reglas de UI/UX

- Mobile-first.
- Estética sci-fi/deportiva sobria.
- No estética de casino barato.
- No prometer ganancias.
- No usar lenguaje como “apuesta segura”, “fixed”, “100% ganador” o similares.
- Usar disclaimers: predicciones probabilísticas, no consejos de apuesta.
- El producto debe sentirse tecnológico, claro y confiable.

## 8. Reglas de implementación del primer prototipo

En el primer prototipo:

- Usar mock data.
- No conectar Supabase real todavía.
- No conectar Railway real todavía.
- No conectar Resend real todavía.
- No conectar API-Football/Sportmonks real todavía.
- No conectar LLM real todavía.
- No implementar pagos reales todavía.
- Crear skeletons y TODOs claros para esas futuras integraciones.

## 9. Reglas de Git

- No trabajar directo en `main` salvo que se acuerde explícitamente.
- Usar branches tipo:
  - `feature/initial-prototype`
  - `feature/project-context`
  - `feature/prediction-engine`
  - `fix/...`
- Cada cambio importante debe tener commit descriptivo.
- El contexto del proyecto debe subirse al repo para que los demás y sus IAs tengan la misma base.
