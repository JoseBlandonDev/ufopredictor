import { Clock3, Save, Tag } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getWompiWorldCupPassPrice } from "@/lib/wompi/pricing";
import { updateWompiWorldCupPassPriceAction } from "./actions";

export const dynamic = "force-dynamic";

type AdminPaymentsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const INPUT_CLASS =
  "w-full rounded-md border border-white/10 bg-[#07131f] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent)]";
const BUTTON_CLASS =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20";

function formatOfferEndsAt(value: string | null) {
  if (!value) {
    return "Sin oferta activa";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

function statusMessage(status?: string) {
  if (status === "updated") {
    return "Precio actualizado. El proximo checkout usara este valor.";
  }

  if (status === "invalid_base") {
    return "Revisa el precio base y la etiqueta.";
  }

  if (status === "invalid_offer") {
    return "La oferta necesita precio y duracion en minutos.";
  }

  if (status === "update_failed") {
    return "No fue posible actualizar el precio.";
  }

  return null;
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  await requireAdmin("/admin/payments");

  const [price, resolvedSearchParams] = await Promise.all([
    getWompiWorldCupPassPrice(),
    searchParams,
  ]);
  const message = statusMessage(resolvedSearchParams.status);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
          Admin / Payments
        </p>
        <h1 className="text-4xl font-semibold">Precio World Cup Pass</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Controla el precio que se muestra en Planes y el monto que Wompi cobra en el checkout.
        </p>
      </section>

      {message ? (
        <section className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4 text-sm text-[var(--accent)]">
          {message}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="panel rounded-lg p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Precio activo
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{price.displayPrice}</h2>
            </div>
            <span className="ufo-pill">{price.isOfferActive ? "Oferta" : "Base"}</span>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <dt className="flex items-center gap-2 text-[var(--muted)]">
                <Tag className="h-4 w-4" />
                Base
              </dt>
              <dd className="mt-2 font-medium text-white">
                {price.basePriceLabel} · ${price.baseAmountCop.toLocaleString("es-CO")} COP
              </dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <dt className="flex items-center gap-2 text-[var(--muted)]">
                <Clock3 className="h-4 w-4" />
                Oferta
              </dt>
              <dd className="mt-2 font-medium text-white">{formatOfferEndsAt(price.offerEndsAt)}</dd>
            </div>
          </dl>
        </div>

        <form action={updateWompiWorldCupPassPriceAction} className="panel rounded-lg p-5">
          <div>
            <h2 className="text-lg font-semibold">Actualizar precio</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Escribe valores en pesos colombianos. El sistema convierte a cents para Wompi.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-white">Precio base COP</span>
              <input
                className={INPUT_CLASS}
                name="baseAmountCop"
                inputMode="numeric"
                defaultValue={price.baseAmountCop}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">Etiqueta base</span>
              <input className={INPUT_CLASS} name="basePriceLabel" defaultValue={price.basePriceLabel} required />
            </label>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Oferta temporal</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-[var(--muted)]">Precio oferta COP</span>
                  <input
                    className={INPUT_CLASS}
                    name="offerAmountCop"
                    inputMode="numeric"
                    defaultValue={price.isOfferActive ? (price.offerAmountCop ?? "") : ""}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-[var(--muted)]">Duracion minutos</span>
                  <input className={INPUT_CLASS} name="offerMinutes" inputMode="numeric" placeholder="15" />
                </label>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
                <input className="h-4 w-4 accent-[var(--accent)]" type="checkbox" name="clearOffer" />
                Quitar oferta activa
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">Etiqueta oferta</span>
              <input
                className={INPUT_CLASS}
                name="offerPriceLabel"
                defaultValue={price.offerPriceLabel ?? price.basePriceLabel}
              />
            </label>

            <button className={BUTTON_CLASS} type="submit">
              <Save className="h-4 w-4" />
              Guardar precio
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
