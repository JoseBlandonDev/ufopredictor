import Link from "next/link";
import { AdminWorkerStatus } from "@/components/admin-worker-status";
import { matches, predictions, workerRuns } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Administración</p>
        <h1 className="mt-3 text-4xl font-semibold">Operación interna simulada</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Superficie futura para workers, generación de predicciones, logs y revisión de calidad de datos.
        </p>
      </section>
      <div className="metric-grid">
        <div className="panel rounded-lg p-5">
          <p className="text-sm text-[var(--muted)]">Partidos beta</p>
          <p className="mt-2 font-mono text-3xl">{matches.length}</p>
        </div>
        <div className="panel rounded-lg p-5">
          <p className="text-sm text-[var(--muted)]">Predicciones generadas</p>
          <p className="mt-2 font-mono text-3xl">{predictions.length}</p>
        </div>
        <div className="panel rounded-lg p-5">
          <p className="text-sm text-[var(--muted)]">Errores simulados</p>
          <p className="mt-2 font-mono text-3xl">{workerRuns.filter((run) => run.status === "failed").length}</p>
        </div>
      </div>
      <AdminWorkerStatus runs={workerRuns} />
      <Link href="/admin/beta-lab" className="inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_20px_rgba(0,215,255,0.2)]">
        Abrir laboratorio beta
      </Link>
    </div>
  );
}
