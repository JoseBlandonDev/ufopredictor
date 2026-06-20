"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireWompiUsdCopRate } from "@/lib/wompi/config";
import { convertUsdCentsToCop, parseUsdInputToCents } from "@/lib/wompi/usd-pricing";

function parseOfferMinutes(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 10080) {
    return null;
  }

  return parsed;
}

function redirectWithStatus(status: string): never {
  redirect(`/admin/payments?status=${encodeURIComponent(status)}`);
}

export async function updateWompiWorldCupPassPriceAction(formData: FormData) {
  await requireAdmin("/admin/payments");

  const basePriceUsdCents = parseUsdInputToCents(formData.get("basePriceUsd"));
  const clearOffer = formData.get("clearOffer") === "on";
  const offerPriceUsdCents = clearOffer ? null : parseUsdInputToCents(formData.get("offerPriceUsd"));
  const offerMinutes = clearOffer ? null : parseOfferMinutes(formData.get("offerMinutes"));

  if (!basePriceUsdCents || basePriceUsdCents < 100 || basePriceUsdCents > 5000000) {
    redirectWithStatus("invalid_base");
  }

  if (offerPriceUsdCents && !offerMinutes) {
    redirectWithStatus("invalid_offer");
  }

  let usdCopRate: number;
  try {
    usdCopRate = requireWompiUsdCopRate();
  } catch {
    redirectWithStatus("configuration_error");
  }

  const baseAmountCop = convertUsdCentsToCop(basePriceUsdCents, usdCopRate);
  const offerAmountCop = offerPriceUsdCents
    ? convertUsdCentsToCop(offerPriceUsdCents, usdCopRate)
    : null;
  const offerEndsAt =
    offerPriceUsdCents && offerMinutes
      ? new Date(Date.now() + offerMinutes * 60 * 1000).toISOString()
      : null;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_wompi_world_cup_pass_price", {
    p_base_price_usd_cents: basePriceUsdCents,
    p_base_amount_cop: baseAmountCop,
    p_offer_price_usd_cents: offerPriceUsdCents,
    p_offer_amount_cop: offerAmountCop,
    p_offer_ends_at: offerEndsAt,
    p_usd_cop_rate: usdCopRate,
  });

  if (error) {
    redirectWithStatus("update_failed");
  }

  revalidatePath("/admin/payments");
  revalidatePath("/pricing");
  redirectWithStatus("updated");
}
