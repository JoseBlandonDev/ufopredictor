import "server-only";

import { createSupabaseServerClient } from "./server";
import {
  getDefaultTorneoExportRange,
  getTorneoUfoExportWithClient,
  parseTorneoExportRange,
  resolveTorneoExportOrigin,
} from "./torneo-export-core";
import type { TorneoUfoExport, TorneoExportRange, TorneoExportFixture } from "./torneo-export-core";

export type { TorneoUfoExport, TorneoExportRange, TorneoExportFixture };
export {
  getDefaultTorneoExportRange,
  parseTorneoExportRange,
  getTorneoUfoExportWithClient,
  resolveTorneoExportOrigin,
};

export async function getTorneoUfoExport(args: {
  range: TorneoExportRange;
  fromStartIso: string;
  toEndIso: string;
  fallbackOrigin?: string;
  explicitOrigin?: string;
  excludeFinished?: boolean;
  allowedMatchExternalIds?: string[];
  allowLocalhostOrigin?: boolean;
}): Promise<TorneoUfoExport> {
  const supabase = await createSupabaseServerClient();
  return getTorneoUfoExportWithClient(supabase, args);
}
