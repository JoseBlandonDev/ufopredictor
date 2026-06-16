import { requireAdmin } from "@/lib/auth/session";
import {
  publishRealFixturePredictionAction,
  saveRealFixturePredictionAction,
} from "../real-fixture-lab/actions";
import { SubmitButton } from "../real-fixture-lab/submit-button";
import { getRealFixturePublishQueueData } from "@/lib/supabase/real-fixture-publish-queue-queries";

export const dynamic = "force-dynamic";

const ACTION_BUTTON_CLASS =
  "cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const ACCENT_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} border-[var(--accent)]/35 bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/20`;
const EMERALD_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} border-emerald-400/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15`;

type RealFixturePublishQueuePageProps = {
  searchParams: Promise<{
    externalId?: string;
    save?: string;
    publish?: string;
  }>;
};

function formatKickoff(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function getStatusMessage(args: {
  save?: string;
  publish?: string;
  externalId?: string;
}) {
  if (args.save === "saved") {
    return {
      tone: "success" as const,
      title: "Prediccion interna guardada",
      body: `Se guardo una prediccion interna para ${args.externalId ?? "el fixture seleccionado"}.`,
    };
  }

  if (args.save === "duplicate") {
    return {
      tone: "info" as const,
      title: "Prediccion interna ya existente",
      body: "La cola detecto que ya existe una prediccion interna compatible para ese fixture.",
    };
  }

  if (args.publish === "published") {
    return {
      tone: "success" as const,
      title: "Prediccion publica publicada",
      body: `El fixture ${args.externalId ?? "seleccionado"} ya tiene una fila public_product activa.`,
    };
  }

  if (args.publish === "already_published") {
    return {
      tone: "info" as const,
      title: "Prediccion publica ya existente",
      body: "La cola detecto que ese fixture ya tenia una fila public_product publicada.",
    };
  }

  if (args.save || args.publish) {
    return {
      tone: "warning" as const,
      title: "Operacion no completada",
      body: "La accion no termino como se esperaba. Revisa el estado actual del fixture antes de reintentar.",
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

export default async function RealFixturePublishQueuePage({
  searchParams,
}: RealFixturePublishQueuePageProps) {
  await requireAdmin("/admin/real-fixture-publish-queue");

  const { externalId, save, publish } = await searchParams;
  const statusMessage = getStatusMessage({ externalId, save, publish });
  const queueData = await getRealFixturePublishQueueData();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin / Real Fixture Publish Queue
        </p>
        <h1 className="text-4xl font-semibold">Publicacion operativa exacta</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Cola minima para guardar y publicar fixtures reales ya ingeridos sin pasar por la vista pesada
          de Real Fixture Lab. Esta pagina no genera previews, no toca resultados y solo reutiliza las
          acciones admin existentes de guardado interno y publicacion publica basica.
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
            <h2 className="text-lg font-semibold">Pending exact fixtures</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cola limitada a los 7 fixtures exactos de Data Ops 02 pendientes de save/publish.
            </p>
          </div>
          <span className="rounded-md border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
            admin-only queue
          </span>
        </div>

        {!queueData.activeModelVersionId ? (
          <div className="mt-4 rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4 text-sm text-[var(--muted)]">
            No active model version is configured. `Save prediction` remains blocked until one is activated.
          </div>
        ) : null}

        {queueData.rows.length === 0 ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
            No exact fixtures are pending in the publish queue.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  <th className="px-3 py-3 font-medium">Fixture</th>
                  <th className="px-3 py-3 font-medium">Kickoff</th>
                  <th className="px-3 py-3 font-medium">Match</th>
                  <th className="px-3 py-3 font-medium">Internal</th>
                  <th className="px-3 py-3 font-medium">Public</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {queueData.rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/10 align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-white">
                        {row.homeTeamName} vs {row.awayTeamName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--muted)]">{row.externalId}</p>
                      <p className="mt-1 font-mono text-xs text-[var(--muted)]">slug: {row.slug}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        api_football_fixture_id: {row.apiFootballFixtureId ?? "n/a"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">{formatKickoff(row.kickoffAt)}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      <div className="space-y-1">
                        <p>{row.status}</p>
                        <p>access_scope: {row.accessScope}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {row.savedPredictionId ? (
                        <div className="space-y-1">
                          <p className="text-emerald-300">saved internal</p>
                          <p className="font-mono text-xs">{row.savedPredictionId}</p>
                        </div>
                      ) : (
                        "no saved prediction"
                      )}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {row.latestPublicPredictionId ? (
                        <div className="space-y-1">
                          <p className="text-emerald-300">future ready</p>
                          <p className="font-mono text-xs">{row.latestPublicPredictionId}</p>
                        </div>
                      ) : (
                        "no public product"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {row.latestPublicPredictionId ? (
                        <span className="inline-flex rounded-md border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                          future ready
                        </span>
                      ) : row.savedPredictionId ? (
                        <form action={publishRealFixturePredictionAction} className="space-y-2">
                          <input type="hidden" name="matchId" value={row.id} />
                          <input type="hidden" name="matchSlug" value={row.slug} />
                          <input type="hidden" name="internalPredictionVersionId" value={row.savedPredictionId} />
                          <input type="hidden" name="externalId" value={row.externalId} />
                          <input type="hidden" name="returnTo" value="/admin/real-fixture-publish-queue" />
                          <SubmitButton
                            idleLabel="Publish basic"
                            pendingLabel="Publishing..."
                            className={EMERALD_BUTTON_CLASS}
                          />
                        </form>
                      ) : (
                        <form action={saveRealFixturePredictionAction} className="space-y-2">
                          <input type="hidden" name="externalId" value={row.externalId} />
                          <input type="hidden" name="returnTo" value="/admin/real-fixture-publish-queue" />
                          <SubmitButton
                            idleLabel="Save prediction"
                            pendingLabel="Saving..."
                            className={ACCENT_BUTTON_CLASS}
                            disabled={!queueData.activeModelVersionId}
                          />
                        </form>
                      )}
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
