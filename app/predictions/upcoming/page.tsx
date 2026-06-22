import Link from "next/link";
import {
  getPredictionsViewerContext,
  renderPredictionCards,
  renderPredictionPagination,
  renderPredictionsAccountCallout,
} from "../page-helpers";
import {
  getUpcomingPublicPredictionsPage,
  parsePredictionPage,
} from "@/lib/supabase/public-prediction-queries";

export const dynamic = "force-dynamic";

type UpcomingPredictionsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

export default async function UpcomingPredictionsPage({
  searchParams,
}: UpcomingPredictionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parsePredictionPage(resolvedSearchParams.page);
  const { viewer, isAuthenticated, premiumAccessActive } = await getPredictionsViewerContext();
  const data = await getUpcomingPublicPredictionsPage(viewer, page);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Link href="/predictions" className="ufo-link-action ufo-focus-ring">
          Volver a predicciones
        </Link>
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
            Predicciones
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Todos los próximos partidos publicados</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Esta vista lista partidos programados y publicados del Mundial 2026, con paginación del
            lado del servidor para mantener la lectura ligera y ordenada.
          </p>
        </div>
      </section>

      {renderPredictionsAccountCallout({ isAuthenticated, premiumAccessActive })}

      {data.status === "unavailable" ? (
        <section className="ufo-card rounded-lg border border-[var(--warning)]/25 p-6">
          <h2 className="text-lg font-semibold">Predicciones temporalmente no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
        </section>
      ) : data.predictions.length === 0 ? (
        <section className="ufo-card rounded-lg p-6">
          <h2 className="text-lg font-semibold">No hay próximos partidos en esta página</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Prueba con otra página o vuelve a la vista principal de predicciones.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {renderPredictionCards({
            predictions: data.predictions,
            premiumAccessActive,
          })}
          {renderPredictionPagination({
            pathname: "/predictions/upcoming",
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
