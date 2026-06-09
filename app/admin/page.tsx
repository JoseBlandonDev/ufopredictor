import Link from "next/link";
import { AdminWorkerStatus } from "@/components/admin-worker-status";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireAdmin } from "@/lib/auth/session";
import { matches, predictions, workerRuns } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Administración</p>
          <h1 className="mt-3 text-4xl font-semibold">Operación interna</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Acceso restringido a perfiles administradores. El flujo activo D06/D07 vive en Real Fixture Lab;
            Beta Lab legado conserva datos y workers mock internos.
          </p>
        </div>
        <LogoutButton />
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
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/real-fixture-lab"
          className="inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_20px_rgba(0,215,255,0.2)]"
        >
          Abrir Real Fixture Lab
        </Link>
        <Link
          href="/admin/beta-lab"
          className="inline-block rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-white/20 hover:text-white"
        >
          Abrir Beta Lab legado
        </Link>
      </div>
    </div>
  );
}
