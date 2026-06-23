import Link from "next/link";
import {
  getPredictionsViewerContext,
  renderPredictionCards,
  renderPredictionsAccountCallout,
} from "./page-helpers";
import { getWorldCupProductName } from "../../lib/presentation/public-display";
import { getPublicPredictionsData } from "@/lib/supabase/public-prediction-queries";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const { viewer, isAuthenticated, premiumAccessActive } = await getPredictionsViewerContext();
  const data = await getPublicPredictionsData(viewer);

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Predicciones
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Predicciones publicadas del Mundial 2026</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Consulta los próximos partidos publicados, revisa resultados recientes y entra al detalle
          premium cuando tu acceso y la publicación del partido lo permitan.
        </p>
      </section>

      {renderPredictionsAccountCallout({ isAuthenticated, premiumAccessActive })}

      {data.status === "unavailable" ? (
        <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
          <h2 className="text-lg font-semibold">Predicciones temporalmente no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
        </section>
      ) :
        data.livePredictions.length === 0 &&
        data.upcomingPredictions.length === 0 &&
        data.historicalPredictions.length === 0 ? (
        <section className="ufo-card rounded-lg p-6">
          <h2 className="text-lg font-semibold">Aún no hay predicciones públicas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Las predicciones publicadas para el Mundial 2026 aparecerán aquí cuando haya partidos
            programados.
          </p>
        </section>
      ) : (
        <>
          {data.livePredictions.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Partidos en curso</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Estos partidos ya comenzaron. Las probabilidades mostradas fueron publicadas
                    antes del inicio y no se actualizan en tiempo real.
                  </p>
                </div>
              </div>
              {renderPredictionCards({
                predictions: data.livePredictions,
                premiumAccessActive,
                showLiveState: true,
                showPreMatchDisclaimer: true,
              })}
            </section>
          ) : null}

          {data.upcomingPredictions.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Próximos partidos</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Esta sección muestra únicamente partidos programados para no mezclar futuros
                    encuentros con resultados ya cerrados.
                  </p>
                </div>
                <Link href="/predictions/upcoming" className="ufo-link-action ufo-focus-ring">
                  Ver todos los próximos
                </Link>
              </div>
              {renderPredictionCards({
                predictions: data.upcomingPredictions,
                premiumAccessActive,
              })}
            </section>
          ) : null}

          {data.historicalPredictions.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Resultados recientes</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Conservamos resultados verificados recientes como referencia, con el historial
                    completo disponible aparte.
                  </p>
                </div>
                <Link href="/predictions/history" className="ufo-link-action ufo-focus-ring">
                  Ir al historial
                </Link>
              </div>
              {renderPredictionCards({
                predictions: data.historicalPredictions,
                premiumAccessActive,
              })}
            </section>
          ) : null}

          <section className="ufo-card rounded-lg border border-white/15 p-5">
            <h2 className="text-lg font-semibold">Cómo leer esta vista</h2>
            <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <p>Las probabilidades reflejan una lectura del modelo, no una promesa de resultado.</p>
              <p>Alta incertidumbre: probabilidades cercanas. Ventaja ligera, no certeza.</p>
              <p>
                {premiumAccessActive
                  ? `Tu ${getWorldCupProductName()} habilita las secciones premium cuando están publicadas para el partido.`
                  : "Esta vista se mantiene en la lectura pública base hasta que actives el acceso premium."}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
