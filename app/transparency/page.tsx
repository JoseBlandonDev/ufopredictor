export default function TransparencyPage() {
  return (
    <div className="space-y-8">
      <section className="panel rounded-lg p-6">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Centro de transparencia</p>
        <h1 className="mt-3 text-4xl font-semibold">Metodologia, limites y estado real del producto</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">
          UFO Predictor es un producto de analisis probabilistico de futbol. El modelo calcula probabilidades, no
          certezas. La capa de explicacion ayuda a interpretar el contexto, pero no inventa probabilidades ni reemplaza
          la logica estadistica.
        </p>
      </section>

      <section className="panel rounded-lg p-6">
        <h2 className="text-2xl font-semibold">Estado actual</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>Estamos en una etapa beta con calibracion activa del producto y de la operacion.</li>
          <li>Todavia no publicamos metricas historicas de rendimiento como evidencia publica definitiva.</li>
          <li>
            Cuando existan metricas publicas elegibles, se publicaran con fuente, periodo, tamano de muestra y
            metodologia de calculo.
          </li>
        </ul>
      </section>

      <section className="panel rounded-lg p-6">
        <h2 className="text-2xl font-semibold">Que si mostramos hoy</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>Metodologia general del producto y lenguaje probabilistico.</li>
          <li>Limites actuales del alcance publico durante la beta.</li>
          <li>Separacion entre Lab interno, calibracion beta y evidencia publica elegible.</li>
          <li>Compromiso de ampliar la transparencia cuando haya datos publicos evaluables y trazables.</li>
        </ul>
      </section>

      <section className="panel rounded-lg p-6">
        <h2 className="text-2xl font-semibold">Que no mostramos hoy</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>No mostramos `prediction_results` en el producto publico.</li>
          <li>No publicamos metricas internas crudas de laboratorio ni trazas de evaluacion interna.</li>
          <li>No exponemos campos de depuracion ni datos administrativos privados.</li>
          <li>No presentamos metricas simuladas como si fueran rendimiento validado en produccion.</li>
        </ul>
      </section>

      <section className="panel rounded-lg border border-[var(--warning)]/25 p-6">
        <h2 className="text-2xl font-semibold">Aviso importante</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
          <li>UFO Predictor no es una casa de apuestas ni un sportsbook.</li>
          <li>UFO Predictor no acepta apuestas.</li>
          <li>Este contenido no es consejo de apuesta ni asesoria financiera.</li>
          <li>No garantizamos resultados.</li>
          <li>Toda prediccion debe interpretarse con incertidumbre.</li>
        </ul>
      </section>
    </div>
  );
}
