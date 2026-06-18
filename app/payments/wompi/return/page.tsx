import Link from "next/link";

function statusCopy(status: string | null) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return {
        eyebrow: "Pago reportado",
        title: "Estamos verificando tu acceso",
        body: "Wompi reporto el pago como aprobado. El World Cup Pass se activa cuando el webhook validado confirme el evento en el servidor.",
      };
    case "DECLINED":
    case "ERROR":
      return {
        eyebrow: "Pago no completado",
        title: "El acceso no se activo",
        body: "Esta pantalla no activa premium. Si quieres intentarlo de nuevo, vuelve a pricing e inicia un checkout nuevo.",
      };
    default:
      return {
        eyebrow: "Verificacion en curso",
        title: "Estamos esperando confirmacion",
        body: "El redirect del navegador es solo informativo. El acceso se activa unicamente cuando el webhook validado de Wompi sea procesado.",
      };
  }
}

export default async function WompiReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string; reference?: string }>;
}) {
  const params = await searchParams;
  const copy = statusCopy(params.status ?? null);

  return (
    <section className="ufo-card rounded-lg border border-[var(--accent)]/30 p-6">
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
