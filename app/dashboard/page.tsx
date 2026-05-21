import Link from "next/link";
import { mockUser, plans, matches } from "@/lib/mock-data";

export default function DashboardPage() {
  const activePlan = plans.find((plan) => plan.slug === mockUser.planSlug);
  const unlockedMatchIds = new Set(mockUser.matchUnlocks.map((unlock) => unlock.matchId));
  const unlockedMatches = matches.filter((match) => unlockedMatchIds.has(match.id));

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Panel</p>
        <h1 className="mt-3 text-4xl font-semibold">Consola del observador</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Área de usuario simulada para estado del plan, partidos desbloqueados y futuras preferencias.
        </p>
      </section>
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
          Idioma, selección favorita, preferencias de alertas y perfil con autenticación quedan como TODO para la fase de Supabase.
        </p>
      </section>
    </div>
  );
}
