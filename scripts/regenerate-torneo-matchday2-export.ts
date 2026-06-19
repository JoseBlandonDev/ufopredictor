import { loadEnvConfig } from "@next/env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseScriptAdminClient } from "@/lib/supabase/script-admin";
import {
  getTorneoUfoExportWithClient,
  parseTorneoExportRange,
  resolveTorneoExportOrigin,
} from "@/lib/supabase/torneo-export-core";
import {
  getWorldCup2026SecondMatchdayFixtures,
  getWorldCup2026SecondMatchdayWindow,
  validateFinalMatchday2Export,
} from "@/lib/world-cup-2026/matchday2-ops";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

async function loadExistingArtifactExternalIds(artifactPath: string) {
  try {
    const raw = await readFile(artifactPath, "utf8");
    const parsed = JSON.parse(raw) as {
      fixtures?: Array<{ externalId?: string }>;
    };

    const externalIds = (parsed.fixtures ?? [])
      .map((fixture) => fixture.externalId)
      .filter((externalId): externalId is string => typeof externalId === "string" && externalId.length > 0);

    return [...new Set(externalIds)];
  } catch {
    return [];
  }
}

async function run() {
  loadEnvConfig(process.cwd());

  const resolvedOrigin = resolveTorneoExportOrigin({
    explicitOrigin: getArg("--origin") ?? undefined,
    allowLocalhostOrigin: false,
  });
  const range = getWorldCup2026SecondMatchdayWindow();
  const parsedRange = parseTorneoExportRange(range, new Date(`${range.from}T00:00:00.000Z`));
  if (parsedRange.status === "invalid") {
    throw new Error(parsedRange.message);
  }

  const artifactDirectory = path.join(process.cwd(), "artifacts");
  const artifactPath = path.join(
    artifactDirectory,
    "torneo-ufo-export-world-cup-2026-matchday2-final.json",
  );

  const canonicalFixtures = getWorldCup2026SecondMatchdayFixtures();
  const canonicalExternalIds = canonicalFixtures
    .map((fixture) => fixture.apiFootballExternalId)
    .filter(
      (
        externalId,
      ): externalId is NonNullable<(typeof canonicalFixtures)[number]["apiFootballExternalId"]> =>
        externalId !== null,
    );
  const existingArtifactExternalIds = await loadExistingArtifactExternalIds(artifactPath);
  const expectedExternalIds =
    canonicalExternalIds.length === 24 ? canonicalExternalIds : existingArtifactExternalIds;

  if (expectedExternalIds.length !== 24) {
    throw new Error(`Expected 24 canonical external IDs, received ${expectedExternalIds.length}.`);
  }

  const supabase = createSupabaseScriptAdminClient();
  const payload = await getTorneoUfoExportWithClient(supabase as never, {
    range: parsedRange.range,
    fromStartIso: parsedRange.fromStartIso,
    toEndIso: parsedRange.toEndIso,
    explicitOrigin: resolvedOrigin,
    excludeFinished: false,
    allowedMatchExternalIds: expectedExternalIds,
  });

  validateFinalMatchday2Export({
    payload,
    expectedExternalIds,
  });

  await mkdir(artifactDirectory, { recursive: true });
  await writeFile(artifactPath, JSON.stringify(payload, null, 2), "utf8");

  console.log(`TORNEO_EXPORT_REGENERATED origin=${resolvedOrigin} fixtures=${payload.fixtures.length} path=${artifactPath}`);
}

void run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`TORNEO_EXPORT_REGEN_FAILED message=${message}`);
  process.exitCode = 1;
});
