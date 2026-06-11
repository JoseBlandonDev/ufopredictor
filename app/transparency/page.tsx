export default function TransparencyPage() {
  return (
    <div className="space-y-8">
      <section className="ufo-card rounded-lg p-6 sm:p-7">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Centro de transparencia</p>
        <h1 className="mt-3 text-4xl font-semibold">Metodología, límites y estado real del producto</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">
          UFO Predictor es un producto de análisis probabilístico de fútbol. El modelo calcula probabilidades, no
          certezas. La capa de explicación ayuda a interpretar el contexto, pero no inventa probabilidades ni reemplaza
          la lógica estadística.
        </p>
      </section>

      <section className="ufo-card rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Estado actual</p>
            <h2 className="mt-2 text-2xl font-semibold">Qué sabemos hoy</h2>
          </div>
          <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Beta activa</span>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>Estamos en una etapa beta con calibración activa del producto y de la operación.</li>
          <li>Todavía no publicamos métricas históricas de rendimiento como evidencia pública definitiva.</li>
          <li>
            Cuando existan métricas públicas elegibles, se publicarán con fuente, período, tamaño de muestra y
            metodología de cálculo.
          </li>
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="ufo-card rounded-lg p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Lo que sí mostramos</p>
          <h2 className="mt-2 text-2xl font-semibold">Alcance público actual</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Metodología general del producto y lenguaje probabilístico.</li>
            <li>Límites actuales del alcance público durante la beta.</li>
            <li>Separación entre Lab interno, calibración beta y evidencia pública elegible.</li>
            <li>Compromiso de ampliar la transparencia cuando haya datos públicos evaluables y trazables.</li>
          </ul>
        </section>

        <section className="ufo-card rounded-lg p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Lo que no mostramos</p>
          <h2 className="mt-2 text-2xl font-semibold">Límites de publicación</h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>No mostramos `prediction_results` en el producto público.</li>
            <li>No publicamos métricas internas crudas de laboratorio ni trazas de evaluación interna.</li>
            <li>No exponemos campos de depuración ni datos administrativos privados.</li>
            <li>No mostramos métricas simuladas como rendimiento validado en producción.</li>
          </ul>
        </section>
      </section>

      <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
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
    </div>
  );
}
