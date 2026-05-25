import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth/session";
import { mockUser, plans, matches } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;
  const activePlan = plans.find((plan) => plan.slug === mockUser.planSlug);
  const unlockedMatchIds = new Set(mockUser.matchUnlocks.map((unlock) => unlock.matchId));
  const unlockedMatches = matches.filter((match) => unlockedMatchIds.has(match.id));

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Panel</p>
          <h1 className="mt-3 text-4xl font-semibold">Consola del observador</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Sesión activa para <span className="text-white">{user.email}</span>. Planes y desbloqueos permanecen simulados en esta fase.
          </p>
        </div>
        <LogoutButton />
      </section>
      {params.error === "admin-access-required" ? (
        <p className="rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4 text-sm text-[var(--warning)]">
          Tu perfil no tiene permisos de administrador para acceder a esa sección.
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">Plan actual</h2>
          <p className="mt-3 font-mono text-3xl">{activePlan?.name}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{activePlan?.description}</p>
          <Link href="/pricing" className="mt-5 inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_20px_rgba(0,215,255,0.2)]">
            Ver planes
          </Link>
        </section>
        <section className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">Partidos desbloqueados</h2>
          <div className="mt-4 space-y-3">
            {unlockedMatches.map((match) => (
              <Link key={match.id} href={`/matches/${match.slug}`} className="block rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="font-medium">
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{match.stage}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <section className="panel rounded-lg p-5">
        <h2 className="text-lg font-semibold">Preferencias</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          El perfil autenticado ya está preparado. Idioma, selección favorita y alertas quedan para próximas iteraciones.
        </p>
      </section>
    </div>
  );
}
