import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/session";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";

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

      <section className="panel rounded-lg border border-[var(--accent)]/30 p-5">
        <h2 className="text-lg font-semibold">Tu acceso gratis</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          <li>Las predicciones públicas y el detalle público de partidos ya están disponibles.</li>
          <li>Tu cuenta gratis activa el contexto completo de confianza/riesgo en vistas públicas.</li>
          <li>Los previews seleccionados previos al Mundial se habilitarán para cuentas gratis.</li>
          <li>El seguimiento de partidos y favoritos llegará próximamente.</li>
          <li>Los paquetes premium del Mundial y el análisis avanzado llegarán más adelante.</li>
        </ul>
      </section>

      {params.error === "admin-access-required" ? (
        <p className="rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4 text-sm text-[var(--warning)]">
          Tu perfil no tiene permisos de administrador para esa sección.
        </p>
      ) : null}

      {summary.status === "unavailable" ? (
        <p className="panel rounded-lg p-5 text-sm text-[var(--muted)]">{summary.message}</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="panel rounded-lg p-5">
              <h2 className="text-lg font-semibold">Estado de acceso</h2>
              <p className="mt-3 font-mono text-2xl">{roleLabels[summary.role]}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Suscripciones activas: {summary.activeSubscriptions.length}. El rol de perfil por sí
                solo no desbloquea contenido protegido.
              </p>
              <Link
                href="/pricing"
                className="mt-5 inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_20px_rgba(0,215,255,0.2)]"
              >
                Ver ruta de planes
              </Link>
            </section>

            <section className="panel rounded-lg p-5">
              <h2 className="text-lg font-semibold">Derechos actuales</h2>
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

          <section className="panel rounded-lg p-5">
            <h2 className="text-lg font-semibold">Partidos desbloqueados</h2>
            <div className="mt-4 space-y-3">
              {summary.matchUnlocks.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Aún no tienes partidos desbloqueados. El detalle premium todavía no está habilitado.
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
        </>
      )}

      <section className="panel rounded-lg p-5">
        <h2 className="text-lg font-semibold">Beta freemium</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          El backend ya distingue acceso público, acceso beta controlado server-side, derechos
          actuales y bypass administrativo explícito. Los pagos y payloads premium permanecen fuera
          de alcance.
        </p>
      </section>
    </div>
  );
}
