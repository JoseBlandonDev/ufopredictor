import { PublicPredictionCard } from "@/components/public-prediction-card";
import { getPublicPredictionsData } from "@/lib/supabase/public-prediction-queries";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const data = await getPublicPredictionsData();

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Predicciones</p>
        <h1 className="mt-3 text-4xl font-semibold">Cartelera pública del Mundial 2026</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Probabilidades 1X2, confianza y riesgo leídos desde predicciones publicables.
          El laboratorio interno y los análisis premium permanecen fuera de esta vista.
        </p>
      </section>
      {data.status === "unavailable" ? (
        <section className="panel rounded-lg border border-[var(--warning)]/25 p-6">
          <h2 className="text-lg font-semibold">Predicciones temporalmente no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
        </section>
      ) : data.predictions.length === 0 ? (
        <section className="panel rounded-lg p-6">
          <h2 className="text-lg font-semibold">Aún no hay predicciones publicadas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Cuando exista una predicción marcada para producto público aparecerá aquí.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.predictions.map((prediction) => (
            <PublicPredictionCard
              key={prediction.matchSlug}
              prediction={prediction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
