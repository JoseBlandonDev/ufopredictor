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
  const isAdmin = summary.status === "ready" && summary.role === "admin";
  const shouldShowUnlocks =
    summary.status === "ready" && summary.matchUnlocks.length > 0 && !premiumAccessActive;

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

      <section className="ufo-card rounded-2xl border border-[var(--accent)]/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Acceso actual</p>
            <h2 className="mt-2 text-xl font-semibold">
              {isAdmin ? "Estado de administrador" : premiumAccessActive ? `${getWorldCupProductName()} activo` : "Tu cuenta gratis"}
            </h2>
          </div>
          <span className="ufo-pill">{isAdmin ? "Administrador" : premiumAccessActive ? "Premium activo" : "Gratis activo"}</span>
        </div>
        {isAdmin ? (
          <>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Tu perfil conserva acceso a las operaciones administrativas disponibles y mantiene la experiencia comercial separada del trabajo operativo.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Usa el menú de Ops en la barra superior para entrar a las herramientas operativas.</li>
              <li>Este panel evita mezclar tu rol de administración con promesas de acceso premium comercial.</li>
            </ul>
          </>
        ) : premiumAccessActive ? (
          <>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Tu acceso premium está activo y fue validado en el servidor.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>{getWorldCupProductName()} habilita el detalle premium para los partidos publicados del Mundial 2026.</li>
              <li>No necesitas comprar de nuevo mientras tu acceso siga activo.</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/predictions" className="ufo-btn-primary ufo-focus-ring">
                Explorar predicciones
              </Link>
              <Link href="/dashboard" className="ufo-btn-secondary ufo-focus-ring">
                Ver guardados
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Tu cuenta gratis ya puede consultar las predicciones públicas, el contexto completo de confianza y riesgo y el historial verificado elegible.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/predictions" className="ufo-btn-primary ufo-focus-ring">
                Ver predicciones
              </Link>
              <Link href="/pricing" className="ufo-btn-secondary ufo-focus-ring">
                Ver {getWorldCupProductName()}
              </Link>
            </div>
          </>
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
          {summary.activeSubscriptions.length > 0 ? (
            <section className="ufo-card rounded-2xl p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Suscripciones activas</p>
              <div className="mt-4 space-y-3">
                {summary.activeSubscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-medium">{subscription.planName ?? getWorldCupProductName()}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Estado: {subscription.status}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Vigencia: {dateLabel(subscription.endsAt)}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {shouldShowUnlocks ? (
            <section className="ufo-card rounded-2xl p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Acceso adicional</p>
              <h2 className="mt-2 text-lg font-semibold">Partidos desbloqueados individualmente</h2>
              <div className="mt-4 space-y-3">
                {summary.matchUnlocks.map((unlock) => (
                  <div key={unlock.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-medium">Acceso individual activo</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Vigencia: {dateLabel(unlock.expires_at)}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="ufo-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Seguimiento</p>
                <h2 className="mt-2 text-lg font-semibold">Partidos guardados</h2>
              </div>
              <span className="ufo-pill border-white/10 bg-white/[0.03] text-[var(--muted)]">Lista guardada</span>
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
                  <article key={savedMatch.matchId} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-[var(--muted)]">{resolveCompetitionDisplayName(savedMatch.competitionName)}</p>
                    <h3 className="mt-1 font-medium break-words">
                      {resolveTeamDisplayName(savedMatch.homeTeamName)} vs {resolveTeamDisplayName(savedMatch.awayTeamName)}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">Partido: {formatMatchDateTimeLabel(savedMatch.kickoffAt)}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Guardado: {formatMatchDateTimeLabel(savedMatch.savedAt)}</p>
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

          {!isAdmin && !premiumAccessActive ? (
            <section className="ufo-card rounded-2xl border border-[var(--accent)]/25 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Siguiente paso recomendado</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                El {getWorldCupProductName()} desbloquea escenarios, xG y la lectura completa antes del inicio de cada partido publicado.
              </p>
              <div className="mt-4">
                <Link href="/pricing" className="ufo-btn-primary ufo-focus-ring">
                  Ver {getWorldCupProductName()}
                </Link>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
