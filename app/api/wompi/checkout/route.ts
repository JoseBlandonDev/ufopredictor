import { NextResponse } from "next/server";
import { buildWompiCheckoutPayload } from "@/lib/wompi/checkout";
import { requireWompiServerConfig } from "@/lib/wompi/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WompiPaymentIntentRow } from "@/types/database";

export const runtime = "nodejs";
const ACTIVE_PREMIUM_ACCESS_ERROR = "world-cup-pass already active for this account";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let config: ReturnType<typeof requireWompiServerConfig>;
  try {
    config = requireWompiServerConfig();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Wompi server configuration." },
      { status: 500 },
    );
  }

  const expirationTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { data: intentData, error: intentError } = await supabase.rpc(
    "create_wompi_world_cup_pass_intent",
    {
      p_expires_at: expirationTime,
    },
  );

  if (intentError?.message === ACTIVE_PREMIUM_ACCESS_ERROR) {
    return NextResponse.json({ error: "World Cup Pass already active for this account." }, { status: 409 });
  }

  if (intentError || !intentData) {
    return NextResponse.json({ error: "Could not create Wompi payment intent." }, { status: 500 });
  }

  const intent = intentData as WompiPaymentIntentRow;

  const checkoutPayload = buildWompiCheckoutPayload({
    config,
    reference: intent.reference,
    amountInCents: intent.amount_in_cents,
    expirationTime,
  });

  if (checkoutPayload.currency !== intent.currency) {
    return NextResponse.json({ error: "Wompi currency configuration mismatch." }, { status: 500 });
  }

  return NextResponse.json({
    reference: intent.reference,
    checkoutUrl: checkoutPayload.checkoutUrl,
    amountInCents: checkoutPayload.amountInCents,
    currency: checkoutPayload.currency,
  });
}
