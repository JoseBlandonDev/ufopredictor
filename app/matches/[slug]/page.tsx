import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { RiskBadge } from "@/components/risk-badge";
import { getPublicMatchDetailData } from "@/lib/supabase/public-match-detail-queries";
import { getSavedMatchStateBySlug } from "@/lib/supabase/saved-matches-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchRow } from "@/types/database";
import { removeSavedMatchAction, saveMatchAction } from "./actions";

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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewer = user ? "registered_free" : "anonymous";
  const isAuthenticated = viewer === "registered_free";
  const data = await getPublicMatchDetailData(slug, viewer);
  const savedState = await getSavedMatchStateBySlug(slug);

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
  const saveAction = saveMatchAction.bind(null, match.matchSlug);
  const removeAction = removeSavedMatchAction.bind(null, match.matchSlug);

  return (
    <div className="space-y-6">
      <section className="panel rounded-lg p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          {match.competitionName} {match.stage ? `- ${match.stage}` : ""}
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
            {match.prediction.viewer === "registered_free" ? (
              <div className="flex gap-2">
                <ConfidenceBadge score={match.prediction.confidenceScore} />
                <RiskBadge level={match.prediction.riskLevel} />
              </div>
            ) : (
              <div className="rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-3 py-2 text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                  Señal básica
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">Confianza/riesgo completo con cuenta gratis</p>
              </div>
            )}
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
            {isAuthenticated
              ? "Vista registrada gratis: contexto completo de confianza/riesgo y lectura pública del partido."
              : "Vista pública básica: 1X2 completo y señal teaser de confianza/riesgo."}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
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
            El partido está disponible públicamente, pero todavía no existe una predicción básica
            publicada.
          </p>
        </section>
      )}

      <section className="panel rounded-lg border border-white/15 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Proyección premium
        </p>
        {match.premiumProjection.status === "locked" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Acceso premium bloqueado</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Esta cuenta todavía no tiene derechos premium para este partido.
            </p>
          </>
        ) : match.premiumProjection.status === "unavailable" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Proyección premium no disponible</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              No fue posible preparar el contexto premium de este partido en este momento.
            </p>
          </>
        ) : match.premiumProjection.status === "authorized_unavailable" ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">Contenido premium temporalmente no disponible</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Tu acceso está activo, pero la proyección premium todavía no está lista para mostrarse.
            </p>
          </>
        ) : (
          <div className="mt-3 space-y-4">
            <h2 className="text-lg font-semibold">Mercados premium autorizados</h2>
            {match.premiumProjection.payload.markets.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No hay mercados premium publicados para este partido.</p>
            ) : (
              <div className="space-y-2">
                {match.premiumProjection.payload.markets.map((market) => (
                  <article
                    key={`${market.marketKey}:${market.selection}`}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="text-sm font-medium">{market.label}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {market.selection} - {market.probability}%
                    </p>
                  </article>
                ))}
              </div>
            )}
            {match.premiumProjection.payload.narrative ? (
              <article className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm font-medium">Narrativa premium</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {match.premiumProjection.payload.narrative.premiumAnalysis}
                </p>
              </article>
            ) : null}
          </div>
        )}
      </section>

      <section className="panel rounded-lg border border-[var(--accent)]/30 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Partidos guardados
        </p>
        {savedState.status === "ready" && savedState.isAuthenticated ? (
          <>
            <h2 className="mt-2 text-lg font-semibold">
              {savedState.isSaved ? "Partido guardado en tu watchlist" : "Guardar partido en tu watchlist"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {savedState.isSaved
                ? "Puedes quitar este partido en cualquier momento."
                : "Guarda este partido para seguirlo más tarde desde tu cuenta."}
            </p>
            <form action={savedState.isSaved ? removeAction : saveAction} className="mt-4">
              <button
                type="submit"
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]"
              >
                {savedState.isSaved ? "Quitar de guardados" : "Guardar partido"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-lg font-semibold">Guarda este partido con una cuenta gratis</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Crea una cuenta o inicia sesión para guardar este partido en tu watchlist.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/register?next=/matches/${match.matchSlug}`}
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href={`/login?next=/matches/${match.matchSlug}`}
                className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white"
              >
                Iniciar sesión
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="panel rounded-lg border border-[var(--accent)]/30 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          {isAuthenticated ? "Tu cuenta gratis está activa" : "Preview con cuenta gratis"}
        </p>
        <h2 className="mt-2 text-lg font-semibold">
          {isAuthenticated
            ? "Los previews seleccionados aparecerán antes del Mundial cuando este partido esté habilitado."
            : "Crea una cuenta gratis para acceder a previews seleccionados antes del Mundial."}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">El análisis premium llegará más adelante.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]"
            >
              Abrir panel
            </Link>
          ) : (
            <>
              <Link
                href={`/register?next=/matches/${match.matchSlug}`}
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href={`/login?next=/matches/${match.matchSlug}`}
                className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="panel rounded-lg p-5">
        <p className="text-sm text-[var(--muted)]">
          Esta página solo expone metadata pública básica del partido y probabilidades del modelo
          cuando están disponibles.
        </p>
      </section>
    </div>
  );
}
