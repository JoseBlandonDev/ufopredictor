import { NextResponse } from "next/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import {
  getTorneoUfoExport,
  parseTorneoExportRange,
} from "@/lib/supabase/torneo-export-queries";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = `/admin/torneo-export${url.search}`;
  const hasExplicitRange = url.searchParams.has("from") || url.searchParams.has("to");
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(nextPath)}`, url.origin));
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return jsonError("admin access required", 403);
  }

  const parsedRange = parseTorneoExportRange(
    {
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    },
    new Date(),
  );

  if (parsedRange.status === "invalid") {
    return jsonError(parsedRange.message, parsedRange.statusCode);
  }

  const payload = await getTorneoUfoExport({
    range: parsedRange.range,
    fromStartIso: parsedRange.fromStartIso,
    toEndIso: parsedRange.toEndIso,
    fallbackOrigin: url.origin,
    excludeFinished: !hasExplicitRange,
  });

  const filename = `torneo-ufo-export-${parsedRange.range.from}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
