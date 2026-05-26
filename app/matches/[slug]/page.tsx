import { Clock, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import { getPublicMatchDetailData } from "@/lib/supabase/public-match-detail-queries";
import type { MatchRow } from "@/types/database";

export const dynamic = "force-dynamic";

const statusLabels: Record<MatchRow["status"], string> = {
  scheduled: "Programado",
  live: "En vivo",
  finished: "Finalizado",
  postponed: "Aplazado",
  cancelled: "Cancelado",
};

export default async function MatchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicMatchDetailData(slug);

  if (data.status === "not_found") {
    notFound();
  }

  if (data.status === "unavailable") {
    return (
      <section className="panel rounded-lg border border-[var(--warning)]/25 p-6">
        <h1 className="text-xl font-semibold">Detalle temporalmente no disponible</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{data.message}</p>
      </section>
    );
  }

  const { match } = data;
  const kickoff = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(match.kickoffAt));
  const venue = [match.venueName, match.venueCity].filter(Boolean).join(", ") || "Sede por confirmar";

  return (
    <div className="space-y-6">
      <section className="panel rounded-lg p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          {match.competitionName} {match.stage ? `· ${match.stage}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold">
            {match.homeTeamName} <span className="text-[var(--muted)]">vs</span>{" "}
            {match.awayTeamName}
          </h1>
          <span className="rounded-md border border-white/10 px-3 py-1 font-mono text-xs uppercase text-[var(--muted)]">
            {statusLabels[match.status]}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {kickoff} COT
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {venue}
          </span>
        </div>
      </section>

      {match.prediction ? (
        <section className="panel rounded-lg p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Predicción pública básica
              </p>
              <h2 className="mt-2 text-xl font-semibold">Probabilidades 1X2 publicadas</h2>
            </div>
            <div className="flex gap-2">
              <ConfidenceBadge score={match.prediction.confidenceScore} />
              <RiskBadge level={match.prediction.riskLevel} />
            </div>
          </div>
          <div className="mt-6 max-w-2xl">
            <ProbabilityBar
              probabilities={{
                homeWin: match.prediction.homeWinProb,
                draw: match.prediction.drawProb,
                awayWin: match.prediction.awayWinProb,
              }}
            />
          </div>
          <p className="mt-5 text-xs text-[var(--muted)]">
            Publicada el{" "}
            {new Intl.DateTimeFormat("es-CO", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "America/Bogota",
            }).format(new Date(match.prediction.createdAt))}{" "}
            COT.
          </p>
        </section>
      ) : (
        <section className="panel rounded-lg p-6">
          <h2 className="text-lg font-semibold">Predicción aún no publicada</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            El partido está disponible públicamente, pero todavía no existe una predicción básica publicada.
          </p>
        </section>
      )}

      <section className="panel rounded-lg p-5">
        <p className="text-sm text-[var(--muted)]">
          Esta vista expone únicamente información pública básica del partido y probabilidades
          calculadas por el modelo estadístico cuando están disponibles.
        </p>
      </section>
    </div>
  );
}
