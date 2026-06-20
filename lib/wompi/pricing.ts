import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWompiUsdCopRate } from "./config";
import { formatCopDisplay, formatUsdCents } from "./usd-pricing";

export type WompiWorldCupPassPrice =
  | {
      status: "available";
      amountInCents: number;
      amountCop: number;
      currency: "COP";
      displayPrice: string;
      checkoutDisplay: string;
      priceUsdCents: number;
      basePriceUsdCents: number;
      offerPriceUsdCents: number | null;
      usdCopRate: number;
      convertedAt: string;
      offerEndsAt: string | null;
      isOfferActive: boolean;
      updatedAt: string | null;
    }
  | {
      status: "configuration_error";
      message: string;
      currency: "COP";
      usdCopRate: number | null;
      basePriceUsdCents: null;
      offerPriceUsdCents: null;
      offerEndsAt: null;
      updatedAt: null;
    };

type WompiWorldCupPassPriceRpcRow = {
  amount_in_cents: number;
  amount_cop: number;
  currency: "COP";
  price_usd_cents: number;
  base_price_usd_cents: number;
  offer_price_usd_cents: number | null;
  offer_ends_at: string | null;
  is_offer_active: boolean;
  updated_at: string | null;
  usd_cop_rate: number;
  converted_at: string;
};

function configurationError(message: string, usdCopRate: number | null): WompiWorldCupPassPrice {
  return {
    status: "configuration_error",
    message,
    currency: "COP",
    usdCopRate,
    basePriceUsdCents: null,
    offerPriceUsdCents: null,
    offerEndsAt: null,
    updatedAt: null,
  };
}

function toWorldCupPassPrice(row: WompiWorldCupPassPriceRpcRow): WompiWorldCupPassPrice {
  return {
    status: "available",
    amountInCents: row.amount_in_cents,
    amountCop: row.amount_cop,
    currency: row.currency,
    displayPrice: formatUsdCents(row.price_usd_cents),
    checkoutDisplay: formatCopDisplay(row.amount_cop),
    priceUsdCents: row.price_usd_cents,
    basePriceUsdCents: row.base_price_usd_cents,
    offerPriceUsdCents: row.offer_price_usd_cents,
    usdCopRate: row.usd_cop_rate,
    convertedAt: row.converted_at,
    offerEndsAt: row.offer_ends_at,
    isOfferActive: row.is_offer_active,
    updatedAt: row.updated_at,
  };
}

export async function getWompiWorldCupPassPrice(): Promise<WompiWorldCupPassPrice> {
  let usdCopRate: number | null = null;

  try {
    usdCopRate = requireWompiUsdCopRate();
  } catch (error) {
    return configurationError(
      error instanceof Error ? error.message : "Missing Wompi server configuration.",
      null,
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_wompi_world_cup_pass_price");

    if (error) {
      return configurationError("No fue posible leer el precio canonico de Wompi.", usdCopRate);
    }

    if (!data || data.length === 0) {
      return configurationError("No hay precio canonico configurado para World Cup Pass.", usdCopRate);
    }

    return toWorldCupPassPrice(data[0] as WompiWorldCupPassPriceRpcRow);
  } catch {
    return configurationError("No fue posible cargar el precio canonico de Wompi.", usdCopRate);
  }
}
