import { requireAdmin } from "@/lib/auth/session";
import { getDefaultTorneoExportRange } from "@/lib/supabase/torneo-export-queries";

export const dynamic = "force-dynamic";

type TorneoExportPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
};

const INPUT_CLASS =
  "w-full rounded-md border border-white/10 bg-[#07131f] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent)]";
const BUTTON_CLASS =
  "inline-flex cursor-pointer items-center justify-center rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20";

export default async function TorneoExportPage({ searchParams }: TorneoExportPageProps) {
  await requireAdmin("/admin/torneo-export");

  const defaults = getDefaultTorneoExportRange();
  const resolved = await searchParams;
  const explicitFrom = resolved.from?.trim() || "";
  const explicitTo = resolved.to?.trim() || "";
  const hasExplicitRange = explicitFrom.length > 0 || explicitTo.length > 0;
  const from = explicitFrom || defaults.from;
  const to = explicitTo || defaults.to;
  const downloadHref = hasExplicitRange
    ? `/admin/torneo-export/download?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    : "/admin/torneo-export/download";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin / Torneo Export
        </p>
        <h1 className="text-4xl font-semibold">Torneo Mundialista Export</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Este flujo descarga un JSON publico-seguro de UFO Predictor para Torneo Mundialista. No
          toca resultados, no escribe datos y no depende de Real Fixture Lab. Torneo decide como
          revelar o comparar esta informacion.
        </p>
      </section>

      <section className="panel rounded-lg p-5">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Rango del export</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Rango por defecto: siguientes 7 dias. El export incluye solo predicciones publicas,
              launch-safe y sin payloads internos.
            </p>
          </div>

          <form className="grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_auto] md:items-end">
            <label className="space-y-2">
              <span className="text-sm font-medium text-white">From</span>
              <input className={INPUT_CLASS} type="date" name="from" defaultValue={from} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-white">To</span>
              <input className={INPUT_CLASS} type="date" name="to" defaultValue={to} />
            </label>
            <button className={BUTTON_CLASS} type="submit" formAction="/admin/torneo-export">
              Actualizar rango
            </button>
          </form>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-[var(--muted)]">
              Descarga directa del JSON admin-only para el rango actual.
            </p>
            <a className={`${BUTTON_CLASS} mt-3`} href={downloadHref}>
              Descargar JSON
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
