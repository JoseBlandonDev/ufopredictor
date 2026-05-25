import { AdminWorkerStatus } from "@/components/admin-worker-status";
import { requireAdmin } from "@/lib/auth/session";
import { labMatches, labPredictions, performanceMetrics, workerRuns } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function BetaLabPage() {
  await requireAdmin("/admin/beta-lab");

  const betaStatusLabels = {
    ready: "listo",
    review: "en revisión",
    needs_data: "requiere datos",
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Admin / Laboratorio beta</p>
        <h1 className="mt-3 text-4xl font-semibold">Laboratorio interno</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Fixtures de calibración pre-Mundial visibles solo para administración. Estas competiciones no forman parte del producto público de ligas.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Fixtures internos de prueba</h2>
          <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
            internal_lab
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {labMatches.map((match) => {
            const prediction = labPredictions.find((item) => item.matchId === match.id);
            return (
              <div key={match.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[1fr_190px_170px]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-[var(--line)] px-2 py-1 font-mono text-xs text-[var(--accent)]">
                      Competición lab
                    </span>
                    <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--muted)]">
                      {match.competition.name}
                    </span>
                  </div>
                  <p className="mt-3 font-medium">{match.homeTeam} vs {match.awayTeam}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{match.stage}</p>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="rounded-md border border-[var(--warning)]/25 bg-[var(--warning)]/10 px-2 py-1 text-[var(--warning)]">
                    {betaStatusLabels[match.labStatus]}
                  </p>
                  <p className="font-mono text-[var(--muted)]">
                    {prediction?.modelVersion ?? "sin predicción"} / {prediction?.runScope ?? "internal_lab"}
                  </p>
                  <p className="text-[var(--muted)]">
                    {prediction?.status === "generated"
                      ? `Predicción mock generada - ${prediction.confidenceScore}% confianza`
                      : "Pendiente de datos mock"}
                  </p>
                </div>
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
