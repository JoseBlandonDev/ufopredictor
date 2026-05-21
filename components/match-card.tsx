import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import type { Match } from "@/types/football";
import type { Prediction } from "@/types/prediction";

export function MatchCard({ match, prediction }: { match: Match; prediction: Prediction }) {
  const date = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(match.kickoffAt));

  return (
    <Link href={`/matches/${match.slug}`} className="panel block rounded-lg p-5 transition hover:border-[var(--accent)]/45 hover:bg-white/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">{match.stage}</p>
          <h3 className="mt-2 text-xl font-semibold">
            {match.homeTeam.name} <span className="text-[var(--muted)]">vs</span> {match.awayTeam.name}
          </h3>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {date} COT
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {match.city}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <ConfidenceBadge score={prediction.confidenceScore} />
          <RiskBadge level={prediction.riskLevel} />
        </div>
      </div>
      <div className="mt-5">
        <ProbabilityBar probabilities={prediction.probabilities} />
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">{prediction.freeSummary}</p>
    </Link>
  );
}
