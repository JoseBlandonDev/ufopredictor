import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseWompiTransactionEvent } from "@/lib/wompi/events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headerChecksum = request.headers.get("x-event-checksum");
  let rawEvent: unknown;

  try {
    rawEvent = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  let event;

  try {
    event = parseWompiTransactionEvent(rawEvent);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Wompi event." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("activate_verified_wompi_entitlement", {
    p_event_json: event,
    p_header_checksum: headerChecksum,
  });

  if (error || !data) {
    return NextResponse.json({ error: "Wompi event could not be processed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
