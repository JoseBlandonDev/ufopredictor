"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseCopAmount(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").replace(/[^\d]/g, "");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

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

  const baseAmountCop = parseCopAmount(formData.get("baseAmountCop"));
  const basePriceLabel = String(formData.get("basePriceLabel") ?? "").trim();
  const clearOffer = formData.get("clearOffer") === "on";
  const offerAmountCop = clearOffer ? null : parseCopAmount(formData.get("offerAmountCop"));
  const offerPriceLabel = clearOffer ? null : String(formData.get("offerPriceLabel") ?? "").trim();
  const offerMinutes = clearOffer ? null : parseOfferMinutes(formData.get("offerMinutes"));

  if (!baseAmountCop || baseAmountCop < 1000 || baseAmountCop > 5000000 || !basePriceLabel) {
    redirectWithStatus("invalid_base");
  }

  if (offerAmountCop && !offerMinutes) {
    redirectWithStatus("invalid_offer");
  }

  const offerEndsAt =
    offerAmountCop && offerMinutes
      ? new Date(Date.now() + offerMinutes * 60 * 1000).toISOString()
      : null;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_wompi_world_cup_pass_price", {
    p_base_amount_cop: baseAmountCop,
    p_base_price_label: basePriceLabel,
    p_offer_amount_cop: offerAmountCop,
    p_offer_price_label: offerPriceLabel || null,
    p_offer_ends_at: offerEndsAt,
  });

  if (error) {
    redirectWithStatus("update_failed");
  }

  revalidatePath("/admin/payments");
  revalidatePath("/pricing");
  redirectWithStatus("updated");
}
