import type { GoldenHourDelta as GoldenHourDeltaType } from "@/types/prediction";

export function GoldenHourDelta({ delta }: { delta: GoldenHourDeltaType }) {
  return (
    <section className="panel rounded-lg p-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Señal premium</p>
      <h2 className="mt-2 text-lg font-semibold">Golden Hour Delta</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Cambio tras alineaciones oficiales.</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          ["Local", delta.homeDelta],
          ["Empate", delta.drawDelta],
          ["Visitante", delta.awayDelta],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-1 font-mono text-xl">{Number(value) > 0 ? `+${value}` : value}%</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">{delta.reason}</p>
    </section>
  );
}
