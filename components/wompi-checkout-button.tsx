"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

export function WompiCheckoutButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function startCheckout() {
    setStatus("loading");

    const response = await fetch("/api/wompi/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    const payload = (await response.json()) as { checkoutUrl?: string };

    if (!payload.checkoutUrl) {
      setStatus("error");
      return;
    }

    window.location.assign(payload.checkoutUrl);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="ufo-btn-primary ufo-focus-ring inline-flex items-center gap-2"
        onClick={startCheckout}
        disabled={status === "loading"}
      >
        <CreditCard className="h-4 w-4" />
        {status === "loading" ? "Preparando checkout" : "Comprar World Cup Pass"}
      </button>
      {status === "error" ? (
        <p className="text-xs text-[var(--warning)]">
          No fue posible iniciar el checkout. Verifica la sesion y la configuracion de pago.
        </p>
      ) : null}
    </div>
  );
}
