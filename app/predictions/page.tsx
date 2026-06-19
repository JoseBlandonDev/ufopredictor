import Link from "next/link";
import {
  getPredictionsViewerContext,
  renderPredictionCards,
  renderPredictionsAccountCallout,
} from "./page-helpers";
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
        <h1 className="mt-3 text-4xl font-semibold">Predicciones reales publicadas del Mundial 2026</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Las probabilidades 1X2 basicas ya estan publicadas para fixtures reales seleccionados del
          Mundial 2026. El detalle premium se muestra cuando tu acceso y la publicacion del partido lo permiten.
        </p>
      </section>

      {renderPredictionsAccountCallout({ isAuthenticated, premiumAccessActive })}

      {data.status === "unavailable" ? (
        <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
          <h2 className="text-lg font-semibold">Predicciones temporalmente no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
        </section>
      ) : data.upcomingPredictions.length === 0 && data.historicalPredictions.length === 0 ? (
        <section className="ufo-card rounded-lg p-6">
          <h2 className="text-lg font-semibold">Aun no hay predicciones publicas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Las predicciones publicadas para producto publico apareceran aqui.
          </p>
        </section>
      ) : (
        <>
          {data.upcomingPredictions.length > 0 ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                <h2 className="text-2xl font-semibold">Predicciones activas y proximas</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Los partidos en vivo o por jugar aparecen primero para priorizar la lectura actual
                  del modelo.
                </p>
                </div>
                <Link href="/predictions/upcoming" className="ufo-link-action ufo-focus-ring">
                  Ver todos los proximos
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
                <h2 className="text-2xl font-semibold">Resultados recientes e historial</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Los fixtures finalizados quedan en una seccion secundaria para no dominar la vista
                  principal de predicciones.
                </p>
                </div>
                <Link href="/predictions/history" className="ufo-link-action ufo-focus-ring">
                  Ver historial completo
                </Link>
              </div>
              {renderPredictionCards({
                predictions: data.historicalPredictions,
                premiumAccessActive,
              })}
            </section>
          ) : null}

          <section className="ufo-card rounded-lg border border-white/15 p-5">
            <h2 className="text-lg font-semibold">Como leer esta vista</h2>
            <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <p>Las probabilidades reflejan una lectura del modelo, no una promesa de resultado.</p>
              <p>Alta incertidumbre: probabilidades cercanas. Ventaja ligera, no certeza.</p>
              <p>
                {premiumAccessActive
                  ? "Tu World Cup Pass habilita las secciones premium cuando estan publicadas para el partido."
                  : "Esta vista sigue limitada a predicciones publicas basicas para fixtures reales seleccionados."}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
