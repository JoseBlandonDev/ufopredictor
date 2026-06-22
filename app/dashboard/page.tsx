import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import {
  formatMatchDateTimeLabel,
  formatVenueLabel,
  getWorldCupProductName,
  resolveCompetitionDisplayName,
  resolveTeamDisplayName,
} from "../../lib/presentation/public-display";
import { hasCurrentPremiumAccess } from "@/lib/permissions/current-premium-access";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";
import { getSavedMatchesForDashboard } from "@/lib/supabase/saved-matches-queries";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const roleLabels = {
  admin: "Administrador",
  free_user: "Cuenta gratis",
  premium_user: "Cuenta premium",
};

function dateLabel(value: string | null) {
  if (!value) {
    return "Sin vencimiento";
  }

  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value));
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;
  const summary = await getViewerEntitlementSummary();
  const savedMatches = await getSavedMatchesForDashboard();
  const premiumAccessActive = hasCurrentPremiumAccess(summary);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Panel</p>
          <h1 className="mt-3 text-4xl font-semibold">Tu panel</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Sesión activa para <span className="text-white">{user.email}</span>.
          </p>
        </div>
      </section>

      <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Acceso actual
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {summary.status === "ready" && summary.role === "admin"
                ? "Estado de administrador"
                : premiumAccessActive
                  ? `${getWorldCupProductName()} activo`
                  : "Tu cuenta gratis"}
            </h2>
          </div>
          <span className="ufo-pill">
            {summary.status === "ready" && summary.role === "admin"
              ? "Administrador"
              : premiumAccessActive
                ? "Premium activo"
                : "Activo"}
          </span>
        </div>
        {summary.status === "ready" && summary.role === "admin" ? (
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Tu perfil conserva acceso a las operaciones administrativas disponibles.</li>
            <li>Este panel evita mezclar tu rol de administración con promesas de acceso premium comercial.</li>
            <li>Usa el menú de Ops en la barra superior para entrar a las herramientas operativas.</li>
          </ul>
        ) : premiumAccessActive ? (
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Tu acceso premium está activo y fue validado en el servidor.</li>
            <li>{getWorldCupProductName()} habilita el detalle premium para todos los partidos publicados del Mundial 2026.</li>
            <li>No necesitas comprar de nuevo mientras tu acceso siga activo.</li>
          </ul>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Las predicciones públicas y el detalle público de partidos ya están disponibles.</li>
            <li>Tu cuenta gratis activa el contexto completo de confianza y riesgo en vistas públicas.</li>
            <li>Los partidos guardados muestran solo encuentros publicados del Mundial 2026.</li>
            <li>{getWorldCupProductName()} ya está disponible en la página de compra.</li>
          </ul>
        )}
      </section>

      {params.error === "admin-access-required" ? (
        <p className="rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4 text-sm text-[var(--warning)]">
          Tu perfil no tiene permisos de administrador para esa sección.
        </p>
      ) : null}

      {summary.status === "unavailable" ? (
        <section className="ufo-card rounded-lg p-5 text-sm text-[var(--muted)]">
          <p>{summary.message}</p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="ufo-card rounded-lg p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                    Resumen de acceso
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">Estado de acceso</h2>
                </div>
                <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">
                  {hasCurrentPremiumAccess(summary) ? "Premium activo" : roleLabels[summary.role]}
                </span>
              </div>
              <p className="mt-4 font-mono text-2xl">
                {summary.role === "admin"
                  ? "Administrador"
                  : hasCurrentPremiumAccess(summary)
                    ? `${getWorldCupProductName()} activo`
                    : roleLabels[summary.role]}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {summary.role === "admin"
                  ? "Tu cuenta mantiene acceso operativo y administración del producto."
                  : hasCurrentPremiumAccess(summary)
                    ? "Tu acceso premium cubre todos los partidos publicados con detalle avanzado disponible."
                    : "Tu cuenta gratuita te permite seguir predicciones públicas y guardar partidos."}
              </p>
              <Link
                href={summary.role === "admin" || hasCurrentPremiumAccess(summary) ? "/predictions" : "/pricing"}
                className="ufo-btn-primary ufo-focus-ring mt-5"
              >
                {summary.role === "admin" || hasCurrentPremiumAccess(summary)
                  ? "Explorar predicciones"
                  : `Ver ${getWorldCupProductName()}`}
              </Link>
            </section>

            <section className="ufo-card rounded-lg p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Estado de la cuenta
              </p>
              <h2 className="mt-2 text-lg font-semibold">Resumen de acceso</h2>
              <div className="mt-4 space-y-3">
                {summary.role === "admin" ? (
                  <p className="text-sm text-[var(--muted)]">
                    Tu rol de administrador se mantiene separado del producto comercial.
                  </p>
                ) : summary.entitlements.length === 0 && summary.activeSubscriptions.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    No hay compras activas registradas. Tu acceso base sigue disponible para la experiencia pública.
                  </p>
                ) : (
                  summary.activeSubscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="font-medium">{subscription.planName ?? getWorldCupProductName()}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Estado: {subscription.status}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Vigencia: {dateLabel(subscription.endsAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="ufo-card rounded-lg p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Acceso adicional
            </p>
            <h2 className="mt-2 text-lg font-semibold">Partidos desbloqueados individualmente</h2>
            <div className="mt-4 space-y-3">
              {summary.matchUnlocks.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  {hasCurrentPremiumAccess(summary) ? (
                    `Tu ${getWorldCupProductName()} aparece en tu resumen principal; esta lista solo muestra desbloqueos individuales.`
                  ) : (
                    "Aún no tienes partidos desbloqueados de forma individual."
                  )}
                </p>
              ) : (
                summary.matchUnlocks.map((unlock) => (
                  <div
                    key={unlock.id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="font-medium">Acceso individual activo</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Vigencia: {dateLabel(unlock.expires_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="ufo-card rounded-lg p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                  Seguimiento
                </p>
                <h2 className="mt-2 text-lg font-semibold">Partidos guardados</h2>
              </div>
              <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">
                Lista guardada
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {savedMatches.status === "unavailable" ? (
                <p className="text-sm text-[var(--muted)]">{savedMatches.message}</p>
              ) : savedMatches.matches.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--muted)]">Aún no guardaste partidos.</p>
                  <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
                    {premiumAccessActive ? "Explorar predicciones premium" : "Explorar predicciones públicas"}
                  </Link>
                </div>
              ) : (
                savedMatches.matches.map((savedMatch) => (
                  <article
                    key={savedMatch.matchId}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-sm text-[var(--muted)]">
                      {resolveCompetitionDisplayName(savedMatch.competitionName)}
                    </p>
                    <h3 className="mt-1 font-medium break-words">
                      {resolveTeamDisplayName(savedMatch.homeTeamName)} vs {resolveTeamDisplayName(savedMatch.awayTeamName)}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Partido: {formatMatchDateTimeLabel(savedMatch.kickoffAt)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Guardado: {formatMatchDateTimeLabel(savedMatch.savedAt)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)] break-words">
                      {formatVenueLabel({
                        venueName: savedMatch.venueName,
                        venueCity: savedMatch.venueCity,
                      })}
                    </p>
                    <Link href={`/matches/${savedMatch.matchSlug}`} className="ufo-link-action ufo-focus-ring mt-3">
                      Ver detalle del partido
                    </Link>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}

      <section className="ufo-card rounded-lg p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Resumen final
        </p>
        <h2 className="mt-2 text-lg font-semibold">Lo que puedes hacer desde aquí</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Revisa tus partidos guardados, vuelve a las predicciones publicadas y entra al detalle de
          cada encuentro según tu nivel de acceso actual.
        </p>
      </section>
    </div>
  );
}
