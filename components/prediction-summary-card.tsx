import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import type { Match } from "@/types/football";
import type { Prediction } from "@/types/prediction";

export function PredictionSummaryCard({ match, prediction }: { match: Match; prediction: Prediction }) {
  return (
    <section className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">{prediction.modelVersion}</p>
          <h1 className="mt-2 text-2xl font-semibold">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{prediction.freeSummary}</p>
        </div>
        <div className="flex gap-2">
          <ConfidenceBadge score={prediction.confidenceScore} />
          <RiskBadge level={prediction.riskLevel} />
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ProbabilityBar probabilities={prediction.probabilities} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-[var(--muted)]">Marcador probable</p>
            <p className="mt-2 font-mono text-3xl">{prediction.mostLikelyScore}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-[var(--muted)]">Goles esperados</p>
            <p className="mt-2 font-mono text-3xl">
              {prediction.expectedGoals.home} - {prediction.expectedGoals.away}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
