import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { matches, performanceMetrics, predictions } from "@/lib/mock-data";

export default function HomePage() {
  const featured = matches.slice(0, 2).map((match) => ({
    match,
    prediction: predictions.find((prediction) => prediction.matchId === match.id)!,
  }));

  return (
    <div className="space-y-12">
      <section className="grid min-h-[72vh] items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Laboratorio de señales del Mundial 2026</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            UFO Predictor
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
            Predicciones probabilísticas de fútbol con salidas explicables del modelo, datos simulados y una estructura lista para accesos premium.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/predictions" className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_0_24px_rgba(0,215,255,0.24)] transition hover:bg-white">
              Ver predicciones <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/transparency" className="rounded-md border border-[var(--accent)]/35 bg-[#0a1a2b]/55 px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/10">
              Centro de transparencia
            </Link>
          </div>
        </div>
        <div className="panel relative overflow-hidden rounded-lg p-5">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="relative mx-auto mb-5 aspect-square w-full max-w-[260px] sm:max-w-[320px]">
            <Image
              src="/brand/ufo-predictor-logo-main.png"
              alt="UFO Predictor"
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(0,215,255,0.28)]"
              sizes="(min-width: 1024px) 320px, 70vw"
              priority
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Telemetría simulada en vivo</p>
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="mt-5 space-y-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <p className="text-sm">{metric.label}</p>
                  <p className="text-xs text-[var(--muted)]">{metric.detail}</p>
                </div>
                <span className="font-mono text-xl text-[var(--accent)]">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Partidos destacados</p>
            <h2 className="mt-2 text-3xl font-semibold">Predicciones simuladas destacadas</h2>
          </div>
          <Link href="/predictions" className="hidden text-sm text-[var(--accent)] sm:block">Ver todas</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {featured.map(({ match, prediction }) => (
            <MatchCard key={match.id} match={match} prediction={prediction} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Núcleo estadístico", "El motor real queda para una fase posterior; este prototipo usa predicciones simuladas alineadas al contrato documentado."],
          ["Estructura premium", "Planes, bloqueos y desbloqueos de partidos están modelados para añadir filtrado backend sin rediseñar la interfaz."],
          ["Transparencia operativa", "El producto explica incertidumbre, registra rendimiento y evita garantías de resultado."],
        ].map(([title, description]) => (
          <div key={title} className="panel rounded-lg p-5">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
