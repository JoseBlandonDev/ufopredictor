import { notFound } from "next/navigation";
import { GoldenHourDelta } from "@/components/golden-hour-delta";
import { ModelVsMarket } from "@/components/model-vs-market";
import { PredictionSummaryCard } from "@/components/prediction-summary-card";
import { PredictionTimeline } from "@/components/prediction-timeline";
import { PremiumLockCard } from "@/components/premium-lock-card";
import { getMatchBySlug, getPredictionForMatch, mockUser } from "@/lib/mock-data";
import { canAccessMatch } from "@/lib/permissions/can-access-match";

export default async function MatchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const match = getMatchBySlug(slug);

  if (!match) {
    notFound();
  }

  const prediction = getPredictionForMatch(match.id);

  if (!prediction) {
    notFound();
  }

  const hasPremiumAccess = canAccessMatch({ user: mockUser, match, requiredAccess: "premium" });

  return (
    <div className="space-y-6">
      <PredictionSummaryCard match={match} prediction={prediction} />

      <section className="grid gap-4 md:grid-cols-3">
        {prediction.topScores.map((score) => (
          <div key={score.score} className="panel rounded-lg p-5">
            <p className="text-sm text-[var(--muted)]">Marcador destacado</p>
            <p className="mt-2 font-mono text-3xl">{score.score}</p>
            <p className="mt-1 text-sm text-[var(--accent)]">{score.probability}% de probabilidad</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">Más/Menos 2.5</h2>
          <p className="mt-4 font-mono text-3xl">Más de {prediction.overUnder25.over}%</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Menos de {prediction.overUnder25.under}%</p>
        </div>
        <div className="panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">BTTS</h2>
          <p className="mt-4 font-mono text-3xl">Sí {prediction.btts.yes}%</p>
          <p className="mt-1 text-sm text-[var(--muted)]">No {prediction.btts.no}%</p>
        </div>
      </section>

      {hasPremiumAccess ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <GoldenHourDelta delta={prediction.goldenHourDelta} />
            <ModelVsMarket markets={prediction.modelVsMarket} />
          </div>
          <PredictionTimeline points={prediction.timeline} />
          <section className="panel rounded-lg p-5">
            <h2 className="text-lg font-semibold">Análisis premium</h2>
            <p className="mt-3 text-[var(--muted)]">{prediction.premiumAnalysis}</p>
            <h3 className="mt-5 font-semibold">Por qué cambió</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{prediction.whyItChanged}</p>
          </section>
        </>
      ) : (
        <PremiumLockCard
          title="Inteligencia premium del partido bloqueada"
          description="Golden Hour Delta, Modelo vs Mercado, línea de tiempo completa y análisis premium están simulados detrás de la futura capa backend de permisos."
        />
      )}
    </div>
  );
}
