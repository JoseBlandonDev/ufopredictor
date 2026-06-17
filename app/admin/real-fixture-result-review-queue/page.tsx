import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getRealFixtureResultReviewQueueData } from "@/lib/supabase/real-fixture-result-review-queue-queries";
import { verifyRealFixtureResultAction } from "../real-fixture-lab/actions";
import { SubmitButton } from "../real-fixture-lab/submit-button";

export const dynamic = "force-dynamic";

const QUEUE_PATH = "/admin/real-fixture-result-review-queue";
const ACTION_BUTTON_CLASS =
  "cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const WARNING_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} border-[var(--warning)]/35 bg-[var(--warning)]/15 text-[var(--warning)] hover:bg-[var(--warning)]/20`;

type RealFixtureResultReviewQueuePageProps = {
  searchParams: Promise<{
    externalId?: string;
    result?: string;
  }>;
};

function formatKickoff(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function getStatusMessage(args: { externalId?: string; result?: string }) {
  if (args.result === "verified") {
    return {
      tone: "success" as const,
      title: "Resultado verificado",
      body: `El resultado pendiente de ${args.externalId ?? "este fixture"} quedo marcado como verified.`,
    };
  }

  if (args.result === "already_verified") {
    return {
      tone: "info" as const,
      title: "Resultado ya verificado",
      body: "La cola detecto que ese resultado ya estaba marcado como verified.",
    };
  }

  if (args.result) {
    return {
      tone: "warning" as const,
      title: "Verificacion no completada",
      body: "La accion no termino como se esperaba. Revisa el estado actual del resultado antes de reintentar.",
    };
  }

  return null;
}

function getStatusClassName(tone: "success" | "info" | "warning") {
  switch (tone) {
    case "success":
      return "rounded-lg border border-emerald-400/35 bg-emerald-500/10 p-4";
    case "info":
      return "rounded-lg border border-[var(--accent)]/35 bg-[var(--accent)]/10 p-4";
    case "warning":
      return "rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4";
  }
}

export default async function RealFixtureResultReviewQueuePage({
  searchParams,
}: RealFixtureResultReviewQueuePageProps) {
  await requireAdmin(QUEUE_PATH);

  const { externalId, result } = await searchParams;
  const statusMessage = getStatusMessage({ externalId, result });
  const queueData = await getRealFixtureResultReviewQueueData();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin / Result Review
        </p>
        <h1 className="text-4xl font-semibold">Result review queue</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Cola minima para verificar resultados reales pendientes sin abrir el detalle pesado de Real Fixture
          Lab. Solo muestra campos escalares y reutiliza la accion admin existente de verificacion.
        </p>
      </section>

      {statusMessage ? (
        <section className={getStatusClassName(statusMessage.tone)}>
          <h2 className="text-lg font-semibold">{statusMessage.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{statusMessage.body}</p>
        </section>
      ) : null}

      <section className="panel rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Pending result review</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              API-Football World Cup fixtures with pending_review match_results.
            </p>
          </div>
          <span className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
            admin-only queue
          </span>
        </div>

        {queueData.rows.length === 0 ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
            No pending result review rows are available.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  <th className="px-3 py-3 font-medium">Fixture</th>
                  <th className="px-3 py-3 font-medium">Kickoff</th>
                  <th className="px-3 py-3 font-medium">Score</th>
                  <th className="px-3 py-3 font-medium">Match</th>
                  <th className="px-3 py-3 font-medium">Public link</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {queueData.rows.map((row) => (
                  <tr key={row.matchResultId} className="border-b border-white/10 align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-white">
                        {row.homeTeamName} vs {row.awayTeamName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--muted)]">{row.externalId}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        api_football_fixture_id: {row.apiFootballFixtureId ?? "n/a"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">{formatKickoff(row.kickoffAt)}</td>
                    <td className="px-3 py-3">
                      <p className="font-mono text-base text-white">
                        {row.homeGoals}-{row.awayGoals}
                      </p>
                      <p className="mt-1 text-xs text-[var(--warning)]">{row.verificationStatus}</p>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      <div className="space-y-1">
                        <p>{row.matchStatus}</p>
                        <p>access_scope: {row.accessScope}</p>
                        <p>{row.competitionName}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {row.accessScope === "public" ? (
                        <Link
                          href={`/matches/${row.slug}`}
                          className="font-mono text-xs text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                          {row.slug}
                        </Link>
                      ) : (
                        <p className="font-mono text-xs text-[var(--muted)]">{row.slug}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <form action={verifyRealFixtureResultAction} className="space-y-2">
                        <input type="hidden" name="externalId" value={row.externalId} />
                        <input type="hidden" name="matchResultId" value={row.matchResultId} />
                        <input type="hidden" name="returnTo" value={QUEUE_PATH} />
                        <SubmitButton
                          idleLabel="Verify result"
                          pendingLabel="Verifying..."
                          className={WARNING_BUTTON_CLASS}
                        />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
