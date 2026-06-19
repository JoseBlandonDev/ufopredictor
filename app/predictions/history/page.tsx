import Link from "next/link";
import {
  getPredictionsViewerContext,
  renderPredictionCards,
  renderPredictionPagination,
  renderPredictionsAccountCallout,
} from "../page-helpers";
import {
  getHistoricalPublicPredictionsPage,
  parsePredictionPage,
} from "@/lib/supabase/public-prediction-queries";

export const dynamic = "force-dynamic";

type PredictionHistoryPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

export default async function PredictionHistoryPage({
  searchParams,
}: PredictionHistoryPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parsePredictionPage(resolvedSearchParams.page);
  const { viewer, isAuthenticated, premiumAccessActive } = await getPredictionsViewerContext();
  const data = await getHistoricalPublicPredictionsPage(viewer, page);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Link href="/predictions" className="ufo-link-action ufo-focus-ring">
          Volver a predicciones
        </Link>
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
            Historial
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Historial publico verificado</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Esta vista conserva solo resultados finales verificados y publicados de forma segura,
            sin exponer evaluaciones internas ni payloads administrativos.
          </p>
        </div>
      </section>

      {renderPredictionsAccountCallout({ isAuthenticated, premiumAccessActive })}

      {data.status === "unavailable" ? (
        <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
          <h2 className="text-lg font-semibold">Historial temporalmente no disponible</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
        </section>
      ) : data.predictions.length === 0 ? (
        <section className="ufo-card rounded-lg p-6">
          <h2 className="text-lg font-semibold">No hay resultados verificados en esta pagina</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Prueba con otra pagina o vuelve a la vista principal de predicciones.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {renderPredictionCards({
            predictions: data.predictions,
            premiumAccessActive,
          })}
          {renderPredictionPagination({
            pathname: "/predictions/history",
            page: data.page,
            hasPreviousPage: data.hasPreviousPage,
            hasNextPage: data.hasNextPage,
            searchParams: resolvedSearchParams,
          })}
        </section>
      )}
    </div>
  );
}
