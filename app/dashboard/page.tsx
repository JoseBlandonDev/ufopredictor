import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/session";
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
  premium_user: "Cuenta premium futura",
};

type ReadyEntitlementSummary = Extract<
  Awaited<ReturnType<typeof getViewerEntitlementSummary>>,
  { status: "ready" }
>;

function hasCurrentPaidAccess(summary: ReadyEntitlementSummary) {
  return (
    summary.activeSubscriptions.length > 0 ||
    summary.entitlements.length > 0 ||
    summary.matchUnlocks.length > 0
  );
}

function dateLabel(value: string | null) {
  if (!value) {
    return "Sin vencimiento";
  }

  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value));
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;
  const summary = await getViewerEntitlementSummary();
  const savedMatches = await getSavedMatchesForDashboard();
  const paidAccessActive = summary.status === "ready" && hasCurrentPaidAccess(summary);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Panel</p>
          <h1 className="mt-3 text-4xl font-semibold">Panel de observador</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Sesión activa para <span className="text-white">{user.email}</span>. El estado de acceso
            se valida server-side y los payloads premium permanecen fuera de esta fase.
          </p>
        </div>
        <LogoutButton />
      </section>

      <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Acceso actual
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {paidAccessActive ? "World Cup Pass activo" : "Tu cuenta gratis"}
            </h2>
          </div>
          <span className="ufo-pill">{paidAccessActive ? "Premium activo" : "Activo"}</span>
        </div>
        {paidAccessActive ? (
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Tu pago fue confirmado por Wompi y el acceso quedo activado en el servidor.</li>
            <li>World Cup Pass habilita derechos premium para la competencia World Cup 2026.</li>
            <li>El contenido premium se muestra cuando el partido tiene proyeccion premium publicada.</li>
            <li>El acceso se conserva en tus derechos actuales, no depende del redirect del navegador.</li>
          </ul>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>Las predicciones públicas y el detalle público de partidos ya están disponibles.</li>
            <li>Tu cuenta gratis activa el contexto completo de confianza y riesgo en vistas públicas.</li>
            <li>Los partidos guardados muestran solo fixtures reales publicados para esta etapa de lanzamiento.</li>
            <li>World Cup Pass ya está disponible en Planes y se activa solo con pago aprobado por Wompi.</li>
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
                  {hasCurrentPaidAccess(summary) ? "Premium activo" : roleLabels[summary.role]}
                </span>
              </div>
              <p className="mt-4 font-mono text-2xl">
                {hasCurrentPaidAccess(summary) ? "World Cup Pass activo" : roleLabels[summary.role]}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Suscripciones activas: {summary.activeSubscriptions.length}. El rol de perfil por sí
                solo no desbloquea contenido protegido.
              </p>
              <Link
                href={hasCurrentPaidAccess(summary) ? "/predictions" : "/pricing"}
                className="ufo-btn-primary ufo-focus-ring mt-5"
              >
                {hasCurrentPaidAccess(summary) ? "Explorar predicciones" : "Ver ruta de planes"}
              </Link>
            </section>

            <section className="ufo-card rounded-lg p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Derechos disponibles
              </p>
              <h2 className="mt-2 text-lg font-semibold">Derechos actuales</h2>
              <div className="mt-4 space-y-3">
                {summary.entitlements.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Aún no tienes derechos adicionales. El acceso público básico sigue disponible.
                  </p>
                ) : (
                  summary.entitlements.map((entitlement) => (
                    <div
                      key={entitlement.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="font-medium">{entitlement.entitlement_type}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {entitlement.resource_type}: {entitlement.resource_id}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Vigencia: {dateLabel(entitlement.ends_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="ufo-card rounded-lg p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
              Acceso premium
            </p>
            <h2 className="mt-2 text-lg font-semibold">Desbloqueos por partido</h2>
            <div className="mt-4 space-y-3">
              {summary.matchUnlocks.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  {hasCurrentPaidAccess(summary) ? (
                    "Tu World Cup Pass aparece en derechos actuales; esta lista solo muestra desbloqueos individuales."
                  ) : (
                    <>
                  Aún no tienes partidos desbloqueados. El detalle premium todavía no está habilitado.
                    </>
                  )}
                </p>
              ) : (
                summary.matchUnlocks.map((unlock) => (
                  <div
                    key={unlock.id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="font-medium">Acceso a partido</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">ID: {unlock.match_id}</p>
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
                Watchlist
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {savedMatches.status === "unavailable" ? (
                <p className="text-sm text-[var(--muted)]">{savedMatches.message}</p>
              ) : savedMatches.matches.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--muted)]">Aún no guardaste partidos.</p>
                  <Link href="/predictions" className="ufo-btn-secondary ufo-focus-ring">
                    Explorar predicciones públicas
                  </Link>
                </div>
              ) : (
                savedMatches.matches.map((savedMatch) => (
                  <article
                    key={savedMatch.matchId}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-sm text-[var(--muted)]">{savedMatch.competitionName}</p>
                    <h3 className="mt-1 font-medium">
                      {savedMatch.homeTeamName} vs {savedMatch.awayTeamName}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Kickoff: {dateTimeLabel(savedMatch.kickoffAt)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Guardado: {dateTimeLabel(savedMatch.savedAt)}
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
          Acceso actual
        </p>
        <h2 className="mt-2 text-lg font-semibold">Estado de la etapa actual</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          El backend ya distingue acceso público, derechos actuales y bypass administrativo explícito.
          Los pagos confirmados por Wompi activan derechos premium sin depender del redirect del navegador.
        </p>
      </section>
    </div>
  );
}
