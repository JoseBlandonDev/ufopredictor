import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_WOMPI_WORLD_CUP_PASS_AMOUNT_COP,
  WOMPI_WORLD_CUP_PASS_PRICE_LABEL,
  formatCopAmount,
} from "./config";

export type WompiWorldCupPassPrice = {
  amountInCents: number;
  amountCop: number;
  currency: "COP";
  priceLabel: string;
  displayPrice: string;
  baseAmountCop: number;
  basePriceLabel: string;
  offerAmountCop: number | null;
  offerPriceLabel: string | null;
  offerEndsAt: string | null;
  isOfferActive: boolean;
  updatedAt: string | null;
};

type WompiWorldCupPassPriceRpcRow = {
  amount_in_cents: number;
  amount_cop: number;
  currency: "COP";
  price_label: string;
  base_amount_cop: number;
  base_price_label: string;
  offer_amount_cop: number | null;
  offer_price_label: string | null;
  offer_ends_at: string | null;
  is_offer_active: boolean;
  updated_at: string | null;
};

export function buildWompiPriceDisplay(priceLabel: string, amountCop: number) {
  return `${priceLabel} · aprox. $${formatCopAmount(amountCop)} COP`;
}

function fallbackPrice(): WompiWorldCupPassPrice {
  const amountCop = DEFAULT_WOMPI_WORLD_CUP_PASS_AMOUNT_COP;

  return {
    amountInCents: amountCop * 100,
    amountCop,
    currency: "COP",
    priceLabel: WOMPI_WORLD_CUP_PASS_PRICE_LABEL,
    displayPrice: buildWompiPriceDisplay(WOMPI_WORLD_CUP_PASS_PRICE_LABEL, amountCop),
    baseAmountCop: amountCop,
    basePriceLabel: WOMPI_WORLD_CUP_PASS_PRICE_LABEL,
    offerAmountCop: null,
    offerPriceLabel: null,
    offerEndsAt: null,
    isOfferActive: false,
    updatedAt: null,
  };
}

function toWorldCupPassPrice(row: WompiWorldCupPassPriceRpcRow): WompiWorldCupPassPrice {
  return {
    amountInCents: row.amount_in_cents,
    amountCop: row.amount_cop,
    currency: row.currency,
    priceLabel: row.price_label,
    displayPrice: buildWompiPriceDisplay(row.price_label, row.amount_cop),
    baseAmountCop: row.base_amount_cop,
    basePriceLabel: row.base_price_label,
    offerAmountCop: row.offer_amount_cop,
    offerPriceLabel: row.offer_price_label,
    offerEndsAt: row.offer_ends_at,
    isOfferActive: row.is_offer_active,
    updatedAt: row.updated_at,
  };
}

export async function getWompiWorldCupPassPrice(): Promise<WompiWorldCupPassPrice> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_wompi_world_cup_pass_price");

    if (error || !data || data.length === 0) {
      return fallbackPrice();
    }

    return toWorldCupPassPrice(data[0] as WompiWorldCupPassPriceRpcRow);
  } catch {
    return fallbackPrice();
  }
}
