import Link from "next/link";
import { PublicPredictionCard } from "@/components/public-prediction-card";
import { hasCurrentPremiumAccess } from "@/lib/permissions/current-premium-access";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";
import type { PublicPredictionCardView, PublicPredictionViewer } from "@/lib/supabase/public-prediction-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParamValue = string | string[] | undefined;

export async function getPredictionsViewerContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer: PublicPredictionViewer = user ? "registered_free" : "anonymous";
  const isAuthenticated = viewer === "registered_free";
  const viewerSummary = user ? await getViewerEntitlementSummary() : null;
  const premiumAccessActive = hasCurrentPremiumAccess(viewerSummary);

  return {
    viewer,
    isAuthenticated,
    premiumAccessActive,
  };
}

export function renderPredictionsAccountCallout(args: {
  isAuthenticated: boolean;
  premiumAccessActive: boolean;
}) {
  const { isAuthenticated, premiumAccessActive } = args;

  return (
    <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5">
      <h2 className="text-lg font-semibold">
        {premiumAccessActive
          ? "World Cup Pass activo"
          : isAuthenticated
            ? "Tu cuenta gratis esta activa"
            : "Cuenta gratis disponible"}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {premiumAccessActive
          ? "Tu acceso premium ya esta activo. Entra al detalle de cada partido para ver las secciones avanzadas que esten publicadas."
          : isAuthenticated
            ? "Ya ves el contexto completo de confianza y riesgo en las predicciones publicas publicadas y puedes seguir el detalle del partido."
            : "Crea una cuenta gratis para desbloquear el contexto completo de confianza y riesgo y seguir las predicciones publicas publicadas con mas claridad."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {premiumAccessActive ? (
          <>
            <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
              Abrir panel premium
            </Link>
            <Link href="/pricing" className="ufo-btn-secondary ufo-focus-ring">
              Revisar World Cup Pass
            </Link>
          </>
        ) : isAuthenticated ? (
          <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
            Abrir tu panel
          </Link>
        ) : (
          <>
            <Link href="/register?next=/predictions" className="ufo-btn-primary ufo-focus-ring">
              Crear cuenta gratis
            </Link>
            <Link href="/login?next=/predictions" className="ufo-btn-secondary ufo-focus-ring">
              Iniciar sesion
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export function renderPredictionCards(args: {
  predictions: PublicPredictionCardView[];
  premiumAccessActive: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {args.predictions.map((prediction) => (
        <PublicPredictionCard
          key={prediction.matchSlug}
          prediction={prediction}
          premiumAccessActive={args.premiumAccessActive}
        />
      ))}
    </div>
  );
}

export function buildPredictionPageHref(
  pathname: string,
  searchParams: Record<string, SearchParamValue>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") continue;
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized) {
      params.set(key, normalized);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function renderPredictionPagination(args: {
  pathname: string;
  page: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  searchParams: Record<string, SearchParamValue>;
}) {
  if (!args.hasPreviousPage && !args.hasNextPage) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
      <span className="text-sm text-[var(--muted)]">Pagina {args.page}</span>
      <div className="flex gap-3">
        {args.hasPreviousPage ? (
          <Link
            href={buildPredictionPageHref(args.pathname, args.searchParams, args.page - 1)}
            className="ufo-btn-secondary ufo-focus-ring"
          >
            Anterior
          </Link>
        ) : null}
        {args.hasNextPage ? (
          <Link
            href={buildPredictionPageHref(args.pathname, args.searchParams, args.page + 1)}
            className="ufo-btn-secondary ufo-focus-ring"
          >
            Siguiente
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
