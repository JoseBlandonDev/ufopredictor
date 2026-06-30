import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { ProviderFixture } from "../football-api/api-football-types";

export const TASK2B_STAGE_PROJECT_REF = "yfmklapgjrupctgxaako";
export const TASK2B_PRODUCTION_DENY_PROJECT_REF = "gcpdffkgsdomzyoenalg";
export const TASK2B_PROVIDER_NAME = "api-football";
export const TASK2B_PROVIDER_LEAGUE_ID = 1;
export const TASK2B_PROVIDER_SEASON = 2026;
export const TASK2B_COMPETITION_SLUG = "world-cup-2026";
export const TASK2B_WORLD_CUP_DATE_RANGE = {
  from: "2026-06-11",
  to: "2026-06-28",
} as const;

export type Task2BMode = "dry_run" | "apply" | "verification";
export type Task2BSlice = "task2b.1" | "task2b.2";
export type Task2BProviderStatusClassification =
  | "not_started"
  | "live_or_in_progress"
  | "terminal_ft"
  | "postponed"
  | "cancelled"
  | "abandoned"
  | "unsupported";

export type Task2BSelectionSpec = {
  canonicalFixtureIds: string[];
  matchIds: string[];
  apiFootballFixtureIds: number[];
  matchday: number | null;
  from: string | null;
  to: string | null;
};

export type Task2BAuthorization = {
  mode: Task2BMode;
  projectRef: string;
  denyProjectRef: string;
  supabaseUrlHost: string;
  targetEnvironment: string;
  productionDenied: true;
  allowRemoteDevWrite: boolean;
};

export type Task2BSanitizedProviderRow = {
  providerFixtureId: number;
  kickoffAt: string;
  timezone: string | null;
  normalizedStatus: Task2BProviderStatusClassification;
  providerStatus: ProviderFixture["status"];
  providerStatusShort: string;
  elapsedMinutes: number | null;
  competition: {
    providerCompetitionId: number;
    name: string;
    country: string | null;
    season: number | null;
    round: string | null;
  };
  homeTeam: {
    providerTeamId: number;
    name: string;
  };
  awayTeam: {
    providerTeamId: number;
    name: string;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

export type Task2BProviderSnapshot = {
  schemaName: "ufo-task2b-provider-snapshot-v1";
  schemaVersion: 1;
  provider: typeof TASK2B_PROVIDER_NAME;
  leagueId: number;
  season: number;
  request: {
    from: string | null;
    to: string | null;
    status: string | null;
  };
  acquiredAt: string;
  observedAt: string;
  normalizationVersion: 1;
  rowCount: number;
  fixtures: Task2BSanitizedProviderRow[];
};

export function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function sha256Json(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function ensureDirectory(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeJsonFile(filePath: string, payload: unknown): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function normalizeUtcInstant(value: string): string {
  const epochMs = Date.parse(value);
  if (Number.isNaN(epochMs)) {
    throw new Error(`Invalid UTC timestamp: ${value}`);
  }

  return new Date(epochMs).toISOString();
}

export function sameUtcInstant(left: string, right: string): boolean {
  return normalizeUtcInstant(left) === normalizeUtcInstant(right);
}

export function classifyTask2BProviderStatus(fixture: ProviderFixture): Task2BProviderStatusClassification {
  switch (fixture.statusShort) {
    case "NS":
    case "TBD":
      return "not_started";
    case "1H":
    case "2H":
    case "ET":
    case "P":
    case "BT":
    case "HT":
    case "LIVE":
      return "live_or_in_progress";
    case "FT":
      return "terminal_ft";
    case "PST":
      return "postponed";
    case "CANC":
    case "AWD":
    case "WO":
      return "cancelled";
    case "SUSP":
    case "INT":
    case "ABD":
      return "abandoned";
    default:
      return "unsupported";
  }
}

export function sanitizeProviderSnapshot(args: {
  fixtures: ProviderFixture[];
  acquiredAt: string;
  observedAt?: string;
  from: string | null;
  to: string | null;
  status?: string | null;
}): Task2BProviderSnapshot {
  const fixtures = args.fixtures
    .map((fixture) => ({
      providerFixtureId: fixture.providerFixtureId,
      kickoffAt: normalizeUtcInstant(fixture.kickoffAt),
      timezone: fixture.timezone,
      normalizedStatus: classifyTask2BProviderStatus(fixture),
      providerStatus: fixture.status,
      providerStatusShort: fixture.statusShort,
      elapsedMinutes: fixture.elapsedMinutes,
      competition: {
        providerCompetitionId: fixture.competition.providerCompetitionId,
        name: fixture.competition.name,
        country: fixture.competition.country,
        season: fixture.competition.season,
        round: fixture.competition.round,
      },
      homeTeam: {
        providerTeamId: fixture.homeTeam.providerTeamId,
        name: fixture.homeTeam.name,
      },
      awayTeam: {
        providerTeamId: fixture.awayTeam.providerTeamId,
        name: fixture.awayTeam.name,
      },
      goals: {
        home: fixture.goals.home,
        away: fixture.goals.away,
      },
    }))
    .sort((left, right) => left.providerFixtureId - right.providerFixtureId);

  return {
    schemaName: "ufo-task2b-provider-snapshot-v1",
    schemaVersion: 1,
    provider: TASK2B_PROVIDER_NAME,
    leagueId: TASK2B_PROVIDER_LEAGUE_ID,
    season: TASK2B_PROVIDER_SEASON,
    request: {
      from: args.from,
      to: args.to,
      status: args.status ?? null,
    },
    acquiredAt: normalizeUtcInstant(args.acquiredAt),
    observedAt: normalizeUtcInstant(args.observedAt ?? args.acquiredAt),
    normalizationVersion: 1,
    rowCount: fixtures.length,
    fixtures,
  };
}

export function assertTask2BProviderSnapshot(snapshot: Task2BProviderSnapshot): void {
  if (
    snapshot.schemaName !== "ufo-task2b-provider-snapshot-v1" ||
    snapshot.schemaVersion !== 1 ||
    snapshot.provider !== TASK2B_PROVIDER_NAME ||
    snapshot.leagueId !== TASK2B_PROVIDER_LEAGUE_ID ||
    snapshot.season !== TASK2B_PROVIDER_SEASON
  ) {
    throw new Error("Task 2B refused malformed provider snapshot metadata.");
  }

  for (const fixture of snapshot.fixtures) {
    normalizeUtcInstant(fixture.kickoffAt);
  }
}

export function assertTask2BLocalRunPreflight(
  repoRoot: string,
  artifactsDir: string,
  runnerKey: "task2b-1" | "task2b-2",
): void {
  const resolvedArtifactsDir = path.resolve(artifactsDir);
  const allowedRoot = path.resolve(
    repoRoot,
    "artifacts",
    "prediction-intelligence-v2",
    runnerKey,
    "local-run",
  );
  const relative = path.relative(allowedRoot, resolvedArtifactsDir);
  if (relative === "" || relative === "." || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `Task 2B local run refused because artifactsDir must resolve inside ${allowedRoot}${path.sep}.`,
    );
  }
}

export function resolveTask2BDefaultArtifactsDir(
  repoRoot: string,
  runnerKey: "task2b-1" | "task2b-2",
): string {
  const day = new Date().toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(
    repoRoot,
    "artifacts",
    "prediction-intelligence-v2",
    runnerKey,
    "local-run",
    day,
    stamp,
  );
}

export function assertTask2BAuthorization(input: {
  projectRef: string;
  denyProjectRef: string;
  dryRun: boolean;
  apply: boolean;
  verify: boolean;
  supabaseUrl: string | undefined;
}): Task2BAuthorization {
  if (input.projectRef !== TASK2B_STAGE_PROJECT_REF) {
    throw new Error(`Unexpected stage project ref: ${input.projectRef}.`);
  }
  if (input.denyProjectRef !== TASK2B_PRODUCTION_DENY_PROJECT_REF) {
    throw new Error(`Unexpected deny project ref: ${input.denyProjectRef}.`);
  }
  if (String(input.projectRef) === String(input.denyProjectRef)) {
    throw new Error("Production project ref is denied.");
  }

  const selectedModeCount = [input.dryRun, input.apply, input.verify].filter(Boolean).length;
  if (selectedModeCount !== 1) {
    throw new Error("Specify exactly one of --dry-run, --apply, or --verify.");
  }

  const targetEnvironment = process.env.PREDICTION_INTELLIGENCE_TARGET;
  if (targetEnvironment !== "development") {
    throw new Error("PREDICTION_INTELLIGENCE_TARGET must be exactly development.");
  }

  const allowRemoteDevWrite = process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE === "true";
  if (input.apply && !allowRemoteDevWrite) {
    throw new Error("Apply mode requires PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE=true.");
  }

  if (!input.supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  let parsedHost: string;
  try {
    parsedHost = new URL(input.supabaseUrl).host;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }

  if (parsedHost !== `${input.projectRef}.supabase.co`) {
    throw new Error(`Supabase URL host mismatch. Expected ${input.projectRef}.supabase.co.`);
  }

  const envProjectRef = process.env.DEV_SUPABASE_PROJECT_REF;
  if (envProjectRef && envProjectRef !== input.projectRef) {
    throw new Error("DEV_SUPABASE_PROJECT_REF does not match the explicit --project-ref.");
  }

  return {
    mode: input.dryRun ? "dry_run" : input.apply ? "apply" : "verification",
    projectRef: input.projectRef,
    denyProjectRef: input.denyProjectRef,
    supabaseUrlHost: parsedHost,
    targetEnvironment,
    productionDenied: true,
    allowRemoteDevWrite,
  };
}

export function normalizeSelectionSpec(input: Partial<Task2BSelectionSpec>): Task2BSelectionSpec {
  return {
    canonicalFixtureIds: [...new Set((input.canonicalFixtureIds ?? []).filter(Boolean))].sort(),
    matchIds: [...new Set((input.matchIds ?? []).filter(Boolean))].sort(),
    apiFootballFixtureIds: [...new Set((input.apiFootballFixtureIds ?? []).filter((value) => Number.isInteger(value) && value > 0))].sort(
      (left, right) => left - right,
    ),
    matchday: input.matchday ?? null,
    from: input.from ?? null,
    to: input.to ?? null,
  };
}

export function buildTask2BSelectionLabel(selection: Task2BSelectionSpec): string {
  const parts: string[] = [];
  if (selection.canonicalFixtureIds.length > 0) {
    parts.push(`canonical_${selection.canonicalFixtureIds.length}`);
  }
  if (selection.matchIds.length > 0) {
    parts.push(`match_${selection.matchIds.length}`);
  }
  if (selection.apiFootballFixtureIds.length > 0) {
    parts.push(`provider_${selection.apiFootballFixtureIds.length}`);
  }
  if (selection.matchday !== null) {
    parts.push(`matchday_${selection.matchday}`);
  }
  if (selection.from || selection.to) {
    parts.push(`range_${selection.from ?? "start"}_${selection.to ?? "end"}`);
  }
  return parts.join("__") || "bounded_selection";
}
