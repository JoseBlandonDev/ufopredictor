import type { PredictionTimelinePoint } from "@/types/prediction";

export function PredictionTimeline({ points }: { points: PredictionTimelinePoint[] }) {
  return (
    <section className="panel rounded-lg p-5">
      <h2 className="text-lg font-semibold">Línea de tiempo de predicción</h2>
      <div className="mt-5 space-y-4">
        {points.map((point) => (
          <div key={point.label} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[120px_1fr]">
            <div>
              <p className="font-mono text-sm text-[var(--accent)]">{point.label}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{new Date(point.timestamp).toLocaleString("en")}</p>
            </div>
            <div>
              <p className="text-sm">{point.note}</p>
              <p className="mt-2 font-mono text-xs text-[var(--muted)]">
                Local {point.homeWin}% / Empate {point.draw}% / Visitante {point.awayWin}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
