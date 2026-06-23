import Link from "next/link";

export default function TransparencyPage() {
  return (
    <div className="space-y-8">
      <section className="ufo-card rounded-2xl p-6 sm:p-7">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Centro de transparencia</p>
        <h1 className="mt-3 text-4xl font-semibold">Cómo leer UFO Predictor</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">
          UFO Predictor es un producto de análisis probabilístico de fútbol. La versión pública actual muestra probabilidades, escenarios representativos y señales de contexto para ayudarte a interpretar cada partido sin presentar certezas.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="ufo-card rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Qué calcula UFO Predictor</p>
          <h2 className="mt-2 text-2xl font-semibold">Probabilidades, escenarios y contexto</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>1X2: la probabilidad estimada de victoria local, empate o victoria visitante.</li>
            <li>Escenarios representativos: marcadores plausibles que ayudan a leer el tipo de partido que el modelo imagina.</li>
            <li>xG, ambos equipos marcan y Más/Menos de 2,5 como señales complementarias del partido.</li>
            <li>Confianza y riesgo para resumir estabilidad e incertidumbre en la lectura actual.</li>
          </ul>
        </section>

        <section className="ufo-card rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Cómo interpretar la lectura</p>
          <h2 className="mt-2 text-2xl font-semibold">Qué sí y qué no significa</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>1X2 indica hacia dónde se inclina el modelo, no el resultado que debe ocurrir.</li>
            <li>Los escenarios representativos muestran caminos plausibles, no marcadores oficiales del futuro.</li>
            <li>xG resume volumen ofensivo esperado; no equivale a un marcador garantizado.</li>
            <li>Confianza alta no elimina el riesgo. Riesgo alto no invalida la lectura del partido.</li>
          </ul>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="ufo-card rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Qué usa hoy el producto</p>
          <h2 className="mt-2 text-2xl font-semibold">Versión pública actual</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Probabilidades 1X2 publicadas para partidos seleccionados del Mundial 2026.</li>
            <li>Señales premium publicadas como xG, ambos equipos marcan y Más/Menos de 2,5.</li>
            <li>Resultados finales verificados para conservar el historial público.</li>
            <li>Actualizaciones por partido conforme el producto publica nuevas lecturas.</li>
          </ul>
        </section>

        <section className="ufo-card rounded-2xl p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Limitaciones</p>
          <h2 className="mt-2 text-2xl font-semibold">Qué no debes asumir</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>No mostramos todas las variables posibles del fútbol real.</li>
            <li>No cada partido recibe la misma profundidad al mismo tiempo.</li>
            <li>No presentamos esta versión como una prueba de superioridad material frente a modelos previos.</li>
            <li>No hay garantía de resultado, rentabilidad ni acierto por partido.</li>
          </ul>
        </section>
      </section>

      <section className="ufo-card rounded-2xl p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Historial y actualización</p>
        <h2 className="mt-2 text-2xl font-semibold">Cómo se conserva la información pública</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>Los partidos terminados con resultado verificado permanecen como historial público.</li>
          <li>Los próximos partidos se separan de los resultados recientes para evitar confusión.</li>
          <li>Los partidos en curso mantienen la predicción publicada antes del inicio y no se recalculan en vivo.</li>
          <li>Si no hay un partido publicado todavía, preferimos un estado honesto a forzar cobertura artificial.</li>
        </ul>
      </section>

      <section className="ufo-card rounded-2xl border border-[var(--warning)]/25 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--warning)]">Aviso importante</p>
            <h2 className="mt-2 text-2xl font-semibold">Cómo debe interpretarse este producto</h2>
          </div>
          <span className="ufo-pill border-[var(--warning)]/25 bg-[var(--warning)]/10 text-[var(--warning)]">
            Sin garantías
          </span>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>UFO Predictor no es una casa de apuestas ni un sportsbook.</li>
          <li>UFO Predictor no acepta apuestas.</li>
          <li>Este contenido no es consejo de apuesta ni asesoría financiera.</li>
          <li>No garantizamos resultados.</li>
          <li>Toda predicción debe interpretarse con incertidumbre.</li>
        </ul>
      </section>

      <section className="ufo-card rounded-2xl p-6">
        <h2 className="text-xl font-semibold">Ver el producto en contexto</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Si quieres ver cómo se presentan estas lecturas en partidos publicados y resultados verificados, puedes explorar la vista pública.
        </p>
        <div className="mt-4">
          <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
            Explorar predicciones
          </Link>
        </div>
      </section>
    </div>
  );
}
