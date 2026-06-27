import Link from "next/link";
import { PublicPredictionCard } from "@/components/public-prediction-card";
import { getWorldCupProductName } from "../../lib/presentation/public-display";
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
    <section className="ufo-card rounded-2xl border border-[var(--accent)]/25 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">
        {premiumAccessActive
          ? `${getWorldCupProductName()} activo`
          : isAuthenticated
            ? "Tu cuenta gratis ya está activa"
            : "Sigue todos los partidos con una cuenta gratis"}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {premiumAccessActive
          ? "Tu acceso premium ya está activo. Entra al detalle de cada partido para ver el análisis completo cuando esté publicado."
          : isAuthenticated
            ? "Ya ves las probabilidades 1X2 completas, el contexto de confianza y riesgo, y el historial verificado cuando corresponde."
            : "Crea tu cuenta para consultar las probabilidades 1X2 publicadas, el contexto de confianza y riesgo, y guardar partidos para revisarlos después."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {premiumAccessActive ? (
          <>
            <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
              Abrir panel
            </Link>
            <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
              Explorar predicciones
            </Link>
          </>
        ) : isAuthenticated ? (
          <>
            <Link href="/predictions" className="ufo-btn-primary ufo-focus-ring">
              Ver predicciones
            </Link>
            <Link href="/pricing" className="ufo-btn-secondary ufo-focus-ring">
              Ver {getWorldCupProductName()}
            </Link>
          </>
        ) : (
          <>
            <Link href="/register?next=/predictions" className="ufo-btn-primary ufo-focus-ring">
              Crear cuenta gratis
            </Link>
            <Link href="/login?next=/predictions" className="ufo-btn-secondary ufo-focus-ring">
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export function renderPredictionCards(args: {
  predictions: PublicPredictionCardView[];
  viewer: PublicPredictionViewer;
  premiumAccessActive: boolean;
  showLiveState?: boolean;
  showPreMatchDisclaimer?: boolean;
  boundedAnonymousAfter?: number;
}) {
  const previewCutoff = args.viewer === "anonymous" ? (args.boundedAnonymousAfter ?? 1) : Number.MAX_SAFE_INTEGER;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {args.predictions.map((prediction, index) => (
        <PublicPredictionCard
          key={prediction.matchSlug}
          prediction={prediction}
          detailMode={index < previewCutoff ? "full" : "preview"}
          premiumAccessActive={args.premiumAccessActive}
          showLiveState={args.showLiveState}
          showPreMatchDisclaimer={args.showPreMatchDisclaimer}
        />
      ))}
    </div>
  );
}

export function renderAnonymousRegistrationModule(args: { nextPath: string }) {
  return (
    <section className="ufo-card rounded-2xl border border-[var(--accent)]/25 p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Sigue todos los partidos con una cuenta gratis</h2>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
        Crea tu cuenta para consultar las probabilidades 1X2 publicadas, el contexto de confianza y
        riesgo, y guardar partidos para revisarlos después.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/register?next=${encodeURIComponent(args.nextPath)}`} className="ufo-btn-primary ufo-focus-ring">
          Crear cuenta gratis
        </Link>
        <Link href={`/login?next=${encodeURIComponent(args.nextPath)}`} className="ufo-btn-secondary ufo-focus-ring">
          Iniciar sesión
        </Link>
      </div>
    </section>
  );
}

export function renderPremiumUpgradeModule() {
  return (
    <section className="ufo-card rounded-2xl border border-[var(--accent)]/30 p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Ve más allá del 1X2</h2>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
        El {getWorldCupProductName()} desbloquea escenarios representativos, goles esperados,
        probabilidad de que anoten ambos equipos, proyección del total de goles y una explicación
        completa de cada partido.
      </p>
      <div className="mt-5">
        <Link href="/pricing" className="ufo-btn-primary ufo-focus-ring">
          Ver {getWorldCupProductName()}
        </Link>
      </div>
    </section>
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
      <span className="text-sm text-[var(--muted)]">Página {args.page}</span>
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
