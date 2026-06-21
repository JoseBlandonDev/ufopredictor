import fs from "node:fs";
import path from "node:path";
import { generatePrediction } from "@/lib/prediction-engine/generate-prediction";
import {
  buildBaselinePredictionInput,
  buildRecentFormChallengerCatalog,
  buildRecentFormChallengerPredictionInput,
  evaluateChallengerVariantPerformance,
  findConfidenceSupportWarning,
  isFutureShadowEligibleFixture,
  RECENT_FORM_CHALLENGER_VARIANTS,
  type RecentFormChallengerTeamDiagnostics,
  type TrackedSourceSnapshot,
} from "@/lib/prediction-engine/recent-form-challenger";
import {
  CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
  resolveNationalTeamStrengthSnapshot,
} from "@/lib/prediction-engine/national-team-strength-snapshots";
import { getWorldCup2026SecondMatchdayFixtures } from "@/lib/world-cup-2026/matchday2-ops";
import { WORLD_CUP_2026_TEAMS } from "@/lib/world-cup-2026";

const ROOT = process.cwd();
const SOURCE_SNAPSHOT_PATH = path.join(ROOT, "data", "prediction-engine", "national-team-signals", "2026-06-19", "source.json");
const ARTIFACT_DIR = path.join(ROOT, "artifacts", "recent-form-challenger-v1");
const JSON_ARTIFACT_PATH = path.join(ARTIFACT_DIR, "recent-form-challenger-v1.json");
const MARKDOWN_ARTIFACT_PATH = path.join(ARTIFACT_DIR, "recent-form-challenger-v1.md");

function parseArgs(argv: string[]) {
  const parsed = new Map<string, string>();

  for (const argument of argv) {
    if (!argument.startsWith("--")) {
      continue;
    }

    const [key, value] = argument.slice(2).split("=", 2);
    if (key) {
      parsed.set(key, value ?? "true");
    }
  }

  const asOfIso = parsed.get("asOfIso")
    ?? (parsed.get("asOfDate") ? `${parsed.get("asOfDate")}T12:00:00-05:00` : new Date().toISOString());

  return {
    asOfIso: new Date(asOfIso).toISOString(),
  };
}

function readSourceSnapshot() {
  return JSON.parse(fs.readFileSync(SOURCE_SNAPSHOT_PATH, "utf8")) as TrackedSourceSnapshot;
}

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatMaybeNumber(value: number | null) {
  return value === null ? "n/a" : String(value);
}

function buildTeamLookup() {
  return new Map(WORLD_CUP_2026_TEAMS.map((team) => [team.teamKey, team]));
}

function average(values: number[]) {
  return values.length === 0 ? null : round(values.reduce((total, value) => total + value, 0) / values.length, 4);
}

function summarizeFutureVariant(args: {
  variantKey: string;
  rows: Array<{
    fixtureKey: string;
    homeTeamKey: string;
    awayTeamKey: string;
    baseline: ReturnType<typeof generatePrediction>;
    challenger: ReturnType<typeof generatePrediction>;
  }>;
}) {
  const homeWinDeltas = args.rows.map((row) => row.challenger.probabilities.oneXTwo.homeWin - row.baseline.probabilities.oneXTwo.homeWin);
  const drawDeltas = args.rows.map((row) => row.challenger.probabilities.oneXTwo.draw - row.baseline.probabilities.oneXTwo.draw);
  const awayWinDeltas = args.rows.map((row) => row.challenger.probabilities.oneXTwo.awayWin - row.baseline.probabilities.oneXTwo.awayWin);
  const totalXgDeltas = args.rows.map((row) => (row.challenger.expectedGoals.home + row.challenger.expectedGoals.away) - (row.baseline.expectedGoals.home + row.baseline.expectedGoals.away));
  const favoriteChanges = args.rows.filter((row) => {
    const baseline = [
      row.baseline.probabilities.oneXTwo.homeWin,
      row.baseline.probabilities.oneXTwo.draw,
      row.baseline.probabilities.oneXTwo.awayWin,
    ];
    const challenger = [
      row.challenger.probabilities.oneXTwo.homeWin,
      row.challenger.probabilities.oneXTwo.draw,
      row.challenger.probabilities.oneXTwo.awayWin,
    ];

    return baseline.indexOf(Math.max(...baseline)) !== challenger.indexOf(Math.max(...challenger));
  }).length;
  const confidenceWarnings = args.rows
    .map((row) => findConfidenceSupportWarning(row.challenger))
    .filter((warning) => warning !== null);

  const cafOrAfcRows = args.rows.flatMap((row) => {
    const records: Array<{ region: "CAF" | "AFC"; deltaWinProb: number; deltaXg: number }> = [];
    const homeRegion = row.homeTeamKey in {
      "south-africa": true, morocco: true, "cote-divoire": true, tunisia: true, egypt: true,
      "cabo-verde": true, senegal: true, algeria: true, "congo-dr": true, ghana: true,
      "south-korea": true, qatar: true, australia: true, japan: true, iran: true,
      "saudi-arabia": true, iraq: true, jordan: true, uzbekistan: true,
    }
      ? (
        ["south-africa", "morocco", "cote-divoire", "tunisia", "egypt", "cabo-verde", "senegal", "algeria", "congo-dr", "ghana"].includes(row.homeTeamKey)
          ? "CAF"
          : "AFC"
      )
      : null;
    const awayRegion = row.awayTeamKey in {
      "south-africa": true, morocco: true, "cote-divoire": true, tunisia: true, egypt: true,
      "cabo-verde": true, senegal: true, algeria: true, "congo-dr": true, ghana: true,
      "south-korea": true, qatar: true, australia: true, japan: true, iran: true,
      "saudi-arabia": true, iraq: true, jordan: true, uzbekistan: true,
    }
      ? (
        ["south-africa", "morocco", "cote-divoire", "tunisia", "egypt", "cabo-verde", "senegal", "algeria", "congo-dr", "ghana"].includes(row.awayTeamKey)
          ? "CAF"
          : "AFC"
      )
      : null;

    if (homeRegion) {
      records.push({
        region: homeRegion,
        deltaWinProb: round(row.challenger.probabilities.oneXTwo.homeWin - row.baseline.probabilities.oneXTwo.homeWin, 4),
        deltaXg: round(row.challenger.expectedGoals.home - row.baseline.expectedGoals.home, 4),
      });
    }

    if (awayRegion) {
      records.push({
        region: awayRegion,
        deltaWinProb: round(row.challenger.probabilities.oneXTwo.awayWin - row.baseline.probabilities.oneXTwo.awayWin, 4),
        deltaXg: round(row.challenger.expectedGoals.away - row.baseline.expectedGoals.away, 4),
      });
    }

    return records;
  });

  const regionalSlices = (["CAF", "AFC"] as const).map((region) => {
    const rows = cafOrAfcRows.filter((row) => row.region === region);
    return {
      region,
      sampleSize: rows.length,
      averageWinProbabilityDelta: average(rows.map((row) => row.deltaWinProb)),
      averageExpectedGoalsDelta: average(rows.map((row) => row.deltaXg)),
    };
  });

  return {
    variantKey: args.variantKey,
    fixtureCount: args.rows.length,
    favoriteChanges,
    averageHomeWinDelta: average(homeWinDeltas),
    averageDrawDelta: average(drawDeltas),
    averageAwayWinDelta: average(awayWinDeltas),
    averageTotalExpectedGoalsDelta: average(totalXgDeltas),
    confidenceWarningCount: confidenceWarnings.length,
    confidenceWarnings,
    regionalSlices,
  };
}

function buildGermanyVsIvoryCoastBreakdown(args: {
  diagnosticsByTeamKey: Map<string, RecentFormChallengerTeamDiagnostics>;
}) {
  const germany = args.diagnosticsByTeamKey.get("germany");
  const ivoryCoast = args.diagnosticsByTeamKey.get("cote-divoire");

  if (!germany || !ivoryCoast) {
    throw new Error("Germany or Côte d’Ivoire challenger diagnostics are unavailable.");
  }

  const germanySnapshot = resolveNationalTeamStrengthSnapshot({ name: "Germany" });
  const ivoryCoastSnapshot = resolveNationalTeamStrengthSnapshot({ name: "Ivory Coast" });

  if (!germanySnapshot || !ivoryCoastSnapshot) {
    throw new Error("Germany or Côte d’Ivoire baseline snapshots are unavailable.");
  }

  const fixture = {
    fixtureKey: "diagnostic-germany-vs-cote-divoire",
    kickoffAt: "2026-06-20T17:00:00Z",
    homeTeamKey: "germany",
    awayTeamKey: "cote-divoire",
  };
  const baseline = generatePrediction({
    matchId: fixture.fixtureKey,
    homeTeam: {
      id: fixture.homeTeamKey,
      name: germanySnapshot.displayName,
      signals: { ...germanySnapshot.signals },
      metadata: germanySnapshot ? {
        fifaRank: germanySnapshot.fifaRank,
        fifaPoints: germanySnapshot.fifaPoints,
        eloRank: germanySnapshot.eloRank,
        eloRating: germanySnapshot.eloRating,
        eloAverageRank: germanySnapshot.eloAverageRank,
        eloAverageRating: germanySnapshot.eloAverageRating,
        historicalGoalsForPerMatch: germanySnapshot.historicalGoalsForPerMatch,
        historicalGoalsAgainstPerMatch: germanySnapshot.historicalGoalsAgainstPerMatch,
        recentMatchCount: germanySnapshot.recentMatchCount,
      } : undefined,
    },
    awayTeam: {
      id: fixture.awayTeamKey,
      name: ivoryCoastSnapshot.displayName,
      signals: { ...ivoryCoastSnapshot.signals },
      metadata: ivoryCoastSnapshot ? {
        fifaRank: ivoryCoastSnapshot.fifaRank,
        fifaPoints: ivoryCoastSnapshot.fifaPoints,
        eloRank: ivoryCoastSnapshot.eloRank,
        eloRating: ivoryCoastSnapshot.eloRating,
        eloAverageRank: ivoryCoastSnapshot.eloAverageRank,
        eloAverageRating: ivoryCoastSnapshot.eloAverageRating,
        historicalGoalsForPerMatch: ivoryCoastSnapshot.historicalGoalsForPerMatch,
        historicalGoalsAgainstPerMatch: ivoryCoastSnapshot.historicalGoalsAgainstPerMatch,
        recentMatchCount: ivoryCoastSnapshot.recentMatchCount,
      } : undefined,
    },
    context: { neutralVenue: true },
    runScope: "internal_lab",
    predictionType: "pre_match_24h",
  });

  const variants = Object.fromEntries(
    RECENT_FORM_CHALLENGER_VARIANTS.map((variant) => [
      variant.key,
      generatePrediction({
        matchId: `${fixture.fixtureKey}:${variant.key}`,
        homeTeam: {
          id: fixture.homeTeamKey,
          name: germanySnapshot.displayName,
          signals: {
            ...germanySnapshot.signals,
            attackScore: germany.variantSignals[variant.key].attackScore,
            defenseScore: germany.variantSignals[variant.key].defenseScore,
          },
          metadata: {
            fifaRank: germanySnapshot.fifaRank,
            fifaPoints: germanySnapshot.fifaPoints,
            eloRank: germanySnapshot.eloRank,
            eloRating: germanySnapshot.eloRating,
            eloAverageRank: germanySnapshot.eloAverageRank,
            eloAverageRating: germanySnapshot.eloAverageRating,
            historicalGoalsForPerMatch: germanySnapshot.historicalGoalsForPerMatch,
            historicalGoalsAgainstPerMatch: germanySnapshot.historicalGoalsAgainstPerMatch,
            recentMatchCount: germanySnapshot.recentMatchCount,
          },
        },
        awayTeam: {
          id: fixture.awayTeamKey,
          name: ivoryCoastSnapshot.displayName,
          signals: {
            ...ivoryCoastSnapshot.signals,
            attackScore: ivoryCoast.variantSignals[variant.key].attackScore,
            defenseScore: ivoryCoast.variantSignals[variant.key].defenseScore,
          },
          metadata: {
            fifaRank: ivoryCoastSnapshot.fifaRank,
            fifaPoints: ivoryCoastSnapshot.fifaPoints,
            eloRank: ivoryCoastSnapshot.eloRank,
            eloRating: ivoryCoastSnapshot.eloRating,
            eloAverageRank: ivoryCoastSnapshot.eloAverageRank,
            eloAverageRating: ivoryCoastSnapshot.eloAverageRating,
            historicalGoalsForPerMatch: ivoryCoastSnapshot.historicalGoalsForPerMatch,
            historicalGoalsAgainstPerMatch: ivoryCoastSnapshot.historicalGoalsAgainstPerMatch,
            recentMatchCount: ivoryCoastSnapshot.recentMatchCount,
          },
        },
        context: { neutralVenue: true },
        runScope: "internal_lab",
        predictionType: "pre_match_24h",
      }),
    ]),
  );

  return {
    fixture,
    teams: {
      germany,
      ivoryCoast,
    },
    baseline,
    variants,
  };
}

function buildFormulas() {
  return {
    clipping:
      "Each recent match clips goalsFor and goalsAgainst to the closed interval [0, 4] before aggregation. This bounded winsorization keeps one 6-0 or 7-0 scoreline from dominating the challenger path.",
    recencyWeighting:
      "Recent matches are sorted newest-to-oldest and weighted linearly from 1.00 down to 0.60 across the sampled window.",
    opponentStrengthAdjustment:
      "When the opponent is a canonical World Cup team with tracked Elo, adjustedGoalsFor = clippedGoalsFor * clamp(1 + normalizedOpponentElo * 0.12, 0.88, 1.12) and adjustedGoalsAgainst = clippedGoalsAgainst * clamp(1 - normalizedOpponentElo * 0.12, 0.88, 1.12), where normalizedOpponentElo = clamp((opponentElo - meanTrackedElo) / 400, -1, 1).",
    recentScores:
      "recentAttackScore min-max scales weighted adjusted goals-for per match across the tracked 48-team snapshot. recentDefenseScore inverse min-max scales weighted adjusted goals-against per match across the same snapshot.",
    sampleReliability:
      "sampleReliability = clamp((recentMatchCount/5) * statusFactor * (0.75 + 0.25*canonicalOpponentShare) * (0.90 + 0.10*worldCupOpponentShare), 0.30, 1.00), with statusFactor = 1.00 for complete and 0.82 for partial_source_window.",
    stabilization:
      "stabilizedRecentAttackScore = historicalAttackScore*(1-r) + recentAttackScore*r and stabilizedRecentDefenseScore = historicalDefenseScore*(1-r) + recentDefenseScore*r, where r = sampleReliability.",
    finalBlend:
      "For each challenger weight w in {0.10, 0.20, 0.30, 0.40}, blendedAttackScore = historicalAttackScore*(1-w) + stabilizedRecentAttackScore*w and blendedDefenseScore = historicalDefenseScore*(1-w) + stabilizedRecentDefenseScore*w.",
    confidenceDiagnostic:
      "Flag a challenger confidence warning when confidence_score >= 75 and either the top 1X2 probability < 50 or the leading scoreline probability < 14.",
    timeSafeEvaluation:
      "Historical evaluation is allowed only when sourceSnapshotDate is strictly earlier than fixture kickoff date and predictionCreatedAt is strictly earlier than fixture kickoff timestamp.",
  };
}

function buildMarkdownReport(report: Record<string, unknown>) {
  const data = report as {
    branch: string;
    asOfIso: string;
    verdict: string;
    recommendedChallenger: string | null;
    limitations: string[];
    shadowFixtureCount: number;
    futureVariantSummaries: Array<{
      variantKey: string;
      favoriteChanges: number;
      averageHomeWinDelta: number | null;
      averageDrawDelta: number | null;
      averageAwayWinDelta: number | null;
      averageTotalExpectedGoalsDelta: number | null;
      confidenceWarningCount: number;
    }>;
  };

  return [
    "# Recent Form Challenger v1",
    "",
    `- asOfIso: ${data.asOfIso}`,
    `- branch: ${data.branch}`,
    `- verdict: ${data.verdict}`,
    `- recommendedChallenger: ${data.recommendedChallenger ?? "none"}`,
    `- shadowFixtureCount: ${data.shadowFixtureCount}`,
    "",
    "## Limitations",
    ...data.limitations.map((item) => `- ${item}`),
    "",
    "## Future Shadow Summary",
    ...data.futureVariantSummaries.map((summary) =>
      `- ${summary.variantKey}: favoriteChanges=${summary.favoriteChanges}, avgHomeWinDelta=${formatMaybeNumber(summary.averageHomeWinDelta)}, avgDrawDelta=${formatMaybeNumber(summary.averageDrawDelta)}, avgAwayWinDelta=${formatMaybeNumber(summary.averageAwayWinDelta)}, avgTotalXgDelta=${formatMaybeNumber(summary.averageTotalExpectedGoalsDelta)}, confidenceWarnings=${summary.confidenceWarningCount}`,
    ),
    "",
    "## Artifact",
    `- JSON: ${path.relative(ROOT, JSON_ARTIFACT_PATH)}`,
    `- Markdown: ${path.relative(ROOT, MARKDOWN_ARTIFACT_PATH)}`,
    "",
  ].join("\n");
}

function main() {
  const { asOfIso } = parseArgs(process.argv.slice(2));
  const sourceSnapshot = readSourceSnapshot();
  const diagnosticsByTeamKey = buildRecentFormChallengerCatalog({
    sourceSnapshot,
    baselineSnapshots: CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
  });
  const baselineByTeamKey = new Map(CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS.map((snapshot) => [snapshot.teamKey, snapshot]));
  const teamLookup = buildTeamLookup();
  const remainingFixtures = getWorldCup2026SecondMatchdayFixtures().filter((fixture) => isFutureShadowEligibleFixture(fixture, asOfIso));
  const shadowRows = remainingFixtures.map((fixture) => {
    const homeBaselineSnapshot = baselineByTeamKey.get(fixture.homeTeamKey);
    const awayBaselineSnapshot = baselineByTeamKey.get(fixture.awayTeamKey);
    const homeDiagnostics = diagnosticsByTeamKey.get(fixture.homeTeamKey);
    const awayDiagnostics = diagnosticsByTeamKey.get(fixture.awayTeamKey);

    if (!homeBaselineSnapshot || !awayBaselineSnapshot || !homeDiagnostics || !awayDiagnostics) {
      throw new Error(`Missing baseline or challenger diagnostics for fixture ${fixture.fixtureKey}.`);
    }

    const baseline = generatePrediction(
      buildBaselinePredictionInput({
        fixture,
        homeBaselineSnapshot,
        awayBaselineSnapshot,
      }),
    );
    const variants = Object.fromEntries(
      RECENT_FORM_CHALLENGER_VARIANTS.map((variant) => [
        variant.key,
        generatePrediction(
          buildRecentFormChallengerPredictionInput({
            fixture,
            homeBaselineSnapshot,
            awayBaselineSnapshot,
            homeDiagnostics,
            awayDiagnostics,
            variantKey: variant.key,
          }),
        ),
      ]),
    );

    return {
      fixture,
      homeBaselineSnapshot,
      awayBaselineSnapshot,
      baseline,
      variants,
    };
  });

  const futureVariantSummaries = RECENT_FORM_CHALLENGER_VARIANTS.map((variant) =>
    summarizeFutureVariant({
      variantKey: variant.key,
      rows: shadowRows.map((row) => ({
        fixtureKey: row.fixture.fixtureKey,
        homeTeamKey: row.fixture.homeTeamKey,
        awayTeamKey: row.fixture.awayTeamKey,
        baseline: row.baseline,
        challenger: row.variants[variant.key as keyof typeof row.variants] as ReturnType<typeof generatePrediction>,
      })),
    }),
  );

  const historicalLimitations = [
    `Only one tracked source snapshot is available locally at ${path.relative(ROOT, SOURCE_SNAPSHOT_PATH)}.`,
    "No repo-local historical prediction archive with verified results and provable pre-kickoff timestamps was used in this run.",
    "Because the available tracked snapshot date is 2026-06-19, completed fixtures before or on that date cannot be backtested time-safely from the currently stored local artifacts.",
  ];
  const emptyHistoricalSummary = evaluateChallengerVariantPerformance({ rows: [] });
  const germanyVsIvoryCoastBreakdown = buildGermanyVsIvoryCoastBreakdown({
    diagnosticsByTeamKey,
  });

  const report = {
    schemaVersion: "recent-form-challenger-v1",
    branch: "feature/recent-form-challenger-v1",
    asOfIso,
    sourceSnapshotDate: sourceSnapshot.snapshotDate,
    formulas: buildFormulas(),
    artifactPaths: {
      json: path.relative(ROOT, JSON_ARTIFACT_PATH),
      markdown: path.relative(ROOT, MARKDOWN_ARTIFACT_PATH),
    },
    baselineUnchanged: true,
    databaseModified: false,
    publishedPredictionsModified: false,
    shadowFixtureCount: shadowRows.length,
    futureShadowFixtures: shadowRows.map((row) => ({
      fixtureKey: row.fixture.fixtureKey,
      matchNumber: row.fixture.matchNumber,
      kickoffAt: row.fixture.kickoffAt,
      homeTeam: teamLookup.get(row.fixture.homeTeamKey)?.displayName ?? row.fixture.homeTeamKey,
      awayTeam: teamLookup.get(row.fixture.awayTeamKey)?.displayName ?? row.fixture.awayTeamKey,
      baseline: {
        homeWin: row.baseline.probabilities.oneXTwo.homeWin,
        draw: row.baseline.probabilities.oneXTwo.draw,
        awayWin: row.baseline.probabilities.oneXTwo.awayWin,
        bttsYes: row.baseline.probabilities.btts.yes,
        over25: row.baseline.probabilities.overUnder25.over,
        expectedHomeGoals: row.baseline.expectedGoals.home,
        expectedAwayGoals: row.baseline.expectedGoals.away,
        confidence: row.baseline.confidence,
        risk: row.baseline.risk,
        mostLikelyScore: row.baseline.mostLikelyScore,
      },
      challengers: Object.fromEntries(
        RECENT_FORM_CHALLENGER_VARIANTS.map((variant) => {
          const challenger = row.variants[variant.key as keyof typeof row.variants] as ReturnType<typeof generatePrediction>;
          return [
            variant.key,
            {
              homeWin: challenger.probabilities.oneXTwo.homeWin,
              draw: challenger.probabilities.oneXTwo.draw,
              awayWin: challenger.probabilities.oneXTwo.awayWin,
              bttsYes: challenger.probabilities.btts.yes,
              over25: challenger.probabilities.overUnder25.over,
              expectedHomeGoals: challenger.expectedGoals.home,
              expectedAwayGoals: challenger.expectedGoals.away,
              confidence: challenger.confidence,
              risk: challenger.risk,
              mostLikelyScore: challenger.mostLikelyScore,
              deltasVsBaseline: {
                homeWin: round(challenger.probabilities.oneXTwo.homeWin - row.baseline.probabilities.oneXTwo.homeWin, 4),
                draw: round(challenger.probabilities.oneXTwo.draw - row.baseline.probabilities.oneXTwo.draw, 4),
                awayWin: round(challenger.probabilities.oneXTwo.awayWin - row.baseline.probabilities.oneXTwo.awayWin, 4),
                bttsYes: round(challenger.probabilities.btts.yes - row.baseline.probabilities.btts.yes, 4),
                over25: round(challenger.probabilities.overUnder25.over - row.baseline.probabilities.overUnder25.over, 4),
                expectedHomeGoals: round(challenger.expectedGoals.home - row.baseline.expectedGoals.home, 4),
                expectedAwayGoals: round(challenger.expectedGoals.away - row.baseline.expectedGoals.away, 4),
              },
              confidenceSupportWarning: findConfidenceSupportWarning(challenger),
            },
          ];
        }),
      ),
    })),
    teamDiagnostics: Object.fromEntries(
      [...diagnosticsByTeamKey.entries()].map(([teamKey, diagnostics]) => [teamKey, diagnostics]),
    ),
    germanyVsIvoryCoastBreakdown,
    historicalEvaluation: {
      status: "insufficient_evidence",
      limitations: historicalLimitations,
      baseline: emptyHistoricalSummary,
      challengers: Object.fromEntries(
        RECENT_FORM_CHALLENGER_VARIANTS.map((variant) => [variant.key, emptyHistoricalSummary]),
      ),
    },
    limitations: historicalLimitations,
    futureVariantSummaries,
    recommendedChallenger: null,
    safeForShadowReviewOnly: RECENT_FORM_CHALLENGER_VARIANTS.map((variant) => variant.key),
    blockers: [
      "No fully time-safe historical backtest can be proven from the currently stored local source snapshot inventory.",
    ],
    verdict: "INSUFFICIENT_EVIDENCE",
  };

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(JSON_ARTIFACT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_ARTIFACT_PATH, `${buildMarkdownReport(report)}\n`);

  process.stdout.write(
    [
      `Wrote ${path.relative(ROOT, JSON_ARTIFACT_PATH)}`,
      `Wrote ${path.relative(ROOT, MARKDOWN_ARTIFACT_PATH)}`,
      `Shadow fixtures: ${shadowRows.length}`,
      `Verdict: ${report.verdict}`,
    ].join("\n") + "\n",
  );
}

main();
