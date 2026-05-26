import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import type { PublicPredictionCardView } from "@/lib/supabase/public-prediction-queries";

export function PublicPredictionCard({ prediction }: { prediction: PublicPredictionCardView }) {
  const date = new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(prediction.kickoffAt));
  const venueLabel =
    prediction.venueCity ?? prediction.venueName ?? "Sede por confirmar";

  return (
    <article className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            {prediction.competitionName} {prediction.stage ? `· ${prediction.stage}` : ""}
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {prediction.homeTeamName} <span className="text-[var(--muted)]">vs</span>{" "}
            {prediction.awayTeamName}
          </h2>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {date} COT
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {venueLabel}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <ConfidenceBadge score={prediction.confidenceScore} />
          <RiskBadge level={prediction.riskLevel} />
        </div>
      </div>
      <div className="mt-5">
        <ProbabilityBar
          probabilities={{
            homeWin: prediction.homeWinProb,
            draw: prediction.drawProb,
            awayWin: prediction.awayWinProb,
          }}
        />
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        Vista pública básica. Los análisis ampliados permanecen fuera de esta vista.
      </p>
      <Link
        href={`/matches/${prediction.matchSlug}`}
        className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--accent)]"
      >
        Ver detalle público
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
