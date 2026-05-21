import type { OneXTwoProbabilities } from "@/types/prediction";

export function ProbabilityBar({ probabilities }: { probabilities: OneXTwoProbabilities }) {
  return (
    <div className="space-y-3">
      {[
        ["Local", probabilities.homeWin, "bg-[var(--accent)]"],
        ["Empate", probabilities.draw, "bg-[var(--warning)]"],
        ["Visitante", probabilities.awayWin, "bg-[var(--accent-2)]"],
      ].map(([label, value, color]) => (
        <div key={label as string}>
          <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
            <span>{label}</span>
            <span className="font-mono text-white">{value}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
