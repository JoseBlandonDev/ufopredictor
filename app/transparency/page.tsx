import { TransparencyStats } from "@/components/transparency-stats";
import { pastPredictions, performanceMetrics } from "@/lib/mock-data";

export default function TransparencyPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Centro de transparencia</p>
        <h1 className="mt-3 text-4xl font-semibold">Rendimiento del modelo, visible por diseño</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Los valores actuales son métricas beta simuladas. La versión productiva deberá validar predicciones tras los resultados y separar precisión prealineación y postalineación.
        </p>
      </section>
      <TransparencyStats metrics={performanceMetrics} history={pastPredictions} />
      <p className="text-sm text-[var(--muted)]">
        Aviso: las predicciones son análisis probabilístico, no asesoría financiera ni instrucciones de apuesta.
      </p>
    </div>
  );
}
