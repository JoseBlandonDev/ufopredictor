import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import type { PublicPredictionCardView } from "@/lib/supabase/public-prediction-queries";

type PublicPredictionCardProps = {
  prediction: PublicPredictionCardView;
};

export function PublicPredictionCard({ prediction }: PublicPredictionCardProps) {
  const date = new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(prediction.kickoffAt));
  const venueLabel = prediction.venueCity ?? prediction.venueName ?? "Sede por confirmar";

  return (
    <article className="ufo-card rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            {prediction.competitionName} {prediction.stage ? `- ${prediction.stage}` : ""}
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
        {prediction.viewer === "registered_free" ? (
          <div className="flex gap-2">
            <ConfidenceBadge score={prediction.confidenceScore} />
            <RiskBadge level={prediction.riskLevel} />
          </div>
        ) : (
          <div className="ufo-pill rounded-md border-[var(--accent)]/35 bg-[var(--accent)]/10 px-3 py-2 text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
              Señal básica
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Confianza y riesgo completos con cuenta gratis</p>
          </div>
        )}
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
        {prediction.viewer === "registered_free"
          ? "Vista registrada gratis: confianza y riesgo completos en el panel público."
          : "Vista pública básica: 1X2 completo y señal inicial de confianza y riesgo."}
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {prediction.viewer === "registered_free"
          ? "Alta incertidumbre: probabilidades cercanas. Ventaja ligera, no certeza."
          : "Las probabilidades reflejan una lectura del modelo, no una promesa de resultado."}
      </p>
      <Link href={`/matches/${prediction.matchSlug}`} className="ufo-link-action ufo-focus-ring mt-4">
        Ver detalle público
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
