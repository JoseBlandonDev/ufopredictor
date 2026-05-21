import Link from "next/link";
import { AdminWorkerStatus } from "@/components/admin-worker-status";
import { matches, performanceMetrics, predictions, workerRuns } from "@/lib/mock-data";

export default function BetaLabPage() {
  const betaStatusLabels = {
    ready: "listo",
    review: "en revisión",
    "needs-data": "requiere datos",
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Admin / Laboratorio beta</p>
        <h1 className="mt-3 text-4xl font-semibold">Laboratorio de operación predictiva</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Los botones están deshabilitados hasta que existan Supabase, workers, proveedores y el motor predictivo real.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {performanceMetrics.slice(0, 3).map((metric) => (
          <div key={metric.label} className="panel rounded-lg p-5">
            <p className="text-sm text-[var(--muted)]">{metric.label}</p>
            <p className="mt-2 font-mono text-3xl text-[var(--accent)]">{metric.value}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{metric.detail}</p>
          </div>
        ))}
      </div>

      <section className="panel rounded-lg p-5">
        <h2 className="text-lg font-semibold">Partidos beta</h2>
        <div className="mt-4 space-y-3">
          {matches.map((match) => {
            const prediction = predictions.find((item) => item.matchId === match.id);
            return (
              <div key={match.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[1fr_130px_160px]">
                <div>
                  <Link href={`/matches/${match.slug}`} className="font-medium">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--muted)]">{match.stage} - {betaStatusLabels[match.betaStatus]}</p>
                </div>
                <p className="font-mono text-sm text-[var(--muted)]">{prediction?.modelVersion}</p>
                <div className="flex flex-wrap gap-2">
                  <button disabled className="rounded-md border border-white/10 px-3 py-2 text-xs text-[var(--muted)]">Recalcular</button>
                  <button disabled className="rounded-md border border-white/10 px-3 py-2 text-xs text-[var(--muted)]">Narrativa</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <AdminWorkerStatus runs={workerRuns} />
    </div>
  );
}
