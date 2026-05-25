import { AdminWorkerStatus } from "@/components/admin-worker-status";
import { requireAdmin } from "@/lib/auth/session";
import { workerRuns } from "@/lib/mock-data";
import { getAdminLabDashboardData } from "@/lib/supabase/lab-queries";

export const dynamic = "force-dynamic";

function formatMetric(value: boolean | null) {
  if (value === null) {
    return "sin evaluar";
  }

  return value ? "acierto" : "fallo";
}

export default async function BetaLabPage() {
  await requireAdmin("/admin/beta-lab");

  const labData = await getAdminLabDashboardData();
  const betaStatusLabels = {
    candidate: "candidato",
    ready: "listo",
    review: "en revision",
    needs_data: "requiere datos",
    archived: "archivado",
  };
  const intakeSourceLabels = {
    mock: "Mock",
    manual: "Manual",
    csv_import: "CSV",
  };
  const dataQualityLabels = {
    unreviewed: "Sin revisar",
    reviewed: "Revisado",
    verified: "Verificado",
    rejected: "Rechazado",
  };
  const resultStatusLabels = {
    pending_review: "Pendiente de revision",
    verified: "Verificado",
    rejected: "Rechazado",
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Admin / Laboratorio beta</p>
        <h1 className="mt-3 text-4xl font-semibold">Laboratorio interno</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Fixtures de calibracion pre-Mundial visibles solo para administracion. Estas competiciones no forman parte del producto publico de ligas.
        </p>
      </section>

      {labData.status === "unavailable" ? (
        <section className="panel rounded-lg border border-[var(--warning)]/35 p-5">
          <h2 className="text-lg font-semibold">Datos del laboratorio no disponibles</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{labData.message}</p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="panel rounded-lg p-5">
              <p className="text-sm text-[var(--muted)]">Fixtures Lab</p>
              <p className="mt-2 font-mono text-3xl text-[var(--accent)]">{labData.fixtures.length}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">Partidos `lab_only` leidos desde Supabase.</p>
            </div>
            <div className="panel rounded-lg p-5">
              <p className="text-sm text-[var(--muted)]">Predicciones Lab</p>
              <p className="mt-2 font-mono text-3xl text-[var(--accent)]">{labData.predictionCount}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">Versiones `internal_lab` almacenadas.</p>
            </div>
            <div className="panel rounded-lg p-5">
              <p className="text-sm text-[var(--muted)]">Evaluaciones persistidas</p>
              <p className="mt-2 font-mono text-3xl text-[var(--accent)]">{labData.persistedEvaluationCount}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">Filas disponibles en `prediction_results`.</p>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="panel rounded-lg p-5">
              <p className="text-sm text-[var(--muted)]">Datos pendientes de revision</p>
              <p className="mt-2 font-mono text-3xl text-[var(--warning)]">
                {labData.fixtures.filter((match) => match.dataQuality !== "verified").length}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">Fixtures internos que aun no estan verificados.</p>
            </div>
            <div className="panel rounded-lg p-5">
              <p className="text-sm text-[var(--muted)]">Resultados registrados</p>
              <p className="mt-2 font-mono text-3xl text-[var(--accent)]">{labData.registeredResultCount}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">Resultados reales registrados para revision admin.</p>
            </div>
          </section>

          <section className="panel rounded-lg p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Fixtures internos de prueba</h2>
              <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
                internal_lab
              </span>
            </div>
            {labData.fixtures.length === 0 ? (
              <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
                No hay fixtures internos disponibles para esta cuenta administradora.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {labData.fixtures.map((match) => (
                  <div
                    key={match.id}
                    className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[minmax(250px,1fr)_280px_170px]"
                  >
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-md border border-[var(--line)] px-2 py-1 font-mono text-xs text-[var(--accent)]">
                          Competicion lab
                        </span>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--muted)]">
                          {match.competitionName}
                        </span>
                        <span className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-2 py-1 text-xs text-[var(--accent)]">
                          {intakeSourceLabels[match.intakeSource]}
                        </span>
                      </div>
                      <p className="mt-3 font-medium">{match.homeTeamName} vs {match.awayTeamName}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{match.stage ?? "Etapa sin registrar"}</p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {match.sourceNote ?? "Sin nota de fuente registrada."}
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <p className="rounded-md border border-[var(--warning)]/25 bg-[var(--warning)]/10 px-2 py-1 text-[var(--warning)]">
                        {match.labStatus ? betaStatusLabels[match.labStatus] : "sin estado Lab"}
                      </p>
                      <p className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-2 py-1 text-[var(--accent)]">
                        Calidad: {dataQualityLabels[match.dataQuality]}
                      </p>
                      <p className="font-mono text-[var(--muted)]">
                        {match.result
                          ? `Resultado: ${match.result.home_goals}-${match.result.away_goals} / ${resultStatusLabels[match.result.verification_status]}`
                          : "Resultado: pendiente"}
                      </p>
                      <p className="font-mono text-[var(--muted)]">
                        {match.prediction
                          ? `${match.prediction.modelVersion} / ${match.prediction.runScope}`
                          : "sin prediccion"}
                      </p>
                      <p className="text-[var(--muted)]">
                        {match.prediction
                          ? `Prediccion almacenada: ${match.prediction.mostLikelyScore} - ${match.prediction.confidenceScore}% confianza`
                          : "No existe prediccion almacenada para este fixture."}
                      </p>
                      {match.prediction?.evaluation ? (
                        <div className="rounded-md border border-white/10 px-2 py-2 text-[var(--muted)]">
                          <p className="font-medium text-white">Evaluacion persistida</p>
                          <p className="mt-1">
                            Exacto: {formatMetric(match.prediction.evaluation.exact_score_correct)} / Error goles:{" "}
                            {match.prediction.evaluation.goal_error ?? "n/d"}
                          </p>
                          <p className="mt-1">
                            1X2: {formatMetric(match.prediction.evaluation.winner_correct)} / BTTS:{" "}
                            {formatMetric(match.prediction.evaluation.btts_correct)} / OU 2.5:{" "}
                            {formatMetric(match.prediction.evaluation.over_2_5_correct)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button disabled className="rounded-md border border-white/10 px-3 py-2 text-xs text-[var(--muted)]">Recalcular</button>
                      <button disabled className="rounded-md border border-white/10 px-3 py-2 text-xs text-[var(--muted)]">Narrativa</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <div className="space-y-3">
        <p className="text-xs text-[var(--muted)]">
          Estado de workers: datos mock. La ejecucion y sincronizacion real permanecen fuera del alcance de esta epica.
        </p>
        <AdminWorkerStatus runs={workerRuns} />
      </div>
    </div>
  );
}
