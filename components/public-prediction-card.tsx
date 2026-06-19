import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { ConfidenceBadge } from "./confidence-badge";
import { ProbabilityBar } from "./probability-bar";
import { RiskBadge } from "./risk-badge";
import type { PublicPredictionCardView } from "@/lib/supabase/public-prediction-queries";

type PublicPredictionCardProps = {
  prediction: PublicPredictionCardView;
  premiumAccessActive?: boolean;
};

export function PublicPredictionCard({ prediction, premiumAccessActive = false }: PublicPredictionCardProps) {
  const date = new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(prediction.kickoffAt));
  const venueLabel = prediction.venueCity ?? prediction.venueName ?? "Sede por confirmar";
  const isRegisteredViewer = prediction.viewer === "registered_free";

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
        {isRegisteredViewer ? (
          <div className="flex gap-2">
            <ConfidenceBadge score={prediction.confidenceScore} />
            <RiskBadge level={prediction.riskLevel} />
          </div>
        ) : (
          <div className="ufo-pill rounded-md border-[var(--accent)]/35 bg-[var(--accent)]/10 px-3 py-2 text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
              Senal basica
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
      {prediction.verifiedResult ? (
        <div className="mt-5 rounded-lg border border-emerald-400/25 bg-emerald-500/8 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300">
            Resultado final verificado
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {prediction.homeTeamName} {prediction.verifiedResult.homeGoals} -{" "}
            {prediction.verifiedResult.awayGoals} {prediction.awayTeamName}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Este resultado final ya fue verificado y la prediccion publica se conserva como
            referencia historica.
          </p>
        </div>
      ) : null}
      <p className="mt-4 text-xs text-[var(--muted)]">
        {isRegisteredViewer
          ? premiumAccessActive
            ? "Vista premium: confianza, riesgo y detalle avanzado disponibles segun la publicacion del partido."
            : "Vista registrada gratis: confianza y riesgo completos en el panel publico."
          : "Vista publica basica: 1X2 completo y senal inicial de confianza y riesgo."}
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {isRegisteredViewer
          ? "Alta incertidumbre: probabilidades cercanas. Ventaja ligera, no certeza."
          : "Las probabilidades reflejan una lectura del modelo, no una promesa de resultado."}
      </p>
      <Link href={`/matches/${prediction.matchSlug}`} className="ufo-link-action ufo-focus-ring mt-4">
        {premiumAccessActive ? "Ver detalle premium" : "Ver detalle publico"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
