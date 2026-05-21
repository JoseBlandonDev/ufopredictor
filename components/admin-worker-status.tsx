import { AlertTriangle, CheckCircle2, Loader2, Radio } from "lucide-react";
import type { WorkerRun } from "@/types/workers";

const iconByStatus = {
  success: CheckCircle2,
  failed: AlertTriangle,
  running: Loader2,
  queued: Radio,
};

const labelByStatus = {
  success: "correcto",
  failed: "falló",
  running: "en ejecución",
  queued: "en cola",
};

export function AdminWorkerStatus({ runs }: { runs: WorkerRun[] }) {
  return (
    <section className="panel rounded-lg p-5">
      <h2 className="text-lg font-semibold">Ejecuciones de workers</h2>
      <div className="mt-4 space-y-3">
        {runs.map((run) => {
          const Icon = iconByStatus[run.status];
          return (
            <div key={run.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_120px_120px]">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
                <div>
                  <p className="font-medium">{run.workerName}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Inicio {new Date(run.startedAt).toLocaleString("es-CO")}
                    {run.errorMessage ? ` - ${run.errorMessage}` : ""}
                  </p>
                </div>
              </div>
              <p className="font-mono text-sm text-[var(--muted)]">{labelByStatus[run.status]}</p>
              <p className="font-mono text-sm text-[var(--muted)]">{run.recordsProcessed} registros</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
