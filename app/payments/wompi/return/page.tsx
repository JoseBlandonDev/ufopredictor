import Link from "next/link";
import { redirect } from "next/navigation";
import { hasCurrentPremiumAccess } from "@/lib/permissions/current-premium-access";
import { getViewerEntitlementSummary } from "@/lib/supabase/entitlement-queries";

function statusCopy(status: string | null) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return {
        eyebrow: "Pago aprobado",
        title: "Activando tu World Cup Pass",
        body: "Tu pago fue aprobado. Estamos actualizando tu acceso automaticamente; esta pantalla se refresca sola.",
        refresh: true,
      };
    case "DECLINED":
    case "ERROR":
      return {
        eyebrow: "Pago no completado",
        title: "El acceso no se activo",
        body: "Wompi no aprobo esta transaccion. Puedes volver a pricing e iniciar un checkout nuevo.",
        refresh: false,
      };
    default:
      return {
        eyebrow: "Pago en curso",
        title: "Actualizando estado automaticamente",
        body: "Apenas Wompi confirme el pago, tu World Cup Pass aparecera activo en el panel.",
        refresh: true,
      };
  }
}

export default async function WompiReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string; reference?: string }>;
}) {
  const params = await searchParams;
  const summary = await getViewerEntitlementSummary();
  const paidAccessActive = hasCurrentPremiumAccess(summary);

  if (paidAccessActive) {
    redirect("/dashboard");
  }

  const copy = statusCopy(params.status ?? null);

  return (
    <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-6">
      {copy.refresh ? <meta httpEquiv="refresh" content="3" /> : null}
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
        {copy.eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">{copy.body}</p>
      {params.id ? (
        <p className="mt-4 font-mono text-xs text-[var(--muted)]">Transaccion Wompi: {params.id}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/dashboard" className="ufo-btn-primary ufo-focus-ring">
          Abrir panel
        </Link>
        <Link href="/pricing" className="ufo-btn-secondary ufo-focus-ring">
          Volver a pricing
        </Link>
      </div>
    </section>
  );
}
