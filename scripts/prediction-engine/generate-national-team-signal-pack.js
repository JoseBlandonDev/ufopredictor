/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const CANONICAL_TEAMS_PATH = path.join(ROOT, "lib", "world-cup-2026", "canonical-teams.ts");
const SOURCE_DIR = path.join(ROOT, "data", "prediction-engine", "national-team-signals", "2026-06-19");
const SOURCE_JSON_PATH = path.join(SOURCE_DIR, "source.json");
const QUALITY_REPORT_PATH = path.join(SOURCE_DIR, "quality-report.json");
const MANIFEST_PATH = path.join(SOURCE_DIR, "source-manifest.json");
const OUTPUT_PATH = path.join(ROOT, "lib", "prediction-engine", "national-team-strength-signal-pack.ts");
const GENERATOR_RELATIVE_PATH = "scripts/prediction-engine/generate-national-team-signal-pack.js";
const SOURCE_JSON_RELATIVE_PATH = "data/prediction-engine/national-team-signals/2026-06-19/source.json";
const QUALITY_REPORT_RELATIVE_PATH = "data/prediction-engine/national-team-signals/2026-06-19/quality-report.json";
const MANIFEST_RELATIVE_PATH = "data/prediction-engine/national-team-signals/2026-06-19/source-manifest.json";
const COMMAND = "node scripts/prediction-engine/generate-national-team-signal-pack.js";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadCanonicalTeams() {
  const source = fs
    .readFileSync(CANONICAL_TEAMS_PATH, "utf8")
    .replace(/^import type .*?;\r?\n/, "")
    .replace(/export const /g, "const ")
    .replace(/ as const satisfies readonly WorldCup2026Team\[];/g, ";");

  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.teams = WORLD_CUP_2026_TEAMS;`, context);
  return context.teams;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateQuality(source, qualityReport) {
  const checks = qualityReport.checks ?? {};

  assert(qualityReport.verdict === "PASS_SOURCE_REFRESH", "Quality report verdict must be PASS_SOURCE_REFRESH.");
  assert(checks.canonicalTeamCount === 48, "Quality report must confirm exactly 48 canonical teams.");
  assert(checks.duplicateCanonicalTeamCount === 0, "Quality report must confirm zero duplicate canonical teams.");
  assert((checks.missingFifaCsvTeams ?? []).length === 0, "Quality report reports missing FIFA CSV teams.");
  assert((checks.missingFifaHtmlTeams ?? []).length === 0, "Quality report reports missing FIFA HTML teams.");
  assert((checks.missingEloTeams ?? []).length === 0, "Quality report reports missing Elo teams.");
  assert(checks.impossibleDateCount === 0, "Quality report reports impossible dates.");
  assert(checks.futureResultCountRelativeToSnapshot === 0, "Quality report reports future-dated results.");

  const snapshotDate = source.snapshotDate;
  assert(typeof snapshotDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(snapshotDate), "Source snapshotDate is invalid.");
  assert(source.coverage?.canonicalTeamCount === 48, "Source snapshot must cover exactly 48 canonical teams.");
  assert(Array.isArray(source.teams) && source.teams.length === 48, "Source snapshot must contain 48 teams.");
}

function mapSourceTeams(canonicalTeams, sourceTeams) {
  const normalizedCatalog = canonicalTeams.map((team) => ({
    team,
    aliases: new Set(
      [
        team.teamKey,
        team.slug,
        team.displayName,
        team.fifaOfficialName,
        team.country,
        ...(team.aliases ?? []),
      ].map(normalizeKey),
    ),
  }));

  const mapped = new Map();

  for (const sourceTeam of sourceTeams) {
    const candidateNames = [
      sourceTeam.teamKey,
      sourceTeam.databaseNameEn,
      sourceTeam.displayNameEn,
      ...(sourceTeam.aliases ?? []),
    ]
      .filter(Boolean)
      .map(normalizeKey);

    const matches = normalizedCatalog.filter((entry) =>
      candidateNames.some((candidate) => entry.aliases.has(candidate)),
    );

    assert(matches.length === 1, `Could not resolve unique canonical runtime key for source team ${sourceTeam.teamKey}.`);
    mapped.set(matches[0].team.teamKey, sourceTeam);
  }

  assert(mapped.size === canonicalTeams.length, "Mapped source team count does not match canonical runtime team count.");
  return mapped;
}

function round(value) {
  return Number(value.toFixed(2));
}

function scale(value, min, max, { invert = false } = {}) {
  if (max === min) {
    return 100;
  }

  const normalized = ((value - min) / (max - min)) * 100;
  return round(invert ? 100 - normalized : normalized);
}

function buildSeed(team, sourceTeam, bounds) {
  const runtimeSafe = sourceTeam.runtimeSafeInputs ?? {};
  const fifa = sourceTeam.fifa ?? {};
  const elo = sourceTeam.elo ?? {};

  const ratingScore = scale(runtimeSafe.eloRating, bounds.elo.min, bounds.elo.max);
  const recentFormScore = round((runtimeSafe.recentPointsPerMatch / 3) * 100);
  const attackScore = scale(
    runtimeSafe.historicalGoalsForPerMatch,
    bounds.historicalGoalsFor.min,
    bounds.historicalGoalsFor.max,
  );
  const defenseScore = scale(
    runtimeSafe.historicalGoalsAgainstPerMatch,
    bounds.historicalGoalsAgainst.min,
    bounds.historicalGoalsAgainst.max,
    { invert: true },
  );
  const fifaScore = scale(runtimeSafe.fifaRank, bounds.fifaRank.min, bounds.fifaRank.max, { invert: true });

  return {
    aliases: sourceTeam.aliases,
    sourceNotes: `${team.displayName}: generated from tracked source snapshot ${SOURCE_JSON_RELATIVE_PATH}. ` +
      "Uses validated aggregate recent-form inputs; runtime continues to exclude raw recent-match arrays from the committed static pack. " +
      "ratingScore min-max normalizes Elo rating across the 48 canonical World Cup teams; " +
      "recentFormScore is recent points per match divided by 3 and scaled to 0-100; " +
      "attackScore min-max normalizes historical goals for per match; " +
      "defenseScore inverse min-max normalizes historical goals against per match. " +
      "Market and lineup context remain neutral placeholders.",
    fifaRank: runtimeSafe.fifaRank,
    fifaPoints: runtimeSafe.fifaPoints,
    fifaScore,
    fifaSourceTeamName: fifa.teamNameEs ? sourceTeam.displayNameEn : sourceTeam.databaseNameEn,
    fifaSourceFile: "ranking-fifa-raw.csv",
    eloRank: runtimeSafe.eloRank,
    eloRating: runtimeSafe.eloRating,
    eloAverageRank: runtimeSafe.eloAverageRank,
    eloAverageRating: runtimeSafe.eloAverageRating,
    eloSourceTeamName: elo.teamNameEn ?? sourceTeam.databaseNameEn,
    eloSourceFile: "ranking-elo-raw.html",
    historicalGoalsForPerMatch: runtimeSafe.historicalGoalsForPerMatch,
    historicalGoalsAgainstPerMatch: runtimeSafe.historicalGoalsAgainstPerMatch,
    recentMatchCount: runtimeSafe.recentMatchCount,
    signals: {
      ratingScore,
      recentFormScore,
      attackScore,
      defenseScore,
    },
  };
}

function computeBounds(sourceTeams) {
  const pick = (selector) => sourceTeams.map(selector);
  const withBounds = (values) => ({ min: Math.min(...values), max: Math.max(...values) });

  return {
    elo: withBounds(pick((team) => team.runtimeSafeInputs.eloRating)),
    historicalGoalsFor: withBounds(pick((team) => team.runtimeSafeInputs.historicalGoalsForPerMatch)),
    historicalGoalsAgainst: withBounds(pick((team) => team.runtimeSafeInputs.historicalGoalsAgainstPerMatch)),
    fifaRank: withBounds(pick((team) => team.runtimeSafeInputs.fifaRank)),
  };
}

function validateSourceTeam(sourceTeam) {
  const runtimeSafe = sourceTeam.runtimeSafeInputs ?? {};
  const recent = sourceTeam.recent ?? {};
  const derived = sourceTeam.derivedRuntimeScores ?? {};

  const requiredNumbers = [
    "fifaRank",
    "fifaPoints",
    "eloRank",
    "eloRating",
    "eloAverageRank",
    "eloAverageRating",
    "historicalGoalsForPerMatch",
    "historicalGoalsAgainstPerMatch",
    "recentMatchCount",
    "recentGoalsForPerMatch",
    "recentGoalsAgainstPerMatch",
    "recentPointsPerMatch",
  ];

  for (const field of requiredNumbers) {
    assert(typeof runtimeSafe[field] === "number" && Number.isFinite(runtimeSafe[field]), `${sourceTeam.teamKey} is missing runtimeSafeInputs.${field}.`);
  }

  assert(typeof recent.sampleStatus === "string" && recent.sampleStatus.length > 0, `${sourceTeam.teamKey} is missing recent.sampleStatus.`);
  assert(
    derived.status === "REBUILD_IN_CODE_WITH_EXISTING_OR_EXPLICITLY_APPROVED_FORMULA",
    `${sourceTeam.teamKey} has unexpected derivedRuntimeScores.status.`,
  );
}

function buildGeneratedFile({ canonicalTeams, seedsByTeamKey, source, manifest }) {
  const header = [
    'import type { CanonicalSnapshotSeed } from "./national-team-strength-snapshots";',
    "",
    "// Generated file. Do not edit manually.",
    `// Source snapshot: ${SOURCE_JSON_RELATIVE_PATH}`,
    `// Quality report: ${QUALITY_REPORT_RELATIVE_PATH}`,
    `// Source manifest: ${MANIFEST_RELATIVE_PATH}`,
    `// Generator: ${GENERATOR_RELATIVE_PATH}`,
    `// Generation command: ${COMMAND}`,
    "",
    `export const REAL_SIGNAL_PACK_SNAPSHOT_DATE = ${JSON.stringify(source.snapshotDate)} as const;`,
    `export const REAL_SIGNAL_PACK_SOURCE_LABEL = ${JSON.stringify("SIGNAL04 tracked FIFA + Elo + recent aggregate signal pack")} as const;`,
    `export const REAL_SIGNAL_PACK_SOURCE_NOTES = ${JSON.stringify(
      `Generated from tracked normalized source inputs at ${SOURCE_JSON_RELATIVE_PATH}. ` +
        `Manifest SHA evidence lives at ${MANIFEST_RELATIVE_PATH}. ` +
        "Uses validated aggregate recent-form inputs while runtime continues to exclude raw recent-match arrays from the committed static pack. " +
        "Runtime consumes generated static TypeScript only; raw HTML/CSV are not runtime dependencies. " +
        "Market and lineup context remain neutral placeholders until direct inputs exist.",
    )} as const;`,
    "",
    "export const REAL_SIGNAL_PACK_CANONICAL_SNAPSHOT_SEEDS = {",
  ];

  const entries = canonicalTeams.map((team) => {
    const seed = seedsByTeamKey[team.teamKey];
    return `  ${JSON.stringify(team.teamKey)}: ${JSON.stringify(seed, null, 2).replace(/^/gm, "  ")}`;
  });

  const footer = [
    "} as const satisfies Record<string, CanonicalSnapshotSeed>;",
    "",
    `export const REAL_SIGNAL_PACK_SOURCE_SHA256S = ${JSON.stringify(
      Object.fromEntries((manifest.sources ?? []).map((sourceEntry) => [sourceEntry.filename, sourceEntry.sha256])),
      null,
      2,
    )} as const;`,
    "",
  ];

  return [...header, entries.join(",\n"), ...footer].join("\n");
}

function generatePack() {
  const canonicalTeams = loadCanonicalTeams();
  const source = readJson(SOURCE_JSON_PATH);
  const qualityReport = readJson(QUALITY_REPORT_PATH);
  const manifest = readJson(MANIFEST_PATH);

  validateQuality(source, qualityReport);
  source.teams.forEach(validateSourceTeam);

  const sourceByRuntimeKey = mapSourceTeams(canonicalTeams, source.teams);
  const bounds = computeBounds(source.teams);
  const seedsByTeamKey = {};

  for (const team of canonicalTeams) {
    const sourceTeam = sourceByRuntimeKey.get(team.teamKey);
    assert(sourceTeam, `Missing mapped source team for ${team.teamKey}.`);
    seedsByTeamKey[team.teamKey] = buildSeed(team, sourceTeam, bounds);
  }

  return buildGeneratedFile({ canonicalTeams, seedsByTeamKey, source, manifest });
}

function main() {
  const args = new Set(process.argv.slice(2));
  const nextContent = generatePack();
  const currentContent = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf8") : "";

  if (args.has("--check")) {
    if (currentContent !== nextContent) {
      throw new Error("Generated signal pack is out of date. Run the generator and commit the result.");
    }
    process.stdout.write("National-team signal pack is up to date.\n");
    return;
  }

  fs.writeFileSync(OUTPUT_PATH, nextContent);
  process.stdout.write(`Wrote ${path.relative(ROOT, OUTPUT_PATH)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

module.exports = {
  COMMAND,
  OUTPUT_PATH,
  SOURCE_DIR,
  generatePack,
  mapSourceTeams,
  scale,
};
