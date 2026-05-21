import { MatchCard } from "@/components/match-card";
import { matches, predictions } from "@/lib/mock-data";

export default function PredictionsPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Predicciones</p>
        <h1 className="mt-3 text-4xl font-semibold">Cartelera simulada del Mundial 2026</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Las tarjetas muestran probabilidades 1X2, confianza, riesgo y bloqueos premium usando únicamente datos simulados locales.
        </p>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        {matches.map((match) => {
          const prediction = predictions.find((item) => item.matchId === match.id)!;
          return <MatchCard key={match.id} match={match} prediction={prediction} />;
        })}
      </div>
    </div>
  );
}
