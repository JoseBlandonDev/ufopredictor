import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";

type ReadyEntitlementSummary = Extract<
  Awaited<ReturnType<typeof getViewerEntitlementSummary>>,
  { status: "ready" }
>;

function hasCurrentPaidAccess(summary: ReadyEntitlementSummary) {
  return (
    summary.activeSubscriptions.length > 0 ||
    summary.entitlements.length > 0 ||
    summary.matchUnlocks.length > 0
  );
}

export default async function WompiSuccessPage() {
  const summary = await getViewerEntitlementSummary();

  if (summary.status === "ready" && hasCurrentPaidAccess(summary)) {
    redirect("/dashboard");
  }

  return (
    <section className="ufo-card rounded-lg border border-emerald-400/25 p-6">
      <meta httpEquiv="refresh" content="3" />
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">
        Pago recibido
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Activando tu World Cup Pass</h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
        Tu pago fue recibido. El acceso se actualiza automaticamente y te llevaremos al panel cuando quede activo.
      </p>
      <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring mt-5 inline-flex">
        Abrir panel
      </Link>
    </section>
  );
}
