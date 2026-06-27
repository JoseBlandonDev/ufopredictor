import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { buildPublicExpertReadView } from "../lib/presentation/public-expert-read";
import {
  formatMatchKickoffLabel,
  formatVenueLabel,
  getWorldCupProductName,
  resolveCompetitionDisplayName,
  resolveStageDisplayName,
  resolveTeamDisplayName,
} from "../lib/presentation/public-display";
import { ConfidenceBadge } from "./confidence-badge";
import { ProbabilityBar } from "./probability-bar";
import { RiskBadge } from "./risk-badge";
import type { PublicPredictionCardView } from "@/lib/supabase/public-prediction-queries";

type PublicPredictionCardProps = {
  prediction: PublicPredictionCardView;
  detailMode?: "full" | "preview";
  premiumAccessActive?: boolean;
  showLiveState?: boolean;
  showPreMatchDisclaimer?: boolean;
};

export function PublicPredictionCard({
  prediction,
  detailMode = "full",
  premiumAccessActive = false,
  showLiveState = false,
  showPreMatchDisclaimer = false,
}: PublicPredictionCardProps) {
  const date = formatMatchKickoffLabel(prediction.kickoffAt);
  const venueLabel = formatVenueLabel({
    venueName: prediction.venueName,
    venueCity: prediction.venueCity,
  });
  const isRegisteredViewer = prediction.viewer === "registered_free";
  const isPreviewMode = detailMode === "preview";
  const competitionLabel = resolveCompetitionDisplayName(prediction.competitionName);
  const stageLabel = resolveStageDisplayName(prediction.stage);
  const homeTeamName = resolveTeamDisplayName(prediction.homeTeamName);
  const awayTeamName = resolveTeamDisplayName(prediction.awayTeamName);
  const topProbability = [
    { label: homeTeamName, value: prediction.homeWinProb },
    { label: "Empate", value: prediction.drawProb },
    { label: awayTeamName, value: prediction.awayWinProb },
  ].sort((left, right) => right.value - left.value)[0];
  const expertRead = buildPublicExpertReadView({
    base: {
      homeTeamName,
      awayTeamName,
      homeWinProb: prediction.homeWinProb,
      drawProb: prediction.drawProb,
      awayWinProb: prediction.awayWinProb,
    },
    confidence:
      isRegisteredViewer
        ? {
            confidenceScore: prediction.confidenceScore,
            riskLevel: prediction.riskLevel,
          }
        : null,
  });
  const detailHref = `/matches/${prediction.matchSlug}`;
  const detailLabel = isRegisteredViewer
    ? premiumAccessActive
      ? "Ver análisis completo"
      : "Ver detalle público"
    : isPreviewMode
      ? "Crear cuenta para ver más"
      : "Ver vista previa";

  return (
    <article className="ufo-card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            {competitionLabel} {stageLabel ? `- ${stageLabel}` : ""}
          </p>
          <h2 className="mt-2 text-xl font-semibold break-words">
            {homeTeamName} <span className="text-[var(--muted)]">vs</span> {awayTeamName}
          </h2>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {date}
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
              Señal base
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Confianza y riesgo completos con cuenta gratis</p>
          </div>
        )}
      </div>
      {showLiveState && prediction.liveStateLabel ? (
        <div className="mt-4 inline-flex rounded-md border border-amber-300/30 bg-amber-400/10 px-3 py-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-200">
            {prediction.liveStateLabel}
          </p>
        </div>
      ) : null}
      {isPreviewMode ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
            Vista previa limitada
          </p>
          <p className="mt-2 text-sm text-white">
            Señal principal: <span className="font-semibold">{topProbability?.label}</span>
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Regístrate para ver las probabilidades 1X2 completas y el contexto de confianza y riesgo.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <p className="mb-3 text-sm font-medium text-white">Probabilidad del resultado</p>
          <ProbabilityBar
            probabilities={{
              homeWin: prediction.homeWinProb,
              draw: prediction.drawProb,
              awayWin: prediction.awayWinProb,
            }}
          />
        </div>
      )}
      <div className="mt-5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/6 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Lectura UFO
        </p>
        <p className="mt-2 text-sm text-white">{expertRead.summary}</p>
        {expertRead.confidenceNote ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{expertRead.confidenceNote}</p>
        ) : null}
      </div>
      {prediction.verifiedResult ? (
        <div className="mt-5 rounded-lg border border-emerald-400/25 bg-emerald-500/8 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300">
            Resultado final verificado
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {homeTeamName} {prediction.verifiedResult.homeGoals} - {prediction.verifiedResult.awayGoals}{" "}
            {awayTeamName}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Este resultado final ya fue verificado y la predicción pública se conserva como
            referencia histórica.
          </p>
        </div>
      ) : null}
      {showPreMatchDisclaimer ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-[var(--muted)]">
            Esta predicción fue publicada antes del inicio del partido y no se actualiza en vivo.
          </p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        {isRegisteredViewer ? (
          <span>{premiumAccessActive ? `Tu ${getWorldCupProductName()} está activo.` : "Incluye contexto completo de confianza y riesgo."}</span>
        ) : (
          <span>Las probabilidades reflejan una lectura del modelo, no una promesa de resultado.</span>
        )}
      </div>
      <Link href={detailHref} className="ufo-link-action ufo-focus-ring mt-4">
        {detailLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
