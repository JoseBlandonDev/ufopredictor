import fs from "node:fs";
import path from "node:path";

import { fetchApiFootballFixturesByLeague } from "../football-api/api-football-client.ts";
import { buildScoreMatrix, poissonProbability } from "../prediction-engine/poisson.ts";
import { createSupabaseScriptAdminClient } from "../supabase/script-admin.ts";
import { buildTask1_2Coverage, type ReplayCoverageManifestEntryV2 } from "./task1-2.ts";
import {
  buildPredictionIntelligenceV2ReplayInput,
  canonicalizeHistoricalFactForReplay,
  findOfficialScheduleMatchByTeams,
  loadTask1Datasets,
  matchProviderFixture,
  resolveHistoricalFactComparableKickoffAt,
  type CanonicalTeamAlias,
  type CanonicalTeamLocalization,
  type HistoricalMatchFact,
  type PreparedPaths,
  type RatingSnapshotRow,
  type TeamSignalSnapshot,
  type WorldCupScheduleMatch,
  type WorldCupVenue,
} from "./task1.ts";
import {
  loadProductReplayInventory,
  reconcileFinishedFixtures,
  type ProductReplayInventory,
} from "./task1-1.ts";

type SupportedLocale = "en" | "es";
type MatchOutcomeKey = "home" | "draw" | "away";

export type Task2ModelCandidateConfig = {
  key: string;
  label: string;
  calibrationVersion: string;
  modelFamily?: "legacy_formula" | "v1_baseline" | "bounded_hybrid";
  effectiveStrengthWeights: {
    structural: number;
    recentForm: number;
    tournamentForm: number;
    attack: number;
    defense: number;
    expectation: number;
    reliability: number;
  };
  expectedGoalDifference: {
    structuralGap: number;
    recentGap: number;
    tournamentGap: number;
    attackDefenseGap: number;
    expectationGap: number;
    reliabilityTilt: number;
  };
  expectedTotalGoals: {
    base: number;
    combinedAttack: number;
    combinedDefense: number;
    combinedOpenPlay: number;
    combinedTournamentOpenPlay: number;
    favoriteControl: number;
    reliabilityDrag: number;
  };
  drawLift: number;
  maxGoals: number;
  hybridAdjustments?: {
    structuralDisagreement: number;
    recentForm: number;
    attack: number;
    defense: number;
    opponentAdjustment: number;
    tournamentForm: number;
    venueContext: number;
  };
  reliabilityShrinkage?: {
    base: number;
    recentFormMultiplier: number;
    tournamentMultiplier: number;
  };
  boundedCaps?: {
    expectedGoalDifferenceDelta: number;
    expectedTotalGoalsDelta: number;
    oneXTwoDelta: number;
  };
};

export type TeamFeatureVector = {
  teamKey: string;
  displayNameEn: string;
  displayNameEs: string;
  cutoffAt: string;
  sourceSnapshotIds: string[];
  structuralStrength: {
    eloAtCutoff: number | null;
    eloPercentile: number | null;
    eloRank: number | null;
    fifaPoints: number | null;
    fifaRank: number | null;
    start2026Elo: number | null;
    ytdEloMovement: number | null;
    fifaEloAgreement: number | null;
    fifaEloDisagreement: number | null;
  };
  recentForm: {
    last5: { wins: number; draws: number; losses: number };
    last10: { wins: number; draws: number; losses: number };
    last20: { wins: number; draws: number; losses: number };
    goalsForPerMatch: number | null;
    goalsAgainstPerMatch: number | null;
    scoringMatchRate: number | null;
    failedToScoreRate: number | null;
    cleanSheetRate: number | null;
    bttsRate: number | null;
    over25Rate: number | null;
    under25Rate: number | null;
    twoPlusScoredRate: number | null;
    twoPlusConcededRate: number | null;
    volatility: number | null;
    recencyWeightedForm: number | null;
  };
  opponentAdjustment: {
    averageOpponentPreMatchElo: number | null;
    strengthOfSchedule: number | null;
    performanceVsEloExpectation: number | null;
    qualityWins: number;
    badLosses: number;
    officialMatchRate: number | null;
    friendlyMatchRate: number | null;
    neutralMatchRate: number | null;
    homeMatchRate: number | null;
    awayMatchRate: number | null;
    crossConfederationPerformance: number | null;
  };
  currentWorldCupForm: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    scoringRate: number | null;
    cleanSheetRate: number | null;
    failedToScoreRate: number | null;
    averageOpponentElo: number | null;
    performanceVsExpectation: number | null;
    tournamentOverperformance: number | null;
    reliabilityShrink: number;
  };
  reliability: {
    sampleSize: number;
    sourceCoverage: number;
    eloResolutionReliability: number;
    fifaAvailability: number;
    datePrecision: number;
    contradictionFlags: string[];
  };
  subScores: {
    baselineStrength: number;
    recentForm: number;
    tournamentForm: number;
    attack: number;
    defense: number;
    performanceVsExpectation: number;
    reliability: number;
  };
  missingOptionalSignals: string[];
};

export type MatchFeatureVector = {
  fixtureId: string;
  cutoffAt: string;
  homeTeamKey: string;
  awayTeamKey: string;
  home: TeamFeatureVector;
  away: TeamFeatureVector;
  derived: {
    structuralGap: number;
    recentGap: number;
    tournamentGap: number;
    attackDefenseGap: number;
    expectationGap: number;
    favoriteSide: MatchOutcomeKey;
    favoriteStrengthGap: number;
    combinedAttackIntent: number;
    combinedDefensiveResistance: number;
    combinedOpenPlay: number;
    combinedTournamentOpenPlay: number;
    reliabilityAverage: number;
    venueContext: {
      fixtureContext: "home" | "away" | "neutral";
      appliesTo: "home" | "away" | null;
      venueCountryCode: string | null;
      hostTeamKey: string | null;
      reasonCode:
        | "neutral_by_default"
        | "world_cup_neutral_override"
        | "host_country_match"
        | "non_world_cup_no_adjustment";
    };
  };
};

export type PredictionAdjustmentAudit = {
  v1ExpectedGoalDifference: number;
  v1ExpectedTotalGoals: number;
  signalAdjustments: {
    structuralDisagreement: number;
    recentForm: number;
    attack: number;
    defense: number;
    opponentAdjustment: number;
    tournamentForm: number;
    venueContext: number;
    reliabilityShrinkage: number;
  };
  finalExpectedGoalDifference: number;
  finalExpectedTotalGoals: number;
  capsApplied: string[];
};

export type ScenarioObject = {
  scenarioType: string;
  familyCode: string;
  representativeScore: { home: number; away: number };
  exactScoreProbability: number;
  familyProbability: number;
  supportingReasonCodes: string[];
  contradictingReasonCodes: string[];
  requiredMatchScriptCodes: string[];
  riskLevel: "low" | "medium" | "high";
  reliability: number;
  relatedScorelines: Array<{
    home: number;
    away: number;
    probability: number;
  }>;
};

export type ExplanationPreview = {
  locale: SupportedLocale;
  summary: string;
  scenarioLines: string[];
  reasonLines: string[];
};

export type ChallengerPrediction = {
  modelVersion: string;
  candidateKey: string;
  cutoffAt: string;
  expectedGoals: {
    home: number;
    away: number;
    total: number;
    difference: number;
  };
  probabilities: {
    oneXTwo: {
      homeWin: number;
      draw: number;
      awayWin: number;
    };
    btts: {
      yes: number;
      no: number;
    };
    overUnder25: {
      over: number;
      under: number;
    };
  };
  scoreMatrix: Array<{
    homeGoals: number;
    awayGoals: number;
    probability: number;
  }>;
  scoreMatrixTailMass: number;
  topScorelines: Array<{
    score: string;
    homeGoals: number;
    awayGoals: number;
    probability: number;
  }>;
  mostLikelyScore: string;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  scenarios: ScenarioObject[];
  additionalPlausibleScorelines: Array<{
    score: string;
    homeGoals: number;
    awayGoals: number;
    probability: number;
  }>;
  evidenceBundle: {
    homeSubScores: TeamFeatureVector["subScores"];
    awaySubScores: TeamFeatureVector["subScores"];
    reasonCodes: string[];
    contradictingReasonCodes: string[];
    sourceSnapshotIds: string[];
  };
  explanationPreviews: Record<SupportedLocale, ExplanationPreview>;
  internalAudit?: PredictionAdjustmentAudit;
};

export type Task2SplitManifest = {
  split: "training" | "validation" | "holdout";
  rowCount: number;
  teamsCovered: string[];
  rows: Array<{
    fixtureId: string;
    source: "historical_fact" | "world_cup_product";
    homeTeamKey: string;
    awayTeamKey: string;
    cutoffAt: string;
    matchDate: string;
    officialMatchNumber: number | null;
    naturalMatchKey: string | null;
    datePrecision: "exact" | "date";
  }>;
  adjustmentNote: string | null;
};

type ProductPredictionRow = {
  id: string;
  match_id: string;
  model_version_id: string;
  prediction_type: "pre_match_24h" | "pre_match_6h" | "post_lineup" | "pre_kickoff";
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  most_likely_score: string;
  top_scores_json: unknown;
  confidence_score: number;
  risk_level: "low" | "medium" | "high";
  run_scope: "public_product" | "internal_lab";
  created_at: string;
};

type ProductPredictionMarketRow = {
  prediction_version_id: string;
  market: string;
  selection: string;
  probability: number;
};

type ReplayFixtureRecord = {
  fixtureId: string;
  productMatchId: string;
  officialMatchNumber: number | null;
  apiFootballFixtureId: number | null;
  kickoffAt: string;
  homeTeamKey: string;
  awayTeamKey: string;
  homeNameEn: string;
  awayNameEn: string;
  homeNameEs: string;
  awayNameEs: string;
  sourceSnapshotIds: string[];
  homeSignal: TeamSignalSnapshot;
  awaySignal: TeamSignalSnapshot;
  actual: {
    homeGoals: number;
    awayGoals: number;
    score: string;
    outcome: MatchOutcomeKey;
  };
  originalPrediction: ProductPredictionRow;
  originalMarkets: ProductPredictionMarketRow[];
};

type RefreshResultLike = {
  provider_fixture_id: number;
  official_match_number: number | null;
  provider_score: {
    home: number | null;
    away: number | null;
  };
};

type FutureFixtureRecord = {
  productMatchId: string;
  apiFootballFixtureId: number | null;
  officialMatchNumber: number | null;
  kickoffAt: string;
  homeTeamKey: string;
  awayTeamKey: string;
  homeNameEn: string;
  awayNameEn: string;
  homeNameEs: string;
  awayNameEs: string;
  venue: WorldCupVenue | null;
  sourceSnapshotIds: string[];
  homeSignal: TeamSignalSnapshot;
  awaySignal: TeamSignalSnapshot;
  originalPrediction: ProductPredictionRow | null;
  originalMarkets: ProductPredictionMarketRow[];
};

type PredictionLike = {
  homeWin: number;
  draw: number;
  awayWin: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  mostLikelyScore: string;
  topScorelines: Array<{ score: string; probability: number }>;
  bttsYes: number | null;
  bttsNo: number | null;
  over25: number | null;
  under25: number | null;
  scoreMatrixTailMass: number | null;
  scoreMatrixSource?: "stored_top_scores" | "reconstructed_from_xg";
};

export type CandidateReplayEvaluation = {
  candidate: Task2ModelCandidateConfig;
  validationMetrics: ReplayMetricSummary;
  selectionAudit: {
    multiclassBrier: number | null;
    brierFromBest: number | null;
    withinBrierTolerance: boolean;
    logLoss: number | null;
    logLossFromBestWithinToleranceSet: number | null;
    withinLogLossTolerance: boolean;
    totalGoalsMae: number | null;
    goalDifferenceMae: number | null;
    outcomeAccuracy: number | null;
    favoriteAccuracy: number | null;
    tieBreakOrder: number[];
    validationSelectionScore: number | null;
  };
};

export type ReplayMetricSummary = {
  fixtureCount: number;
  oneXTwo: {
    multiclassBrier: number | null;
    logLoss: number | null;
    outcomeAccuracy: number | null;
    favoriteAccuracy: number | null;
    calibrationByBucket: Array<{
      bucket: string;
      fixtureCount: number;
      averagePredicted: number | null;
      actualHitRate: number | null;
    }>;
  };
  goalsAndMarkets: {
    totalGoalsMae: number | null;
    goalDifferenceMae: number | null;
    bttsBrier: number | null;
    bttsAccuracy: number | null;
    over25Brier: number | null;
    over25Accuracy: number | null;
  };
  scoreDistribution: {
    exactScoreTop1Coverage: number | null;
    exactScoreTop3Coverage: number | null;
    exactScoreTop5Coverage: number | null;
    actualScoreProbability: number | null;
    scoreMatrixTailMass: number | null;
  };
};

export const MODEL_2_CANDIDATES: Task2ModelCandidateConfig[] = [
  {
    key: "baseline_compatible_v2",
    label: "Baseline-compatible v2",
    calibrationVersion: "task2-calibration-v1",
    modelFamily: "legacy_formula",
    effectiveStrengthWeights: {
      structural: 0.4,
      recentForm: 0.2,
      tournamentForm: 0.1,
      attack: 0.1,
      defense: 0.1,
      expectation: 0.05,
      reliability: 0.05,
    },
    expectedGoalDifference: {
      structuralGap: 1.2,
      recentGap: 0.5,
      tournamentGap: 0.28,
      attackDefenseGap: 0.45,
      expectationGap: 0.32,
      reliabilityTilt: 0.18,
    },
    expectedTotalGoals: {
      base: 2.35,
      combinedAttack: 0.55,
      combinedDefense: 0.22,
      combinedOpenPlay: 0.42,
      combinedTournamentOpenPlay: 0.18,
      favoriteControl: -0.12,
      reliabilityDrag: -0.12,
    },
    drawLift: 0.02,
    maxGoals: 8,
  },
  {
    key: "model_2_full",
    label: "Model 2.0 full",
    calibrationVersion: "task2-calibration-v1",
    modelFamily: "legacy_formula",
    effectiveStrengthWeights: {
      structural: 0.3,
      recentForm: 0.2,
      tournamentForm: 0.15,
      attack: 0.12,
      defense: 0.1,
      expectation: 0.08,
      reliability: 0.05,
    },
    expectedGoalDifference: {
      structuralGap: 1,
      recentGap: 0.62,
      tournamentGap: 0.4,
      attackDefenseGap: 0.58,
      expectationGap: 0.42,
      reliabilityTilt: 0.15,
    },
    expectedTotalGoals: {
      base: 2.38,
      combinedAttack: 0.62,
      combinedDefense: 0.16,
      combinedOpenPlay: 0.52,
      combinedTournamentOpenPlay: 0.22,
      favoriteControl: -0.1,
      reliabilityDrag: -0.14,
    },
    drawLift: 0.015,
    maxGoals: 8,
  },
  {
    key: "structural_only_ablation",
    label: "Structural-only ablation",
    calibrationVersion: "task2-calibration-v1",
    modelFamily: "legacy_formula",
    effectiveStrengthWeights: {
      structural: 0.72,
      recentForm: 0.08,
      tournamentForm: 0.04,
      attack: 0.06,
      defense: 0.05,
      expectation: 0.03,
      reliability: 0.02,
    },
    expectedGoalDifference: {
      structuralGap: 1.35,
      recentGap: 0.15,
      tournamentGap: 0.08,
      attackDefenseGap: 0.22,
      expectationGap: 0.15,
      reliabilityTilt: 0.08,
    },
    expectedTotalGoals: {
      base: 2.28,
      combinedAttack: 0.38,
      combinedDefense: 0.18,
      combinedOpenPlay: 0.22,
      combinedTournamentOpenPlay: 0.08,
      favoriteControl: -0.16,
      reliabilityDrag: -0.1,
    },
    drawLift: 0.03,
    maxGoals: 8,
  },
  {
    key: "recent_tournament_emphasis",
    label: "Recent+tournament emphasis",
    calibrationVersion: "task2-calibration-v1",
    modelFamily: "legacy_formula",
    effectiveStrengthWeights: {
      structural: 0.24,
      recentForm: 0.24,
      tournamentForm: 0.18,
      attack: 0.12,
      defense: 0.1,
      expectation: 0.08,
      reliability: 0.04,
    },
    expectedGoalDifference: {
      structuralGap: 0.85,
      recentGap: 0.72,
      tournamentGap: 0.46,
      attackDefenseGap: 0.58,
      expectationGap: 0.44,
      reliabilityTilt: 0.14,
    },
    expectedTotalGoals: {
      base: 2.42,
      combinedAttack: 0.66,
      combinedDefense: 0.15,
      combinedOpenPlay: 0.58,
      combinedTournamentOpenPlay: 0.28,
      favoriteControl: -0.08,
      reliabilityDrag: -0.14,
    },
    drawLift: 0.01,
    maxGoals: 8,
  },
] as const;

export const TASK2_1_CANDIDATES: Task2ModelCandidateConfig[] = [
  {
    key: "v1_compatible_baseline",
    label: "V1-compatible baseline",
    calibrationVersion: "task2-1-calibration-v1",
    modelFamily: "v1_baseline",
    effectiveStrengthWeights: {
      structural: 0.5,
      recentForm: 0.15,
      tournamentForm: 0.05,
      attack: 0.1,
      defense: 0.1,
      expectation: 0.05,
      reliability: 0.05,
    },
    expectedGoalDifference: {
      structuralGap: 1.05,
      recentGap: 0.3,
      tournamentGap: 0.12,
      attackDefenseGap: 0.2,
      expectationGap: 0.18,
      reliabilityTilt: 0.08,
    },
    expectedTotalGoals: {
      base: 2.38,
      combinedAttack: 0.4,
      combinedDefense: 0.18,
      combinedOpenPlay: 0.24,
      combinedTournamentOpenPlay: 0.06,
      favoriteControl: -0.08,
      reliabilityDrag: -0.1,
    },
    drawLift: 0.01,
    maxGoals: 8,
  },
  MODEL_2_CANDIDATES.find((candidate) => candidate.key === "structural_only_ablation")!,
  {
    key: "v1_plus_bounded_signals",
    label: "V1 plus bounded signals",
    calibrationVersion: "task2-1-calibration-v1",
    modelFamily: "bounded_hybrid",
    effectiveStrengthWeights: {
      structural: 0.5,
      recentForm: 0.15,
      tournamentForm: 0.08,
      attack: 0.1,
      defense: 0.08,
      expectation: 0.05,
      reliability: 0.04,
    },
    expectedGoalDifference: {
      structuralGap: 1.05,
      recentGap: 0.3,
      tournamentGap: 0.12,
      attackDefenseGap: 0.2,
      expectationGap: 0.18,
      reliabilityTilt: 0.08,
    },
    expectedTotalGoals: {
      base: 2.38,
      combinedAttack: 0.4,
      combinedDefense: 0.18,
      combinedOpenPlay: 0.24,
      combinedTournamentOpenPlay: 0.06,
      favoriteControl: -0.08,
      reliabilityDrag: -0.1,
    },
    drawLift: 0.01,
    maxGoals: 8,
    hybridAdjustments: {
      structuralDisagreement: 0.28,
      recentForm: 0.36,
      attack: 0.18,
      defense: 0.16,
      opponentAdjustment: 0.2,
      tournamentForm: 0.18,
      venueContext: 0.14,
    },
    reliabilityShrinkage: {
      base: 0.55,
      recentFormMultiplier: 0.28,
      tournamentMultiplier: 0.17,
    },
    boundedCaps: {
      expectedGoalDifferenceDelta: 0.42,
      expectedTotalGoalsDelta: 0.36,
      oneXTwoDelta: 0.1,
    },
  },
  {
    key: "v1_plus_bounded_signals_conservative",
    label: "V1 plus bounded signals conservative",
    calibrationVersion: "task2-1-calibration-v1",
    modelFamily: "bounded_hybrid",
    effectiveStrengthWeights: {
      structural: 0.5,
      recentForm: 0.15,
      tournamentForm: 0.08,
      attack: 0.1,
      defense: 0.08,
      expectation: 0.05,
      reliability: 0.04,
    },
    expectedGoalDifference: {
      structuralGap: 1.05,
      recentGap: 0.3,
      tournamentGap: 0.12,
      attackDefenseGap: 0.2,
      expectationGap: 0.18,
      reliabilityTilt: 0.08,
    },
    expectedTotalGoals: {
      base: 2.38,
      combinedAttack: 0.4,
      combinedDefense: 0.18,
      combinedOpenPlay: 0.24,
      combinedTournamentOpenPlay: 0.06,
      favoriteControl: -0.08,
      reliabilityDrag: -0.1,
    },
    drawLift: 0.012,
    maxGoals: 8,
    hybridAdjustments: {
      structuralDisagreement: 0.2,
      recentForm: 0.24,
      attack: 0.12,
      defense: 0.1,
      opponentAdjustment: 0.14,
      tournamentForm: 0.1,
      venueContext: 0.12,
    },
    reliabilityShrinkage: {
      base: 0.42,
      recentFormMultiplier: 0.2,
      tournamentMultiplier: 0.12,
    },
    boundedCaps: {
      expectedGoalDifferenceDelta: 0.28,
      expectedTotalGoalsDelta: 0.24,
      oneXTwoDelta: 0.07,
    },
  },
];

const MODEL_VERSION = "prediction-intelligence-v2-model-2.0-challenger";
const VALIDATION_CUTOFF = "2026-06-11T00:00:00Z";
const HOST_COUNTRY_CODES = new Set(["CAN", "MEX", "USA"]);
const HOST_COUNTRY_CODE_EQUIVALENTS: Record<string, string> = {
  CA: "CAN",
  CAN: "CAN",
  MX: "MEX",
  MEX: "MEX",
  US: "USA",
  USA: "USA",
};
const WORLD_CUP_TEAM_SET = new Set([
  "mexico", "south_africa", "south_korea", "czechia", "canada", "bosnia_and_herzegovina", "united_states",
  "paraguay", "australia", "turkiye", "qatar", "switzerland", "brazil", "morocco", "haiti", "scotland",
  "germany", "curacao", "netherlands", "japan", "ivory_coast", "ecuador", "sweden", "tunisia", "spain",
  "cape_verde", "belgium", "egypt", "saudi_arabia", "uruguay", "iran", "new_zealand", "austria", "jordan",
  "france", "senegal", "iraq", "norway", "argentina", "algeria", "portugal", "dr_congo", "england",
  "croatia", "ghana", "panama", "uzbekistan", "colombia",
]);
const CONFEDERATION_BY_TEAM_KEY: Record<string, string> = {
  mexico: "concacaf",
  south_africa: "caf",
  south_korea: "afc",
  czechia: "uefa",
  canada: "concacaf",
  bosnia_and_herzegovina: "uefa",
  united_states: "concacaf",
  paraguay: "conmebol",
  australia: "afc",
  turkiye: "uefa",
  qatar: "afc",
  switzerland: "uefa",
  brazil: "conmebol",
  morocco: "caf",
  haiti: "concacaf",
  scotland: "uefa",
  germany: "uefa",
  curacao: "concacaf",
  netherlands: "uefa",
  japan: "afc",
  ivory_coast: "caf",
  ecuador: "conmebol",
  sweden: "uefa",
  tunisia: "caf",
  spain: "uefa",
  cape_verde: "caf",
  belgium: "uefa",
  egypt: "caf",
  saudi_arabia: "afc",
  uruguay: "conmebol",
  iran: "afc",
  new_zealand: "ofc",
  austria: "uefa",
  jordan: "afc",
  france: "uefa",
  senegal: "caf",
  iraq: "afc",
  norway: "uefa",
  argentina: "conmebol",
  algeria: "caf",
  portugal: "uefa",
  dr_congo: "caf",
  england: "uefa",
  croatia: "uefa",
  ghana: "caf",
  panama: "concacaf",
  uzbekistan: "afc",
  colombia: "conmebol",
};

function ensureDirectory(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath: string, payload: unknown) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function writeText(filePath: string, payload: string) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, payload, "utf8");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: Array<number | null | undefined>, digits = 4): number | null {
  const numeric = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (numeric.length === 0) {
    return null;
  }
  return round(numeric.reduce((total, value) => total + value, 0) / numeric.length, digits);
}

function rate(numerator: number, denominator: number, digits = 4) {
  if (denominator <= 0) {
    return null;
  }
  return round(numerator / denominator, digits);
}

function normalizeIdentity(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseScore(score: string) {
  const match = /^(\d+)-(\d+)$/.exec(score);
  if (!match) {
    return null;
  }
  return {
    homeGoals: Number(match[1]),
    awayGoals: Number(match[2]),
  };
}

function outcomeFromGoals(homeGoals: number, awayGoals: number): MatchOutcomeKey {
  if (homeGoals > awayGoals) {
    return "home";
  }
  if (awayGoals > homeGoals) {
    return "away";
  }
  return "draw";
}

function compareByProbability<T extends { probability: number }>(left: T, right: T) {
  return right.probability - left.probability;
}

export function buildHistoricalReplayCutoff(fact: HistoricalMatchFact, scheduleRows: WorldCupScheduleMatch[]) {
  const canonical = canonicalizeHistoricalFactForReplay(fact, scheduleRows);
  const exactMatch = scheduleRows.find(
    (row) =>
      row.scheduled_date_et === canonical.match_date &&
      row.home_team_key === canonical.team_1_key &&
      row.away_team_key === canonical.team_2_key,
  );
  if (exactMatch) {
    return {
      cutoffAt: exactMatch.scheduled_at_utc,
      datePrecision: "exact" as const,
    };
  }
  return {
    cutoffAt: `${fact.match_date}T00:00:00Z`,
    datePrecision: "date" as const,
  };
}

type TeamMatchPerspective = {
  fact: HistoricalMatchFact;
  teamKey: string;
  opponentKey: string;
  goalsFor: number;
  goalsAgainst: number;
  matchDate: string;
  comparableKickoffAt: string;
  competitionKey: string;
  official: boolean;
  venueContext: "home" | "away" | "neutral";
  preMatchElo: number | null;
  opponentPreMatchElo: number | null;
  expectedResult: number | null;
  actualResult: number;
};

function buildExpectedResult(preMatchElo: number | null, opponentElo: number | null) {
  if (preMatchElo == null || opponentElo == null) {
    return null;
  }
  return 1 / (1 + 10 ** ((opponentElo - preMatchElo) / 400));
}

function isOfficialCompetition(competitionKey: string) {
  return competitionKey !== "friendly" && competitionKey !== "friendly_tournament";
}

function buildLocalizationCountryIndex(localizations: CanonicalTeamLocalization[]) {
  return new Map(
    localizations.map((entry) => [
      entry.canonical_team_key,
      entry.iso_alpha3?.toUpperCase() ?? entry.fifa_code?.toUpperCase() ?? null,
    ]),
  );
}

function resolveHostContextForFixture(args: {
  homeTeamKey: string;
  awayTeamKey: string;
  venueCountryCode: string | null;
  localizations: CanonicalTeamLocalization[];
}) {
  const countryByTeam = buildLocalizationCountryIndex(args.localizations);
  const venueCountry = args.venueCountryCode?.toUpperCase() ?? null;
  const normalizedVenueCountry = venueCountry == null ? null : HOST_COUNTRY_CODE_EQUIVALENTS[venueCountry] ?? venueCountry;
  if (!normalizedVenueCountry || !HOST_COUNTRY_CODES.has(normalizedVenueCountry)) {
    return {
      fixtureContext: "neutral" as const,
      appliesTo: null,
      hostTeamKey: null,
      venueCountryCode: normalizedVenueCountry,
      reasonCode: "world_cup_neutral_override" as const,
    };
  }
  const homeCountry = countryByTeam.get(args.homeTeamKey) ?? null;
  if (homeCountry === normalizedVenueCountry) {
    return {
      fixtureContext: "home" as const,
      appliesTo: "home" as const,
      hostTeamKey: args.homeTeamKey,
      venueCountryCode: normalizedVenueCountry,
      reasonCode: "host_country_match" as const,
    };
  }
  const awayCountry = countryByTeam.get(args.awayTeamKey) ?? null;
  if (awayCountry === normalizedVenueCountry) {
    return {
      fixtureContext: "away" as const,
      appliesTo: "away" as const,
      hostTeamKey: args.awayTeamKey,
      venueCountryCode: normalizedVenueCountry,
      reasonCode: "host_country_match" as const,
    };
  }
  return {
    fixtureContext: "neutral" as const,
    appliesTo: null,
    hostTeamKey: null,
    venueCountryCode: normalizedVenueCountry,
    reasonCode: "world_cup_neutral_override" as const,
  };
}

function findScheduleMatchForFixture(args: {
  scheduleRows: WorldCupScheduleMatch[];
  officialMatchNumber?: number | null;
  homeTeamKey: string;
  awayTeamKey: string;
  matchDate?: string | null;
}) {
  if (args.officialMatchNumber != null) {
    return args.scheduleRows.find((row) => row.official_match_number === args.officialMatchNumber) ?? null;
  }
  const exactDateMatch =
    args.matchDate == null
      ? null
      : args.scheduleRows.find(
          (row) =>
            row.scheduled_date_et === args.matchDate &&
            row.home_team_key === args.homeTeamKey &&
            row.away_team_key === args.awayTeamKey,
        ) ?? null;
  if (exactDateMatch) {
    return exactDateMatch;
  }
  return findOfficialScheduleMatchByTeams(args.scheduleRows, args.homeTeamKey, args.awayTeamKey);
}

function inferVenueContext(
  fact: HistoricalMatchFact,
  teamKey: string,
  scheduleRows: WorldCupScheduleMatch[],
  localizations: CanonicalTeamLocalization[],
): "home" | "away" | "neutral" {
  const scheduleMatch = findScheduleMatchForFixture({
    scheduleRows,
    homeTeamKey: fact.team_1_key,
    awayTeamKey: fact.team_2_key,
    matchDate: fact.match_date,
  });
  if (scheduleMatch) {
    const hostContext = resolveHostContextForFixture({
      homeTeamKey: fact.team_1_key,
      awayTeamKey: fact.team_2_key,
      venueCountryCode: scheduleMatch.country_code,
      localizations,
    });
    if (hostContext.appliesTo == null) {
      return "neutral";
    }
    return (hostContext.hostTeamKey === teamKey ? "home" : "away");
  }
  const location = normalizeIdentity(fact.event_location_raw ?? "");
  const team1 = normalizeIdentity(fact.team_1_name_raw);
  const team2 = normalizeIdentity(fact.team_2_name_raw);
  if (!location) {
    return "neutral";
  }
  if (location === team1) {
    return fact.team_1_key === teamKey ? "home" : "away";
  }
  if (location === team2) {
    return fact.team_2_key === teamKey ? "home" : "away";
  }
  return "neutral";
}

function buildTeamPerspective(
  fact: HistoricalMatchFact,
  teamKey: string,
  scheduleRows: WorldCupScheduleMatch[],
  localizations: CanonicalTeamLocalization[],
): TeamMatchPerspective | null {
  const canonical = canonicalizeHistoricalFactForReplay(fact, scheduleRows);
  if (canonical.team_1_key !== teamKey && canonical.team_2_key !== teamKey) {
    return null;
  }
  const isTeam1 = canonical.team_1_key === teamKey;
  const goalsFor = isTeam1 ? canonical.score_1 : canonical.score_2;
  const goalsAgainst = isTeam1 ? canonical.score_2 : canonical.score_1;
  const preMatchElo = isTeam1 ? canonical.pre_match_elo_1 ?? maybePostMinusChange(canonical.post_match_elo_1, canonical.elo_change_1) : canonical.pre_match_elo_2 ?? maybePostMinusChange(canonical.post_match_elo_2, canonical.elo_change_2);
  const opponentPreMatchElo = isTeam1 ? canonical.pre_match_elo_2 ?? maybePostMinusChange(canonical.post_match_elo_2, canonical.elo_change_2) : canonical.pre_match_elo_1 ?? maybePostMinusChange(canonical.post_match_elo_1, canonical.elo_change_1);
  const actualResult = goalsFor > goalsAgainst ? 1 : goalsFor === goalsAgainst ? 0.5 : 0;
  return {
    fact: canonical,
    teamKey,
    opponentKey: isTeam1 ? canonical.team_2_key : canonical.team_1_key,
    goalsFor,
    goalsAgainst,
    matchDate: canonical.match_date,
    comparableKickoffAt: resolveHistoricalFactComparableKickoffAt(canonical, scheduleRows),
    competitionKey: canonical.competition_key,
    official: isOfficialCompetition(canonical.competition_key),
    venueContext: inferVenueContext(canonical, teamKey, scheduleRows, localizations),
    preMatchElo,
    opponentPreMatchElo,
    expectedResult: buildExpectedResult(preMatchElo, opponentPreMatchElo),
    actualResult,
  };
}

function maybePostMinusChange(postMatch: number | null, eloChange: number | null) {
  if (postMatch == null || eloChange == null) {
    return null;
  }
  return postMatch - eloChange;
}

function windowRecord(perspectives: TeamMatchPerspective[]) {
  return {
    wins: perspectives.filter((entry) => entry.goalsFor > entry.goalsAgainst).length,
    draws: perspectives.filter((entry) => entry.goalsFor === entry.goalsAgainst).length,
    losses: perspectives.filter((entry) => entry.goalsFor < entry.goalsAgainst).length,
  };
}

function buildWeightedAverage(values: Array<{ value: number; weight: number }>) {
  const totalWeight = values.reduce((total, entry) => total + entry.weight, 0);
  if (totalWeight <= 0) {
    return null;
  }
  return round(values.reduce((total, entry) => total + entry.value * entry.weight, 0) / totalWeight, 4);
}

function buildRecencyWeights(length: number) {
  if (length <= 1) {
    return [1];
  }
  const minimum = 0.45;
  const step = (1 - minimum) / (length - 1);
  return Array.from({ length }, (_, index) => round(1 - index * step, 4));
}

function buildLocalizationIndex(localizations: CanonicalTeamLocalization[]) {
  return new Map(localizations.map((entry) => [entry.canonical_team_key, entry]));
}

function buildAliasIndex(aliases: CanonicalTeamAlias[]) {
  const index = new Map<string, string[]>();
  for (const alias of aliases) {
    const current = index.get(alias.canonical_team_key) ?? [];
    current.push(alias.alias);
    index.set(alias.canonical_team_key, current);
  }
  return index;
}

function getLatestRatingBeforeCutoff(
  rows: RatingSnapshotRow[],
  teamKey: string,
  cutoffAt: string,
) {
  const cutoffDay = cutoffAt.slice(0, 10);
  return rows
    .filter((row) => row.canonical_team_key === teamKey)
    .filter((row) => row.effective_date < cutoffDay)
    .sort((left, right) => left.effective_date.localeCompare(right.effective_date))
    .at(-1) ?? null;
}

function getLatestFifaBeforeCutoff(
  rows: RatingSnapshotRow[],
  teamKey: string,
  cutoffAt: string,
) {
  const cutoffDay = cutoffAt.slice(0, 10);
  return rows
    .filter((row) => row.canonical_team_key === teamKey)
    .filter((row) => row.effective_date < cutoffDay)
    .sort((left, right) => left.effective_date.localeCompare(right.effective_date))
    .at(-1) ?? null;
}

function buildEloPercentileMap(rows: RatingSnapshotRow[], cutoffAt: string) {
  const cutoffDay = cutoffAt.slice(0, 10);
  const filtered = rows
    .filter((row) => row.effective_date < cutoffDay)
    .filter((row) => row.elo_rating != null)
    .sort((left, right) => (right.elo_rating ?? 0) - (left.elo_rating ?? 0));
  const byTeam = new Map<string, { rank: number; percentile: number }>();
  filtered.forEach((row, index) => {
    const rank = index + 1;
    const percentile =
      filtered.length <= 1 ? 1 : 1 - index / (filtered.length - 1);
    if (!byTeam.has(row.canonical_team_key)) {
      byTeam.set(row.canonical_team_key, {
        rank,
        percentile: round(percentile, 4),
      });
    }
  });
  return byTeam;
}

function contradictionFlagsFromSignal(signal: TeamSignalSnapshot) {
  const flags: string[] = [];
  const recentPoints = safeNumber(signal.recent_form.last_20_points_per_match);
  const worldCupMatches = signal.tournament_form.matches;
  if (
    typeof signal.eloAtCutoff === "number" &&
    recentPoints != null &&
    signal.eloAtCutoff > 1850 &&
    recentPoints < 1.2
  ) {
    flags.push("high_structural_low_recent_points");
  }
  if (
    typeof signal.fifaAtCutoff === "number" &&
    signal.eloAtCutoff != null &&
    signal.fifaAtCutoff > 1850 &&
    signal.eloAtCutoff < 1650
  ) {
    flags.push("fifa_elo_disagreement");
  }
  if (worldCupMatches <= 1 && signal.tournament_form.over_under_performance > 1) {
    flags.push("tiny_tournament_sample_spike");
  }
  return flags;
}

function buildTeamFeatureVector(args: {
  teamKey: string;
  cutoffAt: string;
  signal: TeamSignalSnapshot;
  historicalFacts: HistoricalMatchFact[];
  localizations: CanonicalTeamLocalization[];
  eloCurrent: RatingSnapshotRow[];
  eloStart2026: RatingSnapshotRow[];
  fifaRanking: RatingSnapshotRow[];
  scheduleRows: WorldCupScheduleMatch[];
}) {
  const localization = buildLocalizationIndex(args.localizations).get(args.teamKey);
  if (!localization) {
    throw new Error(`Missing localization for ${args.teamKey}.`);
  }
  const cutoffMs = Date.parse(args.cutoffAt);
  const eligiblePerspectives = args.historicalFacts
    .map((fact) => buildTeamPerspective(fact, args.teamKey, args.scheduleRows, args.localizations))
    .filter((entry): entry is TeamMatchPerspective => entry != null)
    .filter((entry) => Date.parse(entry.comparableKickoffAt) < cutoffMs)
    .sort((left, right) => right.comparableKickoffAt.localeCompare(left.comparableKickoffAt));
  const recent5 = eligiblePerspectives.slice(0, 5);
  const recent10 = eligiblePerspectives.slice(0, 10);
  const recent20 = eligiblePerspectives.slice(0, 20);
  const worldCupFacts = eligiblePerspectives.filter((entry) => entry.competitionKey === "world_cup");
  const weights = buildRecencyWeights(recent20.length);
  const weightedPoints = buildWeightedAverage(
    recent20.map((entry, index) => ({
      value: entry.actualResult * 3,
      weight: weights[index] ?? 1,
    })),
  );
  const weightedGoalDiff = buildWeightedAverage(
    recent20.map((entry, index) => ({
      value: entry.goalsFor - entry.goalsAgainst,
      weight: weights[index] ?? 1,
    })),
  );
  const averageOpponentElo = average(recent20.map((entry) => entry.opponentPreMatchElo));
  const averageExpectation = average(
    recent20.map((entry) =>
      entry.expectedResult == null ? null : entry.actualResult - entry.expectedResult,
    ),
  );
  const worldCupAverageOpponentElo = average(worldCupFacts.map((entry) => entry.opponentPreMatchElo));
  const worldCupExpectation = average(
    worldCupFacts.map((entry) =>
      entry.expectedResult == null ? null : entry.actualResult - entry.expectedResult,
    ),
  );
  const start2026 = args.eloStart2026.find((row) => row.canonical_team_key === args.teamKey) ?? null;
  const latestElo = getLatestRatingBeforeCutoff(args.eloCurrent, args.teamKey, args.cutoffAt);
  const latestFifa = getLatestFifaBeforeCutoff(args.fifaRanking, args.teamKey, args.cutoffAt);
  const eloPercentiles = buildEloPercentileMap(args.eloCurrent, args.cutoffAt);
  const eloRankEntry = eloPercentiles.get(args.teamKey) ?? null;
  const recentGoalsFor = average(recent20.map((entry) => entry.goalsFor));
  const recentGoalsAgainst = average(recent20.map((entry) => entry.goalsAgainst));
  const volatility = average(
    recent20.map((entry) =>
      entry.expectedResult == null ? null : Math.abs(entry.actualResult - entry.expectedResult),
    ),
  );
  const qualityWins = recent20.filter(
    (entry) =>
      entry.goalsFor > entry.goalsAgainst &&
      ((entry.expectedResult != null && entry.expectedResult < 0.45) ||
        (entry.preMatchElo != null && entry.opponentPreMatchElo != null && entry.opponentPreMatchElo - entry.preMatchElo > 40)),
  ).length;
  const badLosses = recent20.filter(
    (entry) =>
      entry.goalsFor < entry.goalsAgainst &&
      ((entry.expectedResult != null && entry.expectedResult > 0.55) ||
        (entry.preMatchElo != null && entry.opponentPreMatchElo != null && entry.preMatchElo - entry.opponentPreMatchElo > 40)),
  ).length;
  const contradictionFlags = contradictionFlagsFromSignal(args.signal);
  const fifaAvailability = latestFifa?.fifa_points != null ? 1 : 0;
  const datePrecision = recent20.some((entry) => entry.comparableKickoffAt.endsWith("23:59:59Z")) ? 0.75 : 1;
  const sourceCoverage = clamp(
    new Set(recent20.flatMap((entry) => [entry.fact.source_snapshot_id])).size / 4,
    0.25,
    1,
  );
  const reliabilityScore = round(
    clamp(
      (recent20.length / 20) * 0.45 +
      args.signal.eloReliability * 0.2 +
      fifaAvailability * 0.1 +
      sourceCoverage * 0.15 +
      datePrecision * 0.1 -
      contradictionFlags.length * 0.03,
      0,
      1,
    ),
    4,
  );
  const tournamentReliabilityShrink = round(clamp(worldCupFacts.length / 4, 0, 1), 4);
  const baselineStrength = round(
    clamp(
      ((args.signal.eloAtCutoff ?? latestElo?.elo_rating ?? 1500) - 1300) / 700 * 0.6 +
      (eloRankEntry?.percentile ?? 0.5) * 0.2 +
      (latestFifa?.fifa_points != null ? clamp((latestFifa.fifa_points - 1000) / 1000, 0, 1) * 0.1 : 0.05) +
      (start2026?.elo_rating != null ? clamp((start2026.elo_rating - 1300) / 700, 0, 1) * 0.1 : 0.05),
      0,
      1,
    ),
    4,
  );
  const recentFormScore = round(
    clamp(
      ((weightedPoints ?? 1.5) / 3) * 0.55 +
      ((averageExpectation ?? 0) + 0.5) * 0.25 +
      (averageOpponentElo != null ? clamp((averageOpponentElo - 1400) / 600, 0, 1) * 0.1 : 0.05) +
      ((weightedGoalDiff ?? 0) + 2) / 4 * 0.1,
      0,
      1,
    ),
    4,
  );
  const tournamentFormRaw = round(
    clamp(
      (worldCupFacts.length === 0 ? 0.5 : ((worldCupFacts.filter((entry) => entry.goalsFor > entry.goalsAgainst).length * 3 + worldCupFacts.filter((entry) => entry.goalsFor === entry.goalsAgainst).length) / Math.max(worldCupFacts.length * 3, 1))) * 0.45 +
      ((worldCupExpectation ?? 0) + 0.5) * 0.25 +
      (worldCupAverageOpponentElo != null ? clamp((worldCupAverageOpponentElo - 1400) / 600, 0, 1) * 0.15 : 0.075) +
      (worldCupFacts.length > 0 ? clamp((worldCupFacts.reduce((total, entry) => total + entry.goalsFor - entry.goalsAgainst, 0) / worldCupFacts.length + 2) / 4, 0, 1) * 0.15 : 0.075),
      0,
      1,
    ),
    4,
  );
  const tournamentFormScore = round(
    baselineStrength * (1 - tournamentReliabilityShrink) + tournamentFormRaw * tournamentReliabilityShrink,
    4,
  );
  const attackScore = round(
    clamp(
      (recentGoalsFor ?? 1.2) / 2.8 * 0.35 +
      ((args.signal.attack.scoring_match_rate ?? 0.5)) * 0.25 +
      ((args.signal.attack.two_plus_scored_rate ?? 0.3)) * 0.15 +
      ((args.signal.attack.btts_rate ?? 0.45)) * 0.1 +
      (worldCupFacts.length > 0 ? rate(worldCupFacts.filter((entry) => entry.goalsFor > 0).length, worldCupFacts.length) ?? 0.5 : 0.5) * 0.15,
      0,
      1,
    ),
    4,
  );
  const defenseScore = round(
    clamp(
      (1 - clamp((recentGoalsAgainst ?? 1.2) / 2.8, 0, 1)) * 0.35 +
      ((args.signal.defense.clean_sheet_rate ?? 0.3)) * 0.25 +
      (1 - (args.signal.defense.two_plus_conceded_rate ?? 0.3)) * 0.15 +
      (worldCupFacts.length > 0 ? rate(worldCupFacts.filter((entry) => entry.goalsAgainst === 0).length, worldCupFacts.length) ?? 0.5 : 0.5) * 0.15 +
      (1 - (args.signal.attack.btts_rate ?? 0.45)) * 0.1,
      0,
      1,
    ),
    4,
  );
  const expectationScore = round(clamp(((averageExpectation ?? 0) + 0.75) / 1.5, 0, 1), 4);

  return {
    teamKey: args.teamKey,
    displayNameEn: localization.display_name_en,
    displayNameEs: localization.display_name_es,
    cutoffAt: args.cutoffAt,
    sourceSnapshotIds: args.signal.source_snapshot_ids,
    structuralStrength: {
      eloAtCutoff: args.signal.eloAtCutoff,
      eloPercentile: eloRankEntry?.percentile ?? null,
      eloRank: eloRankEntry?.rank ?? latestElo?.current_rank ?? null,
      fifaPoints: latestFifa?.fifa_points ?? args.signal.fifaAtCutoff,
      fifaRank: latestFifa?.current_rank ?? null,
      start2026Elo: start2026?.elo_rating ?? null,
      ytdEloMovement:
        args.signal.eloAtCutoff != null && start2026?.elo_rating != null
          ? round(args.signal.eloAtCutoff - start2026.elo_rating, 4)
          : null,
      fifaEloAgreement:
        latestFifa?.current_rank != null && (eloRankEntry?.rank ?? latestElo?.current_rank) != null
          ? round(1 - Math.min(Math.abs(latestFifa.current_rank - (eloRankEntry?.rank ?? latestElo?.current_rank ?? latestFifa.current_rank)) / 40, 1), 4)
          : null,
      fifaEloDisagreement:
        latestFifa?.current_rank != null && (eloRankEntry?.rank ?? latestElo?.current_rank) != null
          ? round(Math.min(Math.abs(latestFifa.current_rank - (eloRankEntry?.rank ?? latestElo?.current_rank ?? latestFifa.current_rank)) / 40, 1), 4)
          : null,
    },
    recentForm: {
      last5: windowRecord(recent5),
      last10: windowRecord(recent10),
      last20: windowRecord(recent20),
      goalsForPerMatch: recentGoalsFor,
      goalsAgainstPerMatch: recentGoalsAgainst,
      scoringMatchRate: rate(recent20.filter((entry) => entry.goalsFor > 0).length, recent20.length),
      failedToScoreRate: rate(recent20.filter((entry) => entry.goalsFor === 0).length, recent20.length),
      cleanSheetRate: rate(recent20.filter((entry) => entry.goalsAgainst === 0).length, recent20.length),
      bttsRate: rate(recent20.filter((entry) => entry.goalsFor > 0 && entry.goalsAgainst > 0).length, recent20.length),
      over25Rate: rate(recent20.filter((entry) => entry.goalsFor + entry.goalsAgainst > 2).length, recent20.length),
      under25Rate: rate(recent20.filter((entry) => entry.goalsFor + entry.goalsAgainst <= 2).length, recent20.length),
      twoPlusScoredRate: rate(recent20.filter((entry) => entry.goalsFor >= 2).length, recent20.length),
      twoPlusConcededRate: rate(recent20.filter((entry) => entry.goalsAgainst >= 2).length, recent20.length),
      volatility,
      recencyWeightedForm: weightedPoints,
    },
    opponentAdjustment: {
      averageOpponentPreMatchElo: averageOpponentElo,
      strengthOfSchedule: averageOpponentElo,
      performanceVsEloExpectation: averageExpectation,
      qualityWins,
      badLosses,
      officialMatchRate: rate(recent20.filter((entry) => entry.official).length, recent20.length),
      friendlyMatchRate: rate(recent20.filter((entry) => !entry.official).length, recent20.length),
      neutralMatchRate: rate(recent20.filter((entry) => entry.venueContext === "neutral").length, recent20.length),
      homeMatchRate: rate(recent20.filter((entry) => entry.venueContext === "home").length, recent20.length),
      awayMatchRate: rate(recent20.filter((entry) => entry.venueContext === "away").length, recent20.length),
      crossConfederationPerformance: average(
        recent20
          .map((entry) => {
            const left = CONFEDERATION_BY_TEAM_KEY[entry.teamKey];
            const right = CONFEDERATION_BY_TEAM_KEY[entry.opponentKey];
            if (!left || !right || left === right) {
              return null;
            }
            return entry.actualResult;
          }),
      ),
    },
    currentWorldCupForm: {
      matchesPlayed: worldCupFacts.length,
      wins: worldCupFacts.filter((entry) => entry.goalsFor > entry.goalsAgainst).length,
      draws: worldCupFacts.filter((entry) => entry.goalsFor === entry.goalsAgainst).length,
      losses: worldCupFacts.filter((entry) => entry.goalsFor < entry.goalsAgainst).length,
      goalsFor: worldCupFacts.reduce((total, entry) => total + entry.goalsFor, 0),
      goalsAgainst: worldCupFacts.reduce((total, entry) => total + entry.goalsAgainst, 0),
      scoringRate: rate(worldCupFacts.filter((entry) => entry.goalsFor > 0).length, worldCupFacts.length),
      cleanSheetRate: rate(worldCupFacts.filter((entry) => entry.goalsAgainst === 0).length, worldCupFacts.length),
      failedToScoreRate: rate(worldCupFacts.filter((entry) => entry.goalsFor === 0).length, worldCupFacts.length),
      averageOpponentElo: worldCupAverageOpponentElo,
      performanceVsExpectation: worldCupExpectation,
      tournamentOverperformance: worldCupExpectation,
      reliabilityShrink: tournamentReliabilityShrink,
    },
    reliability: {
      sampleSize: recent20.length,
      sourceCoverage,
      eloResolutionReliability: args.signal.eloReliability,
      fifaAvailability,
      datePrecision,
      contradictionFlags,
    },
    subScores: {
      baselineStrength,
      recentForm: recentFormScore,
      tournamentForm: tournamentFormScore,
      attack: attackScore,
      defense: defenseScore,
      performanceVsExpectation: expectationScore,
      reliability: reliabilityScore,
    },
    missingOptionalSignals: [...args.signal.missingOptionalSignals],
  } satisfies TeamFeatureVector;
}

export function buildMatchFeatureVector(args: {
  fixtureId: string;
  cutoffAt: string;
  homeTeamKey: string;
  awayTeamKey: string;
  officialMatchNumber?: number | null;
  homeSignal: TeamSignalSnapshot;
  awaySignal: TeamSignalSnapshot;
  historicalFacts: HistoricalMatchFact[];
  localizations: CanonicalTeamLocalization[];
  eloCurrent: RatingSnapshotRow[];
  eloStart2026: RatingSnapshotRow[];
  fifaRanking: RatingSnapshotRow[];
  scheduleRows: WorldCupScheduleMatch[];
}) {
  const home = buildTeamFeatureVector({
    teamKey: args.homeTeamKey,
    cutoffAt: args.cutoffAt,
    signal: args.homeSignal,
    historicalFacts: args.historicalFacts,
    localizations: args.localizations,
    eloCurrent: args.eloCurrent,
    eloStart2026: args.eloStart2026,
    fifaRanking: args.fifaRanking,
    scheduleRows: args.scheduleRows,
  });
  const away = buildTeamFeatureVector({
    teamKey: args.awayTeamKey,
    cutoffAt: args.cutoffAt,
    signal: args.awaySignal,
    historicalFacts: args.historicalFacts,
    localizations: args.localizations,
    eloCurrent: args.eloCurrent,
    eloStart2026: args.eloStart2026,
    fifaRanking: args.fifaRanking,
    scheduleRows: args.scheduleRows,
  });
  const scheduleMatch = findScheduleMatchForFixture({
    scheduleRows: args.scheduleRows,
    officialMatchNumber: args.officialMatchNumber ?? null,
    homeTeamKey: args.homeTeamKey,
    awayTeamKey: args.awayTeamKey,
    matchDate: args.cutoffAt.slice(0, 10),
  });
  const venueContext =
    scheduleMatch == null
      ? {
          fixtureContext: "neutral" as const,
          appliesTo: null,
          hostTeamKey: null,
          venueCountryCode: null,
          reasonCode: "non_world_cup_no_adjustment" as const,
        }
      : resolveHostContextForFixture({
          homeTeamKey: args.homeTeamKey,
          awayTeamKey: args.awayTeamKey,
          venueCountryCode: scheduleMatch.country_code,
          localizations: args.localizations,
        });
  const homeEffectiveStrength = home.subScores.baselineStrength * 0.4 + home.subScores.recentForm * 0.22 + home.subScores.tournamentForm * 0.13 + home.subScores.attack * 0.1 + home.subScores.defense * 0.08 + home.subScores.performanceVsExpectation * 0.04 + home.subScores.reliability * 0.03;
  const awayEffectiveStrength = away.subScores.baselineStrength * 0.4 + away.subScores.recentForm * 0.22 + away.subScores.tournamentForm * 0.13 + away.subScores.attack * 0.1 + away.subScores.defense * 0.08 + away.subScores.performanceVsExpectation * 0.04 + away.subScores.reliability * 0.03;
  const favoriteSide: MatchOutcomeKey = homeEffectiveStrength >= awayEffectiveStrength ? "home" : "away";

  return {
    fixtureId: args.fixtureId,
    cutoffAt: args.cutoffAt,
    homeTeamKey: args.homeTeamKey,
    awayTeamKey: args.awayTeamKey,
    home,
    away,
    derived: {
      structuralGap: round(home.subScores.baselineStrength - away.subScores.baselineStrength, 4),
      recentGap: round(home.subScores.recentForm - away.subScores.recentForm, 4),
      tournamentGap: round(home.subScores.tournamentForm - away.subScores.tournamentForm, 4),
      attackDefenseGap: round((home.subScores.attack - away.subScores.defense) - (away.subScores.attack - home.subScores.defense), 4),
      expectationGap: round(home.subScores.performanceVsExpectation - away.subScores.performanceVsExpectation, 4),
      favoriteSide,
      favoriteStrengthGap: round(Math.abs(homeEffectiveStrength - awayEffectiveStrength), 4),
      combinedAttackIntent: round((home.subScores.attack + away.subScores.attack) / 2, 4),
      combinedDefensiveResistance: round((home.subScores.defense + away.subScores.defense) / 2, 4),
      combinedOpenPlay: round((((home.recentForm.bttsRate ?? 0.45) + (away.recentForm.bttsRate ?? 0.45)) / 2 + ((home.recentForm.over25Rate ?? 0.45) + (away.recentForm.over25Rate ?? 0.45)) / 2) / 2, 4),
      combinedTournamentOpenPlay: round((((home.currentWorldCupForm.scoringRate ?? 0.5) + (away.currentWorldCupForm.scoringRate ?? 0.5)) / 2 + ((home.currentWorldCupForm.failedToScoreRate ?? 0.4) + (away.currentWorldCupForm.failedToScoreRate ?? 0.4)) / -4 + 0.25), 4),
      reliabilityAverage: round((home.subScores.reliability + away.subScores.reliability) / 2, 4),
      venueContext,
    },
  } satisfies MatchFeatureVector;
}

function buildScoreMatrixWithTail(expectedGoals: { home: number; away: number }, maxGoals: number) {
  const rawMatrix = buildScoreMatrix(expectedGoals, maxGoals);
  const coveredHome = Array.from({ length: maxGoals + 1 }, (_, goals) => poissonProbability(expectedGoals.home, goals)).reduce((total, value) => total + value, 0);
  const coveredAway = Array.from({ length: maxGoals + 1 }, (_, goals) => poissonProbability(expectedGoals.away, goals)).reduce((total, value) => total + value, 0);
  const coveredProbability = coveredHome * coveredAway;
  return {
    matrix: rawMatrix.map((entry) => ({
      ...entry,
      probability: round(entry.probability, 8),
    })),
    tailMass: round(Math.max(0, 1 - coveredProbability), 8),
  };
}

function build1X2(matrix: Array<{ homeGoals: number; awayGoals: number; probability: number }>) {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  for (const cell of matrix) {
    if (cell.homeGoals > cell.awayGoals) {
      homeWin += cell.probability;
    } else if (cell.homeGoals < cell.awayGoals) {
      awayWin += cell.probability;
    } else {
      draw += cell.probability;
    }
  }
  return {
    homeWin: round(homeWin, 6),
    draw: round(draw, 6),
    awayWin: round(awayWin, 6),
  };
}

function buildBttsAndTotals(matrix: Array<{ homeGoals: number; awayGoals: number; probability: number }>) {
  let bttsYes = 0;
  let over25 = 0;
  for (const cell of matrix) {
    if (cell.homeGoals > 0 && cell.awayGoals > 0) {
      bttsYes += cell.probability;
    }
    if (cell.homeGoals + cell.awayGoals > 2) {
      over25 += cell.probability;
    }
  }
  return {
    btts: {
      yes: round(bttsYes, 6),
      no: round(1 - bttsYes, 6),
    },
    overUnder25: {
      over: round(over25, 6),
      under: round(1 - over25, 6),
    },
  };
}

function confidenceFromProbabilities(oneXTwo: { homeWin: number; draw: number; awayWin: number }, reliability: number) {
  const values = [oneXTwo.homeWin, oneXTwo.draw, oneXTwo.awayWin].sort((left, right) => right - left);
  const margin = (values[0] ?? 0) - (values[1] ?? 0);
  return round(clamp((values[0] ?? 0) * 0.75 + margin * 0.25, 0, 1) * 100 * (0.7 + reliability * 0.3), 2);
}

function riskLevelFromPrediction(args: {
  oneXTwo: { homeWin: number; draw: number; awayWin: number };
  reliability: number;
  totalGoals: number;
}) {
  const topProbability = Math.max(args.oneXTwo.homeWin, args.oneXTwo.draw, args.oneXTwo.awayWin);
  if (topProbability >= 0.56 && args.reliability >= 0.62 && args.totalGoals <= 3.4) {
    return "low" as const;
  }
  if (topProbability <= 0.42 || args.reliability < 0.45 || args.totalGoals >= 3.8) {
    return "high" as const;
  }
  return "medium" as const;
}

function familyCodeForScore(args: {
  homeGoals: number;
  awayGoals: number;
  favoriteSide: MatchOutcomeKey;
}) {
  const total = args.homeGoals + args.awayGoals;
  if (args.homeGoals === args.awayGoals) {
    return total <= 2 ? "low_scoring_draw" : "scoring_draw";
  }
  if (total <= 2) {
    return "controlled_low_total_match";
  }
  if (total >= 5) {
    return "open_high_scoring_match";
  }
  const outcome = outcomeFromGoals(args.homeGoals, args.awayGoals);
  const margin = Math.abs(args.homeGoals - args.awayGoals);
  if (outcome === args.favoriteSide) {
    return margin >= 2 ? "favorite_clear_win" : "favorite_narrow_win";
  }
  return margin >= 2 ? "underdog_clear_win" : "underdog_narrow_win";
}

function totalRangeCode(homeGoals: number, awayGoals: number) {
  const total = homeGoals + awayGoals;
  if (total <= 2) {
    return "low_total";
  }
  if (total <= 4) {
    return "medium_total";
  }
  return "high_total";
}

function bttsCode(homeGoals: number, awayGoals: number) {
  return homeGoals > 0 && awayGoals > 0 ? "yes" : "no";
}

function winningMarginCode(homeGoals: number, awayGoals: number) {
  if (homeGoals === awayGoals) {
    return "draw_margin";
  }
  const margin = Math.abs(homeGoals - awayGoals);
  if (margin === 1) {
    return "one_goal_margin";
  }
  return "multi_goal_margin";
}

type ScenarioFamilyContract = {
  familyCode: string;
  outcome: "favorite" | "underdog" | "draw" | "non_draw";
  winningMargin: "draw_margin" | "one_goal_margin" | "multi_goal_margin" | "non_draw_any";
  totalGoalRange: "low_total" | "medium_total" | "high_total";
  btts: "yes" | "no" | "either";
};

const SCENARIO_FAMILY_CONTRACTS: ScenarioFamilyContract[] = [
  { familyCode: "low_scoring_draw", outcome: "draw", winningMargin: "draw_margin", totalGoalRange: "low_total", btts: "either" },
  { familyCode: "scoring_draw", outcome: "draw", winningMargin: "draw_margin", totalGoalRange: "medium_total", btts: "yes" },
  { familyCode: "controlled_low_total_match", outcome: "non_draw", winningMargin: "non_draw_any", totalGoalRange: "low_total", btts: "no" },
  { familyCode: "favorite_narrow_win", outcome: "favorite", winningMargin: "one_goal_margin", totalGoalRange: "medium_total", btts: "either" },
  { familyCode: "favorite_clear_win", outcome: "favorite", winningMargin: "multi_goal_margin", totalGoalRange: "medium_total", btts: "either" },
  { familyCode: "underdog_narrow_win", outcome: "underdog", winningMargin: "one_goal_margin", totalGoalRange: "medium_total", btts: "either" },
  { familyCode: "underdog_clear_win", outcome: "underdog", winningMargin: "multi_goal_margin", totalGoalRange: "medium_total", btts: "either" },
  { familyCode: "open_high_scoring_match", outcome: "non_draw", winningMargin: "non_draw_any", totalGoalRange: "high_total", btts: "either" },
];

function scenarioFamilyContract(familyCode: string) {
  const contract = SCENARIO_FAMILY_CONTRACTS.find((entry) => entry.familyCode === familyCode);
  if (!contract) {
    throw new Error(`Unknown scenario family ${familyCode}.`);
  }
  return contract;
}

function familyMatchesScore(args: {
  familyCode: string;
  homeGoals: number;
  awayGoals: number;
  favoriteSide: MatchOutcomeKey;
}) {
  const contract = scenarioFamilyContract(args.familyCode);
  const actualOutcome = outcomeFromGoals(args.homeGoals, args.awayGoals);
  const actualMargin = winningMarginCode(args.homeGoals, args.awayGoals);
  const actualTotalRange = totalRangeCode(args.homeGoals, args.awayGoals);
  const actualBtts = bttsCode(args.homeGoals, args.awayGoals);
  const outcomeMatches =
    contract.outcome === "draw"
      ? actualOutcome === "draw"
      : contract.outcome === "favorite"
        ? actualOutcome === args.favoriteSide
        : contract.outcome === "underdog"
          ? actualOutcome !== "draw" && actualOutcome !== args.favoriteSide
          : actualOutcome !== "draw";
  const marginMatches =
    contract.winningMargin === "non_draw_any"
      ? actualMargin !== "draw_margin"
      : actualMargin === contract.winningMargin;
  const totalMatches = actualTotalRange === contract.totalGoalRange;
  const bttsMatches = contract.btts === "either" ? true : actualBtts === contract.btts;
  return outcomeMatches && marginMatches && totalMatches && bttsMatches;
}

function buildSupportingReasonCodes(features: MatchFeatureVector) {
  const reasons: string[] = [];
  if (features.derived.structuralGap >= 0.12) {
    reasons.push("home_structural_edge");
  }
  if (features.derived.structuralGap <= -0.12) {
    reasons.push("away_structural_edge");
  }
  if (features.derived.recentGap >= 0.08) {
    reasons.push("home_recent_form_edge");
  }
  if (features.derived.recentGap <= -0.08) {
    reasons.push("away_recent_form_edge");
  }
  if (features.derived.tournamentGap >= 0.05) {
    reasons.push("home_tournament_surge");
  }
  if (features.derived.tournamentGap <= -0.05) {
    reasons.push("away_tournament_surge");
  }
  if (features.derived.combinedOpenPlay >= 0.56) {
    reasons.push("open_match_profile");
  }
  if (features.derived.combinedOpenPlay <= 0.42) {
    reasons.push("low_total_profile");
  }
  if (features.home.missingOptionalSignals.length > 0 || features.away.missingOptionalSignals.length > 0) {
    reasons.push("partial_optional_signal_coverage");
  }
  return reasons;
}

function buildContradictingReasonCodes(features: MatchFeatureVector) {
  const reasons: string[] = [];
  if (Math.abs(features.derived.structuralGap) < 0.05) {
    reasons.push("limited_structural_separation");
  }
  if (Math.abs(features.derived.recentGap) < 0.04) {
    reasons.push("balanced_recent_form");
  }
  if (features.home.reliability.contradictionFlags.length > 0 || features.away.reliability.contradictionFlags.length > 0) {
    reasons.push("signal_contradictions_present");
  }
  if (features.derived.reliabilityAverage < 0.5) {
    reasons.push("reliability_drag");
  }
  return reasons;
}

function requiredScriptCodesFromFamily(familyCode: string) {
  switch (familyCode) {
    case "favorite_clear_win":
      return ["favorite_control", "conversion_edge"];
    case "favorite_narrow_win":
      return ["favorite_control", "limited_margin"];
    case "low_scoring_draw":
      return ["suppressed_chance_quality", "defensive_resistance"];
    case "scoring_draw":
      return ["trading_goals", "balanced_finishing"];
    case "underdog_narrow_win":
      return ["underdog_counter_route", "favorite_wastefulness"];
    case "underdog_clear_win":
      return ["underdog_surge", "favorite_collapse"];
    case "controlled_low_total_match":
      return ["few_big_chances", "low_total_script"];
    default:
      return ["open_transitions", "high_total_script"];
  }
}

function shouldIncludeFamily(args: {
  familyCode: string;
  familyProbability: number;
  drawProbability: number;
  favoriteProbability: number;
  underdogProbability: number;
  supportingReasonCodes: string[];
}) {
  if (args.familyProbability < 0.08) {
    return false;
  }
  if (
    (args.familyCode === "low_scoring_draw" || args.familyCode === "scoring_draw") &&
    args.drawProbability < 0.2 &&
    !args.supportingReasonCodes.includes("low_total_profile")
  ) {
    return false;
  }
  if (
    (args.familyCode === "underdog_narrow_win" || args.familyCode === "underdog_clear_win") &&
    args.underdogProbability < 0.16
  ) {
    return false;
  }
  if (
    (args.familyCode === "favorite_narrow_win" || args.familyCode === "favorite_clear_win") &&
    args.favoriteProbability < 0.3
  ) {
    return false;
  }
  return true;
}

export function selectScenarioSet(args: {
  features: MatchFeatureVector;
  prediction: {
    scoreMatrix: Array<{ homeGoals: number; awayGoals: number; probability: number }>;
    oneXTwo: { homeWin: number; draw: number; awayWin: number };
    confidence: number;
    reliability: number;
  };
}) {
  const supportingReasonCodes = buildSupportingReasonCodes(args.features);
  const contradictingReasonCodes = buildContradictingReasonCodes(args.features);
  const favoriteSide = args.features.derived.favoriteSide;
  const favoriteProbability = favoriteSide === "home" ? args.prediction.oneXTwo.homeWin : args.prediction.oneXTwo.awayWin;
  const underdogProbability = favoriteSide === "home" ? args.prediction.oneXTwo.awayWin : args.prediction.oneXTwo.homeWin;
  const grouped = new Map<string, Array<{ homeGoals: number; awayGoals: number; probability: number }>>();
  for (const cell of args.prediction.scoreMatrix) {
    const familyCode = familyCodeForScore({
      homeGoals: cell.homeGoals,
      awayGoals: cell.awayGoals,
      favoriteSide,
    });
    const current = grouped.get(familyCode) ?? [];
    current.push(cell);
    grouped.set(familyCode, current);
  }
  const families = Array.from(grouped.entries())
    .map(([familyCode, rows]) => ({
      familyCode,
      familyProbability: round(rows.reduce((total, row) => total + row.probability, 0), 6),
      representative: [...rows].sort(compareByProbability)[0]!,
      rows: [...rows].sort(compareByProbability).slice(0, 4),
    }))
    .sort((left, right) => right.familyProbability - left.familyProbability);
  const passingFamilies = families.filter((family) =>
    shouldIncludeFamily({
      familyCode: family.familyCode,
      familyProbability: family.familyProbability,
      drawProbability: args.prediction.oneXTwo.draw,
      favoriteProbability,
      underdogProbability,
      supportingReasonCodes,
    }),
  );
  const selectedFamilies: typeof passingFamilies = [];
  if (favoriteProbability >= 0.52) {
    for (const familyCode of ["favorite_clear_win", "favorite_narrow_win"]) {
      const prioritized = passingFamilies.find((family) => family.familyCode === familyCode);
      if (prioritized && !selectedFamilies.find((entry) => entry.familyCode === familyCode)) {
        selectedFamilies.push(prioritized);
      }
    }
  }
  for (const family of passingFamilies) {
    if (!selectedFamilies.find((entry) => entry.familyCode === family.familyCode)) {
      selectedFamilies.push(family);
    }
    if (selectedFamilies.length === 3) {
      break;
    }
  }
  for (const family of families) {
    if (selectedFamilies.length === 3) {
      break;
    }
    if (!selectedFamilies.find((entry) => entry.familyCode === family.familyCode)) {
      selectedFamilies.push(family);
    }
  }
  return selectedFamilies.slice(0, 3).map((family, index) => ({
    scenarioType: index === 0 ? "main" : index === 1 ? "supporting" : "risk",
    familyCode: family.familyCode,
    representativeScore: {
      home: family.representative.homeGoals,
      away: family.representative.awayGoals,
    },
    exactScoreProbability: round(family.representative.probability, 6),
    familyProbability: family.familyProbability,
    supportingReasonCodes,
    contradictingReasonCodes,
    requiredMatchScriptCodes: requiredScriptCodesFromFamily(family.familyCode),
    riskLevel: index === 0 && args.prediction.confidence >= 62 ? "low" : index === 2 ? "high" : "medium",
    reliability: round(args.prediction.reliability, 4),
    relatedScorelines: family.rows.map((row) => ({
      home: row.homeGoals,
      away: row.awayGoals,
      probability: round(row.probability, 6),
    })),
  })) satisfies ScenarioObject[];
}

const FAMILY_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    favorite_clear_win: "favorite clear win",
    favorite_narrow_win: "favorite narrow win",
    low_scoring_draw: "low-scoring draw",
    scoring_draw: "scoring draw",
    underdog_narrow_win: "underdog narrow win",
    underdog_clear_win: "underdog clear win",
    open_high_scoring_match: "open high-scoring match",
    controlled_low_total_match: "controlled low-total match",
  },
  es: {
    favorite_clear_win: "victoria clara del favorito",
    favorite_narrow_win: "victoria corta del favorito",
    low_scoring_draw: "empate de pocos goles",
    scoring_draw: "empate con goles",
    underdog_narrow_win: "victoria corta del no favorito",
    underdog_clear_win: "victoria clara del no favorito",
    open_high_scoring_match: "partido abierto y de muchos goles",
    controlled_low_total_match: "partido controlado y de pocos goles",
  },
};

const REASON_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    home_structural_edge: "Home side carries the stronger structural rating profile.",
    away_structural_edge: "Away side carries the stronger structural rating profile.",
    home_recent_form_edge: "Home side arrives in the better recent form window.",
    away_recent_form_edge: "Away side arrives in the better recent form window.",
    home_tournament_surge: "Home side has the stronger current-tournament evidence.",
    away_tournament_surge: "Away side has the stronger current-tournament evidence.",
    open_match_profile: "Both teams project an open match profile.",
    low_total_profile: "The evidence leans toward a suppressed total-goals script.",
    partial_optional_signal_coverage: "Some optional rating inputs are unavailable, so the read is reliability-shrunk.",
    limited_structural_separation: "Structural separation is limited.",
    balanced_recent_form: "Recent form is fairly balanced.",
    signal_contradictions_present: "The inputs contain contradiction flags.",
    reliability_drag: "Reliability remains moderate rather than strong.",
  },
  es: {
    home_structural_edge: "El local trae un perfil estructural de rating mas fuerte.",
    away_structural_edge: "El visitante trae un perfil estructural de rating mas fuerte.",
    home_recent_form_edge: "El local llega con mejor forma reciente.",
    away_recent_form_edge: "El visitante llega con mejor forma reciente.",
    home_tournament_surge: "El local trae mejor evidencia del torneo actual.",
    away_tournament_surge: "El visitante trae mejor evidencia del torneo actual.",
    open_match_profile: "Los dos equipos proyectan un partido abierto.",
    low_total_profile: "La evidencia empuja a un guion de pocos goles.",
    partial_optional_signal_coverage: "Faltan algunas senales opcionales, asi que la lectura se encoge por fiabilidad.",
    limited_structural_separation: "La separacion estructural es limitada.",
    balanced_recent_form: "La forma reciente esta bastante equilibrada.",
    signal_contradictions_present: "Las entradas contienen banderas de contradiccion.",
    reliability_drag: "La fiabilidad sigue siendo moderada y no fuerte.",
  },
};

export function renderExplanationPreview(args: {
  locale: SupportedLocale;
  homeName: string;
  awayName: string;
  scenarios: ScenarioObject[];
}) {
  const locale = args.locale;
  const summary =
    locale === "es"
      ? `${args.homeName} vs ${args.awayName}: lectura previa con tres rutas de partido y razones auditables.`
      : `${args.homeName} vs ${args.awayName}: pre-match read with three auditable match paths.`;
  const scenarioLines = args.scenarios.map((scenario) => {
    const label = FAMILY_LABELS[locale][scenario.familyCode] ?? scenario.familyCode;
    const pct = round(scenario.familyProbability * 100, 1);
    return locale === "es"
      ? `${label} (${pct}%): marcador representativo ${scenario.representativeScore.home}-${scenario.representativeScore.away}.`
      : `${label} (${pct}%): representative score ${scenario.representativeScore.home}-${scenario.representativeScore.away}.`;
  });
  const seen = new Set<string>();
  const reasonLines = [...args.scenarios.flatMap((scenario) => [...scenario.supportingReasonCodes, ...scenario.contradictingReasonCodes])]
    .filter((code) => {
      if (seen.has(code)) {
        return false;
      }
      seen.add(code);
      return true;
    })
    .map((code) => REASON_LABELS[locale][code] ?? code);
  return {
    locale,
    summary,
    scenarioLines,
    reasonLines,
  } satisfies ExplanationPreview;
}

function buildBaselineExpectedGoals(features: MatchFeatureVector) {
  const venueShift =
    features.derived.venueContext.appliesTo === "home"
      ? 0.14
      : features.derived.venueContext.appliesTo === "away"
        ? -0.14
        : 0;
  const expectedGoalDifference = clamp(
    features.derived.structuralGap * 1.05 +
      features.derived.recentGap * 0.24 +
      features.derived.expectationGap * 0.16 +
      venueShift,
    -1.9,
    1.9,
  );
  const favoriteControl = Math.abs(features.derived.favoriteStrengthGap);
  const expectedTotalGoals = clamp(
    2.38 +
      features.derived.combinedAttackIntent * 0.38 +
      (1 - features.derived.combinedDefensiveResistance) * 0.2 +
      features.derived.combinedOpenPlay * 0.18 +
      favoriteControl * -0.06,
    1.55,
    4.15,
  );
  return {
    difference: round(expectedGoalDifference, 4),
    total: round(expectedTotalGoals, 4),
  };
}

function buildPredictionFromExpectedGoals(args: {
  candidate: Task2ModelCandidateConfig;
  features: MatchFeatureVector;
  expectedGoals: { home: number; away: number; total: number; difference: number };
  internalAudit?: PredictionAdjustmentAudit;
}) {
  const reliability = (args.features.home.subScores.reliability + args.features.away.subScores.reliability) / 2;
  const matrixWithTail = buildScoreMatrixWithTail(
    {
      home: round(args.expectedGoals.home, 4),
      away: round(args.expectedGoals.away, 4),
    },
    args.candidate.maxGoals,
  );
  const oneXTwo = build1X2(matrixWithTail.matrix);
  const drawAdjusted = {
    homeWin: clamp(oneXTwo.homeWin - args.candidate.drawLift / 2, 0, 1),
    draw: clamp(oneXTwo.draw + args.candidate.drawLift, 0, 1),
    awayWin: clamp(oneXTwo.awayWin - args.candidate.drawLift / 2, 0, 1),
  };
  const normalizedOneXTwoSum = drawAdjusted.homeWin + drawAdjusted.draw + drawAdjusted.awayWin;
  const oneXTwoNormalized = {
    homeWin: round(drawAdjusted.homeWin / normalizedOneXTwoSum, 6),
    draw: round(drawAdjusted.draw / normalizedOneXTwoSum, 6),
    awayWin: round(drawAdjusted.awayWin / normalizedOneXTwoSum, 6),
  };
  const markets = buildBttsAndTotals(matrixWithTail.matrix);
  const topScorelines = [...matrixWithTail.matrix]
    .sort(compareByProbability)
    .slice(0, 8)
    .map((cell) => ({
      score: `${cell.homeGoals}-${cell.awayGoals}`,
      homeGoals: cell.homeGoals,
      awayGoals: cell.awayGoals,
      probability: round(cell.probability, 6),
    }));
  const confidence = confidenceFromProbabilities(oneXTwoNormalized, reliability);
  const riskLevel = riskLevelFromPrediction({
    oneXTwo: oneXTwoNormalized,
    reliability,
    totalGoals: args.expectedGoals.total,
  });
  const scenarios = selectScenarioSet({
    features: args.features,
    prediction: {
      scoreMatrix: matrixWithTail.matrix,
      oneXTwo: oneXTwoNormalized,
      confidence,
      reliability,
    },
  });
  const additionalPlausible = topScorelines.filter(
    (scoreline) =>
      !scenarios.some(
        (scenario) =>
          scenario.representativeScore.home === scoreline.homeGoals &&
          scenario.representativeScore.away === scoreline.awayGoals,
      ),
  ).slice(0, 5);
  const reasonCodes = buildSupportingReasonCodes(args.features);
  const contradictingReasonCodes = buildContradictingReasonCodes(args.features);
  return {
    modelVersion: MODEL_VERSION,
    candidateKey: args.candidate.key,
    cutoffAt: args.features.cutoffAt,
    expectedGoals: {
      home: round(args.expectedGoals.home, 4),
      away: round(args.expectedGoals.away, 4),
      total: round(args.expectedGoals.total, 4),
      difference: round(args.expectedGoals.difference, 4),
    },
    probabilities: {
      oneXTwo: oneXTwoNormalized,
      btts: markets.btts,
      overUnder25: markets.overUnder25,
    },
    scoreMatrix: matrixWithTail.matrix,
    scoreMatrixTailMass: matrixWithTail.tailMass,
    topScorelines,
    mostLikelyScore: topScorelines[0]?.score ?? "0-0",
    confidence,
    riskLevel,
    scenarios,
    additionalPlausibleScorelines: additionalPlausible,
    evidenceBundle: {
      homeSubScores: args.features.home.subScores,
      awaySubScores: args.features.away.subScores,
      reasonCodes,
      contradictingReasonCodes,
      sourceSnapshotIds: Array.from(
        new Set([...args.features.home.sourceSnapshotIds, ...args.features.away.sourceSnapshotIds]),
      ).sort(),
    },
    explanationPreviews: {
      en: renderExplanationPreview({
        locale: "en",
        homeName: args.features.home.displayNameEn,
        awayName: args.features.away.displayNameEn,
        scenarios,
      }),
      es: renderExplanationPreview({
        locale: "es",
        homeName: args.features.home.displayNameEs,
        awayName: args.features.away.displayNameEs,
        scenarios,
      }),
    },
    internalAudit: args.internalAudit,
  } satisfies ChallengerPrediction;
}

function buildBoundedHybridExpectedGoals(candidate: Task2ModelCandidateConfig, features: MatchFeatureVector) {
  const baseline = buildBaselineExpectedGoals(features);
  const recentSampleReliability = clamp(Math.min(features.home.reliability.sampleSize, features.away.reliability.sampleSize) / 8, 0, 1);
  const tournamentSampleReliability = clamp(
    Math.min(features.home.currentWorldCupForm.matchesPlayed, features.away.currentWorldCupForm.matchesPlayed) / 3,
    0,
    1,
  );
  const baseReliability = clamp(features.derived.reliabilityAverage, 0, 1);
  const reliabilityScale = clamp(
    (candidate.reliabilityShrinkage?.base ?? 0.5) +
      baseReliability * (candidate.reliabilityShrinkage?.recentFormMultiplier ?? 0.25) +
      tournamentSampleReliability * (candidate.reliabilityShrinkage?.tournamentMultiplier ?? 0.15),
    0.15,
    1,
  );
  const structuralDisagreement =
    ((features.away.structuralStrength.fifaEloDisagreement ?? 0) -
      (features.home.structuralStrength.fifaEloDisagreement ?? 0)) *
    (candidate.hybridAdjustments?.structuralDisagreement ?? 0);
  const recentForm = features.derived.recentGap * (candidate.hybridAdjustments?.recentForm ?? 0);
  const attack = (features.home.subScores.attack - features.away.subScores.attack) * (candidate.hybridAdjustments?.attack ?? 0);
  const defense = (features.home.subScores.defense - features.away.subScores.defense) * (candidate.hybridAdjustments?.defense ?? 0);
  const qualityGap =
    (features.home.opponentAdjustment.qualityWins - features.home.opponentAdjustment.badLosses) -
    (features.away.opponentAdjustment.qualityWins - features.away.opponentAdjustment.badLosses);
  const opponentAdjustment =
    (((features.home.opponentAdjustment.performanceVsEloExpectation ?? 0) -
      (features.away.opponentAdjustment.performanceVsEloExpectation ?? 0)) +
      qualityGap * 0.035) *
    (candidate.hybridAdjustments?.opponentAdjustment ?? 0);
  const tournamentForm =
    features.derived.tournamentGap *
    tournamentSampleReliability *
    (candidate.hybridAdjustments?.tournamentForm ?? 0);
  const venueContext =
    (features.derived.venueContext.appliesTo === "home"
      ? 1
      : features.derived.venueContext.appliesTo === "away"
        ? -1
        : 0) * (candidate.hybridAdjustments?.venueContext ?? 0);
  const unshrunkDiffDelta =
    structuralDisagreement +
    recentForm +
    attack +
    defense +
    opponentAdjustment +
    tournamentForm +
    venueContext;
  let diffDelta = unshrunkDiffDelta * reliabilityScale;
  const capsApplied: string[] = [];
  const diffCap = candidate.boundedCaps?.expectedGoalDifferenceDelta ?? 0.4;
  if (Math.abs(diffDelta) > diffCap) {
    diffDelta = Math.sign(diffDelta) * diffCap;
    capsApplied.push("expected_goal_difference_delta_cap");
  }
  const totalSignalCore =
    ((features.derived.combinedOpenPlay - 0.5) * 0.32 +
      ((features.home.subScores.attack + features.away.subScores.attack) / 2 - 0.5) * 0.22 -
      ((features.home.subScores.defense + features.away.subScores.defense) / 2 - 0.5) * 0.18 +
      Math.abs(recentForm) * 0.12 +
      Math.abs(tournamentForm) * 0.08) *
    reliabilityScale;
  let totalDelta = totalSignalCore;
  const totalCap = candidate.boundedCaps?.expectedTotalGoalsDelta ?? 0.3;
  if (Math.abs(totalDelta) > totalCap) {
    totalDelta = Math.sign(totalDelta) * totalCap;
    capsApplied.push("expected_total_goals_delta_cap");
  }
  let adjustedDifference = baseline.difference + diffDelta;
  let adjustedTotal = baseline.total + totalDelta;
  const diffToHomeAway = (difference: number, total: number) => ({
    home: clamp((total + difference) / 2, 0.2, 3.8),
    away: clamp((total - difference) / 2, 0.2, 3.8),
  });
  const baselineHomeAway = diffToHomeAway(baseline.difference, baseline.total);
  const baselinePrediction = buildPredictionFromExpectedGoals({
    candidate: { ...candidate, drawLift: 0, modelFamily: "v1_baseline" },
    features,
    expectedGoals: {
      home: baselineHomeAway.home,
      away: baselineHomeAway.away,
      total: round(baselineHomeAway.home + baselineHomeAway.away, 4),
      difference: round(baselineHomeAway.home - baselineHomeAway.away, 4),
    },
  });
  const probabilityCap = candidate.boundedCaps?.oneXTwoDelta ?? 0.1;
  const candidateHomeAway = diffToHomeAway(adjustedDifference, adjustedTotal);
  const buildComparableOneXTwo = (difference: number, total: number) => {
    const homeAway = diffToHomeAway(difference, total);
    return buildPredictionFromExpectedGoals({
      candidate: { ...candidate, drawLift: 0, modelFamily: "v1_baseline" },
      features,
      expectedGoals: {
        home: homeAway.home,
        away: homeAway.away,
        total: round(homeAway.home + homeAway.away, 4),
        difference: round(homeAway.home - homeAway.away, 4),
      },
    }).probabilities.oneXTwo;
  };
  const baselineOneXTwo = baselinePrediction.probabilities.oneXTwo;
  const deltaWithinCap = (oneXTwo: { homeWin: number; draw: number; awayWin: number }) =>
    Math.max(
      Math.abs(oneXTwo.homeWin - baselineOneXTwo.homeWin),
      Math.abs(oneXTwo.draw - baselineOneXTwo.draw),
      Math.abs(oneXTwo.awayWin - baselineOneXTwo.awayWin),
    ) <= probabilityCap + 1e-9;
  const rawOneXTwo = buildComparableOneXTwo(adjustedDifference, adjustedTotal);
  if (!deltaWithinCap(rawOneXTwo)) {
    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 16; iteration += 1) {
      const mid = (low + high) / 2;
      const oneXTwo = buildComparableOneXTwo(
        baseline.difference + diffDelta * mid,
        baseline.total + totalDelta * mid,
      );
      if (deltaWithinCap(oneXTwo)) {
        low = mid;
      } else {
        high = mid;
      }
    }
    adjustedDifference = baseline.difference + diffDelta * low;
    adjustedTotal = baseline.total + totalDelta * low;
    capsApplied.push("one_x_two_delta_cap");
  }
  const expectedGoals = diffToHomeAway(adjustedDifference, adjustedTotal);
  return {
    expectedGoals: {
      home: expectedGoals.home,
      away: expectedGoals.away,
      total: round(expectedGoals.home + expectedGoals.away, 4),
      difference: round(expectedGoals.home - expectedGoals.away, 4),
    },
    internalAudit: {
      v1ExpectedGoalDifference: baseline.difference,
      v1ExpectedTotalGoals: baseline.total,
      signalAdjustments: {
        structuralDisagreement: round(structuralDisagreement, 4),
        recentForm: round(recentForm, 4),
        attack: round(attack, 4),
        defense: round(defense, 4),
        opponentAdjustment: round(opponentAdjustment, 4),
        tournamentForm: round(tournamentForm, 4),
        venueContext: round(venueContext, 4),
        reliabilityShrinkage: round(unshrunkDiffDelta * (reliabilityScale - 1), 4),
      },
      finalExpectedGoalDifference: round(expectedGoals.home - expectedGoals.away, 4),
      finalExpectedTotalGoals: round(expectedGoals.home + expectedGoals.away, 4),
      capsApplied,
    } satisfies PredictionAdjustmentAudit,
  };
}

export function buildChallengerPrediction(args: {
  candidate: Task2ModelCandidateConfig;
  features: MatchFeatureVector;
}) {
  const { candidate, features } = args;
  if (candidate.modelFamily === "v1_baseline") {
    const baseline = buildBaselineExpectedGoals(features);
    const home = clamp((baseline.total + baseline.difference) / 2, 0.2, 3.8);
    const away = clamp((baseline.total - baseline.difference) / 2, 0.2, 3.8);
    return buildPredictionFromExpectedGoals({
      candidate,
      features,
      expectedGoals: {
        home,
        away,
        total: round(home + away, 4),
        difference: round(home - away, 4),
      },
      internalAudit: {
        v1ExpectedGoalDifference: baseline.difference,
        v1ExpectedTotalGoals: baseline.total,
        signalAdjustments: {
          structuralDisagreement: 0,
          recentForm: 0,
          attack: 0,
          defense: 0,
          opponentAdjustment: 0,
          tournamentForm: 0,
          venueContext: 0,
          reliabilityShrinkage: 0,
        },
        finalExpectedGoalDifference: baseline.difference,
        finalExpectedTotalGoals: baseline.total,
        capsApplied: [],
      },
    });
  }
  if (candidate.modelFamily === "bounded_hybrid") {
    const bounded = buildBoundedHybridExpectedGoals(candidate, features);
    return buildPredictionFromExpectedGoals({
      candidate,
      features,
      expectedGoals: bounded.expectedGoals,
      internalAudit: bounded.internalAudit,
    });
  }
  const reliability = (features.home.subScores.reliability + features.away.subScores.reliability) / 2;
  const homeStrength =
    features.home.subScores.baselineStrength * candidate.effectiveStrengthWeights.structural +
    features.home.subScores.recentForm * candidate.effectiveStrengthWeights.recentForm +
    features.home.subScores.tournamentForm * candidate.effectiveStrengthWeights.tournamentForm +
    features.home.subScores.attack * candidate.effectiveStrengthWeights.attack +
    features.home.subScores.defense * candidate.effectiveStrengthWeights.defense +
    features.home.subScores.performanceVsExpectation * candidate.effectiveStrengthWeights.expectation +
    features.home.subScores.reliability * candidate.effectiveStrengthWeights.reliability;
  const awayStrength =
    features.away.subScores.baselineStrength * candidate.effectiveStrengthWeights.structural +
    features.away.subScores.recentForm * candidate.effectiveStrengthWeights.recentForm +
    features.away.subScores.tournamentForm * candidate.effectiveStrengthWeights.tournamentForm +
    features.away.subScores.attack * candidate.effectiveStrengthWeights.attack +
    features.away.subScores.defense * candidate.effectiveStrengthWeights.defense +
    features.away.subScores.performanceVsExpectation * candidate.effectiveStrengthWeights.expectation +
    features.away.subScores.reliability * candidate.effectiveStrengthWeights.reliability;
  const expectedGoalDifference = clamp(
    features.derived.structuralGap * candidate.expectedGoalDifference.structuralGap +
    features.derived.recentGap * candidate.expectedGoalDifference.recentGap +
    features.derived.tournamentGap * candidate.expectedGoalDifference.tournamentGap +
    features.derived.attackDefenseGap * candidate.expectedGoalDifference.attackDefenseGap +
    features.derived.expectationGap * candidate.expectedGoalDifference.expectationGap +
    (features.home.subScores.reliability - features.away.subScores.reliability) * candidate.expectedGoalDifference.reliabilityTilt,
    -2.4,
    2.4,
  );
  const favoriteControl = Math.abs(homeStrength - awayStrength);
  const expectedTotalGoals = clamp(
    candidate.expectedTotalGoals.base +
    features.derived.combinedAttackIntent * candidate.expectedTotalGoals.combinedAttack +
    (1 - features.derived.combinedDefensiveResistance) * candidate.expectedTotalGoals.combinedDefense +
    features.derived.combinedOpenPlay * candidate.expectedTotalGoals.combinedOpenPlay +
    clamp(features.derived.combinedTournamentOpenPlay, 0, 1) * candidate.expectedTotalGoals.combinedTournamentOpenPlay +
    favoriteControl * candidate.expectedTotalGoals.favoriteControl +
    (1 - reliability) * candidate.expectedTotalGoals.reliabilityDrag,
    1.45,
    4.4,
  );
  const rawHomeXg = (expectedTotalGoals + expectedGoalDifference) / 2;
  const rawAwayXg = (expectedTotalGoals - expectedGoalDifference) / 2;
  const homeXg = clamp(rawHomeXg, 0.2, 3.8);
  const awayXg = clamp(rawAwayXg, 0.2, 3.8);
  const normalizedTotal = homeXg + awayXg;
  return buildPredictionFromExpectedGoals({
    candidate,
    features,
    expectedGoals: {
      home: round(homeXg, 4),
      away: round(awayXg, 4),
      total: round(normalizedTotal, 4),
      difference: round(homeXg - awayXg, 4),
    },
  });
}

function bucketLabel(probability: number) {
  if (probability < 0.4) return "0.00-0.39";
  if (probability < 0.5) return "0.40-0.49";
  if (probability < 0.6) return "0.50-0.59";
  return "0.60+";
}

function actualScoreProbability(prediction: PredictionLike, actualScore: string) {
  if ("scoreMatrixTailMass" in prediction && prediction.scoreMatrixTailMass !== null) {
    const candidate = prediction.topScorelines.find((scoreline) => scoreline.score === actualScore);
    return candidate?.probability ?? 0;
  }
  const candidate = prediction.topScorelines.find((scoreline) => scoreline.score === actualScore);
  return candidate?.probability ?? null;
}

function favoriteFromOneXTwo(prediction: PredictionLike): MatchOutcomeKey {
  const values = [
    { key: "home" as const, value: prediction.homeWin },
    { key: "draw" as const, value: prediction.draw },
    { key: "away" as const, value: prediction.awayWin },
  ].sort((left, right) => right.value - left.value);
  return values[0]?.key ?? "draw";
}

export function parseOriginalPrediction(row: ProductPredictionRow, markets: ProductPredictionMarketRow[]): PredictionLike {
  const storedTopScorelines = Array.isArray(row.top_scores_json)
    ? (row.top_scores_json as Array<{ score?: string; probability?: number }>)
        .filter((entry) => typeof entry.score === "string" && typeof entry.probability === "number")
        .map((entry) => ({ score: entry.score!, probability: Number(entry.probability) / 100 }))
    : [];
  const reconstructedMatrix = buildScoreMatrixWithTail(
    { home: row.expected_home_goals, away: row.expected_away_goals },
    8,
  );
  const reconstructedTopScorelines = [...reconstructedMatrix.matrix]
    .sort(compareByProbability)
    .slice(0, 8)
    .map((entry) => ({
      score: `${entry.homeGoals}-${entry.awayGoals}`,
      probability: round(entry.probability, 6),
    }));
  const topScorelines = storedTopScorelines.length >= 5 ? storedTopScorelines : reconstructedTopScorelines;
  const pickMarket = (market: string, selection: string) =>
    markets.find((entry) => entry.market === market && entry.selection === selection)?.probability ?? null;
  return {
    homeWin: row.home_win_prob / 100,
    draw: row.draw_prob / 100,
    awayWin: row.away_win_prob / 100,
    expectedHomeGoals: row.expected_home_goals,
    expectedAwayGoals: row.expected_away_goals,
    mostLikelyScore: row.most_likely_score,
    topScorelines,
    bttsYes: safeNumber(pickMarket("btts", "yes")) != null ? Number(pickMarket("btts", "yes")) / 100 : null,
    bttsNo: safeNumber(pickMarket("btts", "no")) != null ? Number(pickMarket("btts", "no")) / 100 : null,
    over25: safeNumber(pickMarket("over_2_5", "over")) != null ? Number(pickMarket("over_2_5", "over")) / 100 : null,
    under25: safeNumber(pickMarket("over_2_5", "under")) != null ? Number(pickMarket("over_2_5", "under")) / 100 : null,
    scoreMatrixTailMass: reconstructedMatrix.tailMass,
    scoreMatrixSource: storedTopScorelines.length >= 5 ? "stored_top_scores" : "reconstructed_from_xg",
  };
}

function parseChallengerPrediction(prediction: ChallengerPrediction): PredictionLike {
  return {
    homeWin: prediction.probabilities.oneXTwo.homeWin,
    draw: prediction.probabilities.oneXTwo.draw,
    awayWin: prediction.probabilities.oneXTwo.awayWin,
    expectedHomeGoals: prediction.expectedGoals.home,
    expectedAwayGoals: prediction.expectedGoals.away,
    mostLikelyScore: prediction.mostLikelyScore,
    topScorelines: prediction.topScorelines.map((scoreline) => ({
      score: scoreline.score,
      probability: scoreline.probability,
    })),
    bttsYes: prediction.probabilities.btts.yes,
    bttsNo: prediction.probabilities.btts.no,
    over25: prediction.probabilities.overUnder25.over,
    under25: prediction.probabilities.overUnder25.under,
    scoreMatrixTailMass: prediction.scoreMatrixTailMass,
  };
}

function multiclassBrier(prediction: PredictionLike, actualOutcome: MatchOutcomeKey) {
  const outcomes = actualOutcome === "home" ? [1, 0, 0] : actualOutcome === "draw" ? [0, 1, 0] : [0, 0, 1];
  const probabilities = [prediction.homeWin, prediction.draw, prediction.awayWin];
  return round(
    probabilities.reduce((total, probability, index) => total + (probability - outcomes[index]!) ** 2, 0) / 3,
    6,
  );
}

function logLoss(prediction: PredictionLike, actualOutcome: MatchOutcomeKey) {
  const probability =
    actualOutcome === "home" ? prediction.homeWin : actualOutcome === "draw" ? prediction.draw : prediction.awayWin;
  return round(-Math.log(Math.max(probability, 1e-9)), 6);
}

function computeReplayMetrics(rows: Array<{
  prediction: PredictionLike;
  actual: { homeGoals: number; awayGoals: number; outcome: MatchOutcomeKey; score: string };
}>) {
  const calibrationBuckets = new Map<string, Array<{ predicted: number; hit: boolean }>>();
  const scoreTop1 = rows.filter((row) => row.prediction.mostLikelyScore === row.actual.score).length;
  const scoreTop3 = rows.filter((row) => row.prediction.topScorelines.slice(0, 3).some((entry) => entry.score === row.actual.score)).length;
  const scoreTop5 = rows.filter((row) => row.prediction.topScorelines.slice(0, 5).some((entry) => entry.score === row.actual.score)).length;
  let outcomeCorrect = 0;
  let favoriteCorrect = 0;
  let bttsEvaluated = 0;
  let bttsCorrect = 0;
  let over25Evaluated = 0;
  let over25Correct = 0;
  const brierValues: number[] = [];
  const logLossValues: number[] = [];
  const totalGoalErrors: number[] = [];
  const goalDiffErrors: number[] = [];
  const bttsBrierValues: number[] = [];
  const over25BrierValues: number[] = [];
  const actualScoreProbabilities: number[] = [];
  const tailMassValues: number[] = [];

  for (const row of rows) {
    brierValues.push(multiclassBrier(row.prediction, row.actual.outcome));
    logLossValues.push(logLoss(row.prediction, row.actual.outcome));
    totalGoalErrors.push(Math.abs((row.prediction.expectedHomeGoals + row.prediction.expectedAwayGoals) - (row.actual.homeGoals + row.actual.awayGoals)));
    goalDiffErrors.push(Math.abs((row.prediction.expectedHomeGoals - row.prediction.expectedAwayGoals) - (row.actual.homeGoals - row.actual.awayGoals)));
    const predictedOutcome = favoriteFromOneXTwo(row.prediction);
    if (predictedOutcome === row.actual.outcome) {
      outcomeCorrect += 1;
    }
    const favoriteSide = row.prediction.homeWin >= row.prediction.awayWin ? "home" : "away";
    if ((favoriteSide === "home" && row.actual.homeGoals > row.actual.awayGoals) || (favoriteSide === "away" && row.actual.awayGoals > row.actual.homeGoals)) {
      favoriteCorrect += 1;
    }
    const topProbability = Math.max(row.prediction.homeWin, row.prediction.draw, row.prediction.awayWin);
    const bucket = bucketLabel(topProbability);
    const list = calibrationBuckets.get(bucket) ?? [];
    list.push({ predicted: topProbability, hit: predictedOutcome === row.actual.outcome });
    calibrationBuckets.set(bucket, list);
    const actualBtts = row.actual.homeGoals > 0 && row.actual.awayGoals > 0;
    if (row.prediction.bttsYes != null && row.prediction.bttsNo != null) {
      bttsEvaluated += 1;
      const yes = row.prediction.bttsYes;
      const no = row.prediction.bttsNo;
      bttsBrierValues.push(round(((yes - (actualBtts ? 1 : 0)) ** 2 + (no - (actualBtts ? 0 : 1)) ** 2) / 2, 6));
      const predictedBtts = yes >= no;
      if (predictedBtts === actualBtts) {
        bttsCorrect += 1;
      }
    }
    const actualOver25 = row.actual.homeGoals + row.actual.awayGoals > 2;
    if (row.prediction.over25 != null && row.prediction.under25 != null) {
      over25Evaluated += 1;
      const over = row.prediction.over25;
      const under = row.prediction.under25;
      over25BrierValues.push(round(((over - (actualOver25 ? 1 : 0)) ** 2 + (under - (actualOver25 ? 0 : 1)) ** 2) / 2, 6));
      const predictedOver = over >= under;
      if (predictedOver === actualOver25) {
        over25Correct += 1;
      }
    }
    const actualProbability = actualScoreProbability(row.prediction, row.actual.score);
    if (actualProbability != null) {
      actualScoreProbabilities.push(actualProbability);
    }
    if (row.prediction.scoreMatrixTailMass != null) {
      tailMassValues.push(row.prediction.scoreMatrixTailMass);
    }
  }

  return {
    fixtureCount: rows.length,
    oneXTwo: {
      multiclassBrier: average(brierValues, 6),
      logLoss: average(logLossValues, 6),
      outcomeAccuracy: rate(outcomeCorrect, rows.length, 6),
      favoriteAccuracy: rate(favoriteCorrect, rows.length, 6),
      calibrationByBucket: ["0.00-0.39", "0.40-0.49", "0.50-0.59", "0.60+"].map((bucket) => {
        const values = calibrationBuckets.get(bucket) ?? [];
        return {
          bucket,
          fixtureCount: values.length,
          averagePredicted: average(values.map((entry) => entry.predicted), 6),
          actualHitRate: rate(values.filter((entry) => entry.hit).length, values.length, 6),
        };
      }),
    },
    goalsAndMarkets: {
      totalGoalsMae: average(totalGoalErrors, 6),
      goalDifferenceMae: average(goalDiffErrors, 6),
      bttsBrier: average(bttsBrierValues, 6),
      bttsAccuracy: rate(bttsCorrect, bttsEvaluated, 6),
      over25Brier: average(over25BrierValues, 6),
      over25Accuracy: rate(over25Correct, over25Evaluated, 6),
    },
    scoreDistribution: {
      exactScoreTop1Coverage: rate(scoreTop1, rows.length, 6),
      exactScoreTop3Coverage: rate(scoreTop3, rows.length, 6),
      exactScoreTop5Coverage: rows.some((row) => row.prediction.topScorelines.length >= 5) ? rate(scoreTop5, rows.length, 6) : null,
      actualScoreProbability: average(actualScoreProbabilities, 6),
      scoreMatrixTailMass: average(tailMassValues, 6),
    },
  } satisfies ReplayMetricSummary;
}

export function buildValidationSelectionAudit(evaluations: Array<{
  candidate: Task2ModelCandidateConfig;
  validationMetrics: ReplayMetricSummary;
}>) {
  const brierFloor = Math.min(...evaluations.map((entry) => entry.validationMetrics.oneXTwo.multiclassBrier ?? Number.POSITIVE_INFINITY));
  const brierTolerance = 0.0005;
  const brierPool = evaluations.filter(
    (entry) => (entry.validationMetrics.oneXTwo.multiclassBrier ?? Number.POSITIVE_INFINITY) <= brierFloor + brierTolerance,
  );
  const logLossFloor = Math.min(...brierPool.map((entry) => entry.validationMetrics.oneXTwo.logLoss ?? Number.POSITIVE_INFINITY));
  const logLossTolerance = 0.001;
  const logLossPool = brierPool.filter(
    (entry) => (entry.validationMetrics.oneXTwo.logLoss ?? Number.POSITIVE_INFINITY) <= logLossFloor + logLossTolerance,
  );
  const ranked = [...evaluations]
    .map((entry) => {
      const metrics = entry.validationMetrics;
      const brier = metrics.oneXTwo.multiclassBrier ?? Number.POSITIVE_INFINITY;
      const logLoss = metrics.oneXTwo.logLoss ?? Number.POSITIVE_INFINITY;
      const totalGoalsMae = metrics.goalsAndMarkets.totalGoalsMae ?? Number.POSITIVE_INFINITY;
      const goalDifferenceMae = metrics.goalsAndMarkets.goalDifferenceMae ?? Number.POSITIVE_INFINITY;
      const outcomeAccuracy = -(metrics.oneXTwo.outcomeAccuracy ?? -1);
      const favoriteAccuracy = -(metrics.oneXTwo.favoriteAccuracy ?? -1);
      const tieBreakOrder = [brier, logLoss, totalGoalsMae, goalDifferenceMae, outcomeAccuracy, favoriteAccuracy];
      return {
        candidate: entry.candidate,
        validationMetrics: entry.validationMetrics,
        selectionAudit: {
          multiclassBrier: metrics.oneXTwo.multiclassBrier,
          brierFromBest: metrics.oneXTwo.multiclassBrier == null ? null : round(metrics.oneXTwo.multiclassBrier - brierFloor, 6),
          withinBrierTolerance: brier <= brierFloor + brierTolerance,
          logLoss: metrics.oneXTwo.logLoss,
          logLossFromBestWithinToleranceSet: metrics.oneXTwo.logLoss == null ? null : round(metrics.oneXTwo.logLoss - logLossFloor, 6),
          withinLogLossTolerance: logLoss <= logLossFloor + logLossTolerance,
          totalGoalsMae: metrics.goalsAndMarkets.totalGoalsMae,
          goalDifferenceMae: metrics.goalsAndMarkets.goalDifferenceMae,
          outcomeAccuracy: metrics.oneXTwo.outcomeAccuracy,
          favoriteAccuracy: metrics.oneXTwo.favoriteAccuracy,
          tieBreakOrder,
          validationSelectionScore: round(
            (metrics.oneXTwo.multiclassBrier ?? 1) * 0.35 +
              (metrics.oneXTwo.logLoss ?? 1) * 0.3 +
              (metrics.goalsAndMarkets.totalGoalsMae ?? 2) * 0.15 +
              (metrics.goalsAndMarkets.goalDifferenceMae ?? 2) * 0.1 +
              (1 - (metrics.oneXTwo.outcomeAccuracy ?? 0)) * 0.1,
            6,
          ),
        },
      } satisfies CandidateReplayEvaluation;
    })
    .sort((left, right) => {
      for (let index = 0; index < left.selectionAudit.tieBreakOrder.length; index += 1) {
        const delta = left.selectionAudit.tieBreakOrder[index]! - right.selectionAudit.tieBreakOrder[index]!;
        if (delta !== 0) {
          return delta;
        }
      }
      return left.candidate.key.localeCompare(right.candidate.key);
    });
  return {
    ranked,
    rule: {
      primary: "lowest_multiclass_brier",
      brierTolerance,
      secondary: "lowest_log_loss_within_brier_tolerance",
      logLossTolerance,
      tertiary: ["lowest_total_goals_mae", "lowest_goal_difference_mae"],
      tieBreakers: ["highest_outcome_accuracy", "highest_favorite_accuracy", "stable_key_order"],
    },
    winner: ranked[0]!,
  };
}

export function evaluateScenarioRows(rows: Array<{
  actual: { homeGoals: number; awayGoals: number; outcome: MatchOutcomeKey };
  prediction: ChallengerPrediction;
  favoriteSide: MatchOutcomeKey;
}>) {
  const perFixture = rows.map((row) => {
    const actualFamily = familyCodeForScore({
      homeGoals: row.actual.homeGoals,
      awayGoals: row.actual.awayGoals,
      favoriteSide: row.favoriteSide,
    });
    const selectedFamilies = row.prediction.scenarios.map((scenario) => scenario.familyCode);
    const selectedContracts = selectedFamilies.map((familyCode) => scenarioFamilyContract(familyCode));
    const matchesAnyDisplayedFamily = selectedFamilies.some((familyCode) =>
      familyMatchesScore({
        familyCode,
        homeGoals: row.actual.homeGoals,
        awayGoals: row.actual.awayGoals,
        favoriteSide: row.favoriteSide,
      }),
    );
    return {
      actualFamily,
      selectedFamilies,
      selectedContracts,
      correctOneXTwoFamily: selectedContracts.some((contract) =>
        contract.outcome === "draw"
          ? row.actual.outcome === "draw"
          : contract.outcome === "favorite"
            ? row.actual.outcome === row.favoriteSide
            : contract.outcome === "underdog"
              ? row.actual.outcome !== "draw" && row.actual.outcome !== row.favoriteSide
              : row.actual.outcome !== "draw",
      ),
      correctWinningMarginFamily: selectedContracts.some((contract) =>
        contract.winningMargin === "non_draw_any"
          ? winningMarginCode(row.actual.homeGoals, row.actual.awayGoals) !== "draw_margin"
          : contract.winningMargin === winningMarginCode(row.actual.homeGoals, row.actual.awayGoals),
      ),
      correctTotalGoalRange: selectedContracts.some(
        (contract) => contract.totalGoalRange === totalRangeCode(row.actual.homeGoals, row.actual.awayGoals),
      ),
      mainScenarioMaterialized: row.prediction.scenarios[0]?.familyCode === actualFamily,
      riskScenarioMaterialized:
        row.prediction.scenarios
          .filter((scenario) => scenario.scenarioType !== "main")
          .some((scenario) => scenario.familyCode === actualFamily),
      resultOutsideAllThreeScenarioFamilies: !matchesAnyDisplayedFamily,
    };
  });
  const outsideAndMatched = perFixture.filter(
    (row) => row.resultOutsideAllThreeScenarioFamilies && row.selectedFamilies.includes(row.actualFamily),
  );
  if (outsideAndMatched.length > 0) {
    throw new Error("Scenario evaluator inconsistency: fixture cannot be outside all three families and inside a displayed family.");
  }
  return {
    fixtureCount: rows.length,
    correctOneXTwoFamily: rate(perFixture.filter((row) => row.correctOneXTwoFamily).length, rows.length, 6),
    correctWinningMarginFamily: rate(perFixture.filter((row) => row.correctWinningMarginFamily).length, rows.length, 6),
    correctTotalGoalRange: rate(perFixture.filter((row) => row.correctTotalGoalRange).length, rows.length, 6),
    mainScenarioMaterialized: rate(perFixture.filter((row) => row.mainScenarioMaterialized).length, rows.length, 6),
    riskScenarioMaterialized: rate(perFixture.filter((row) => row.riskScenarioMaterialized).length, rows.length, 6),
    resultOutsideAllThreeScenarioFamilies: rate(
      perFixture.filter((row) => row.resultOutsideAllThreeScenarioFamilies).length,
      rows.length,
      6,
    ),
    perFixture,
  };
}

function teamCoverage(rows: Array<{ homeTeamKey: string; awayTeamKey: string }>) {
  return Array.from(new Set(rows.flatMap((row) => [row.homeTeamKey, row.awayTeamKey]))).sort();
}

function isWorldCupCanonicalFixture(fact: HistoricalMatchFact) {
  return WORLD_CUP_TEAM_SET.has(fact.team_1_key) && WORLD_CUP_TEAM_SET.has(fact.team_2_key);
}

export function buildExpandedCalibrationManifest(args: {
  historicalFacts: HistoricalMatchFact[];
  holdoutRows: ReplayFixtureRecord[];
  scheduleRows: WorldCupScheduleMatch[];
  localizations?: CanonicalTeamLocalization[];
}) {
  const localizationKeys = new Set((args.localizations ?? []).map((entry) => entry.canonical_team_key));
  const seenNaturalKeys = new Set<string>();
  const priorMatchesByTeam = new Map<string, number>();
  const includedTrainingFacts: HistoricalMatchFact[] = [];
  const includedValidationFacts: HistoricalMatchFact[] = [];
  const excludedRows: Array<{
    naturalMatchKey: string;
    sourceSnapshotId: string;
    sourceFile: string;
    matchDate: string;
    team1Key: string;
    team2Key: string;
    reasonCode: string;
  }> = [];
  const canonicalFacts = args.historicalFacts
    .map((fact) => canonicalizeHistoricalFactForReplay(fact, args.scheduleRows))
    .sort((left, right) => {
      const cutoffDelta =
        Date.parse(buildHistoricalReplayCutoff(left, args.scheduleRows).cutoffAt) -
        Date.parse(buildHistoricalReplayCutoff(right, args.scheduleRows).cutoffAt);
      if (cutoffDelta !== 0) {
        return cutoffDelta;
      }
      return left.natural_match_key.localeCompare(right.natural_match_key);
    });
  for (const fact of canonicalFacts) {
    const cutoff = buildHistoricalReplayCutoff(fact, args.scheduleRows);
    const reasonCode =
      !/^\d{4}-\d{2}-\d{2}$/.test(fact.match_date)
        ? "invalid_date"
        : seenNaturalKeys.has(fact.natural_match_key)
          ? "duplicate"
          : !fact.team_1_key || !fact.team_2_key
            ? "unresolved_team"
            : localizationKeys.size > 0 && (!localizationKeys.has(fact.team_1_key) || !localizationKeys.has(fact.team_2_key))
              ? "unresolved_team"
              : fact.score_1 == null || fact.score_2 == null
                ? "missing_result"
                : fact.team_1_key === fact.team_2_key
                  ? "unsupported_fixture_orientation"
                  : (fact.pre_match_elo_1 ?? maybePostMinusChange(fact.post_match_elo_1, fact.elo_change_1)) == null ||
                      (fact.pre_match_elo_2 ?? maybePostMinusChange(fact.post_match_elo_2, fact.elo_change_2)) == null
                    ? "missing_pre_match_elo"
                    : !fact.match_date.startsWith("2025-") &&
                        !(fact.match_date.startsWith("2026-") && Date.parse(cutoff.cutoffAt) < Date.parse(VALIDATION_CUTOFF))
                      ? "outside_calibration_window"
                      : (priorMatchesByTeam.get(fact.team_1_key) ?? 0) < 1 ||
                          (priorMatchesByTeam.get(fact.team_2_key) ?? 0) < 1
                        ? "insufficient_prior_history"
                        : null;
    if (reasonCode == null) {
      if (fact.match_date.startsWith("2025-")) {
        includedTrainingFacts.push(fact);
      } else {
        includedValidationFacts.push(fact);
      }
    } else {
      excludedRows.push({
        naturalMatchKey: fact.natural_match_key,
        sourceSnapshotId: fact.source_snapshot_id,
        sourceFile: fact.source_file,
        matchDate: fact.match_date,
        team1Key: fact.team_1_key,
        team2Key: fact.team_2_key,
        reasonCode,
      });
    }
    seenNaturalKeys.add(fact.natural_match_key);
    priorMatchesByTeam.set(fact.team_1_key, (priorMatchesByTeam.get(fact.team_1_key) ?? 0) + 1);
    priorMatchesByTeam.set(fact.team_2_key, (priorMatchesByTeam.get(fact.team_2_key) ?? 0) + 1);
  }
  const splitManifest = {
    training: {
      split: "training",
      rowCount: includedTrainingFacts.length,
      teamsCovered: teamCoverage(includedTrainingFacts.map((fact) => ({ homeTeamKey: fact.team_1_key, awayTeamKey: fact.team_2_key }))),
      rows: includedTrainingFacts.map((fact) => {
        const cutoff = buildHistoricalReplayCutoff(fact, args.scheduleRows);
        return {
          fixtureId: fact.natural_match_key,
          source: "historical_fact" as const,
          homeTeamKey: fact.team_1_key,
          awayTeamKey: fact.team_2_key,
          cutoffAt: cutoff.cutoffAt,
          matchDate: fact.match_date,
          officialMatchNumber: null,
          naturalMatchKey: fact.natural_match_key,
          datePrecision: cutoff.datePrecision,
        };
      }),
      adjustmentNote: "Training rows use recoverable 2025 national-team historical fixtures with explicit exclusion reasons for dropped rows.",
    } satisfies Task2SplitManifest,
    validation: {
      split: "validation",
      rowCount: includedValidationFacts.length,
      teamsCovered: teamCoverage(includedValidationFacts.map((fact) => ({ homeTeamKey: fact.team_1_key, awayTeamKey: fact.team_2_key }))),
      rows: includedValidationFacts.map((fact) => {
        const cutoff = buildHistoricalReplayCutoff(fact, args.scheduleRows);
        return {
          fixtureId: fact.natural_match_key,
          source: "historical_fact" as const,
          homeTeamKey: fact.team_1_key,
          awayTeamKey: fact.team_2_key,
          cutoffAt: cutoff.cutoffAt,
          matchDate: fact.match_date,
          officialMatchNumber: null,
          naturalMatchKey: fact.natural_match_key,
          datePrecision: cutoff.datePrecision,
        };
      }),
      adjustmentNote:
        "Validation rows use 2026 fixtures strictly before the World Cup holdout window, with date-only evidence restricted to earlier calendar dates.",
    } satisfies Task2SplitManifest,
    holdout: {
      split: "holdout",
      rowCount: args.holdoutRows.length,
      teamsCovered: teamCoverage(args.holdoutRows.map((row) => ({ homeTeamKey: row.homeTeamKey, awayTeamKey: row.awayTeamKey }))),
      rows: args.holdoutRows.map((row) => ({
        fixtureId: row.fixtureId,
        source: "world_cup_product" as const,
        homeTeamKey: row.homeTeamKey,
        awayTeamKey: row.awayTeamKey,
        cutoffAt: row.kickoffAt,
        matchDate: row.kickoffAt.slice(0, 10),
        officialMatchNumber: row.officialMatchNumber,
        naturalMatchKey: null,
        datePrecision: "exact" as const,
      })),
      adjustmentNote: null,
    } satisfies Task2SplitManifest,
  };
  const reasonCounts = excludedRows.reduce<Record<string, number>>((accumulator, row) => {
    accumulator[row.reasonCode] = (accumulator[row.reasonCode] ?? 0) + 1;
    return accumulator;
  }, {});
  const reasonCountsBySource = excludedRows.reduce<Record<string, Record<string, number>>>((accumulator, row) => {
    const sourceBucket = accumulator[row.sourceSnapshotId] ?? {};
    sourceBucket[row.reasonCode] = (sourceBucket[row.reasonCode] ?? 0) + 1;
    accumulator[row.sourceSnapshotId] = sourceBucket;
    return accumulator;
  }, {});
  return {
    splitManifest,
    audit: {
      totalHistoricalFacts: canonicalFacts.length,
      includedTrainingRows: includedTrainingFacts.length,
      includedValidationRows: includedValidationFacts.length,
      excludedRows: excludedRows.length,
      reasonCounts,
      reasonCountsBySource,
      excludedExamples: excludedRows.slice(0, 50),
    },
  };
}

export function buildTrainingValidationHoldoutManifest(args: {
  historicalFacts: HistoricalMatchFact[];
  holdoutRows: ReplayFixtureRecord[];
  scheduleRows: WorldCupScheduleMatch[];
  localizations?: CanonicalTeamLocalization[];
}) {
  return buildExpandedCalibrationManifest(args).splitManifest;
}

function buildHistoricalFeatureCoverage(rows: MatchFeatureVector[]) {
  const nullCounts: Record<string, number> = {};
  const visit = (prefix: string, value: unknown) => {
    if (value == null) {
      nullCounts[prefix] = (nullCounts[prefix] ?? 0) + 1;
      return;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      for (const [key, nested] of Object.entries(value)) {
        visit(`${prefix}.${key}`, nested);
      }
    }
  };
  for (const row of rows) {
    visit("home", row.home);
    visit("away", row.away);
  }
  return {
    fixtureCount: rows.length,
    nullCounts,
  };
}

function buildHistoricalResultIndex(rows: HistoricalMatchFact[], scheduleRows: WorldCupScheduleMatch[]) {
  const index = new Map<string, HistoricalMatchFact>();
  for (const row of rows) {
    const canonical = canonicalizeHistoricalFactForReplay(row, scheduleRows);
    const cutoff = buildHistoricalReplayCutoff(canonical, scheduleRows);
    index.set(canonical.natural_match_key, {
      ...canonical,
      source_snapshot_id: canonical.source_snapshot_id,
    });
    index.set(`${canonical.team_1_key}::${canonical.team_2_key}::${cutoff.cutoffAt}`, canonical);
  }
  return index;
}

async function loadPredictionRows(args: {
  matchIds: string[];
  order: "earliest" | "latest";
}) {
  const supabase = createSupabaseScriptAdminClient();
  const { data, error } = await supabase
    .from("prediction_versions")
    .select("id, match_id, model_version_id, prediction_type, home_win_prob, draw_prob, away_win_prob, expected_home_goals, expected_away_goals, most_likely_score, top_scores_json, confidence_score, risk_level, run_scope, created_at")
    .in("match_id", args.matchIds)
    .order("created_at", { ascending: args.order === "earliest" })
    .order("id", { ascending: args.order === "earliest" });
  if (error) {
    throw new Error(`Failed to load prediction versions for Task 2: ${error.message}`);
  }
  const rows = (data ?? []) as ProductPredictionRow[];
  const byMatchId = new Map<string, ProductPredictionRow>();
  for (const row of rows) {
    if (!byMatchId.has(row.match_id)) {
      byMatchId.set(row.match_id, row);
    }
  }
  const versionIds = [...new Set([...byMatchId.values()].map((row) => row.id))];
  const { data: marketData, error: marketError } =
    versionIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("prediction_markets")
          .select("prediction_version_id, market, selection, probability")
          .in("prediction_version_id", versionIds);
  if (marketError) {
    throw new Error(`Failed to load prediction markets for Task 2: ${marketError.message}`);
  }
  const marketsByPredictionId = new Map<string, ProductPredictionMarketRow[]>();
  for (const row of (marketData ?? []) as ProductPredictionMarketRow[]) {
    const current = marketsByPredictionId.get(row.prediction_version_id) ?? [];
    current.push(row);
    marketsByPredictionId.set(row.prediction_version_id, current);
  }
  return {
    byMatchId,
    marketsByPredictionId,
  };
}

function buildProductMatchMap(productInventory: ProductReplayInventory) {
  return new Map(productInventory.matches.map((match) => [match.id, match]));
}

function buildTask2ScheduleLinks(args: {
  scheduleRows: WorldCupScheduleMatch[];
  providerFixtures: Awaited<ReturnType<typeof fetchApiFootballFixturesByLeague>>;
  aliases: CanonicalTeamAlias[];
  localizations: CanonicalTeamLocalization[];
}) {
  const aliasesByTeam = buildAliasIndex(args.aliases);
  const localizationsByTeam = buildLocalizationIndex(args.localizations);
  return args.scheduleRows.map((row) =>
    matchProviderFixture(row, args.providerFixtures, aliasesByTeam, localizationsByTeam),
  );
}

function buildReplayFixtureRecords(args: {
  manifest: ReplayCoverageManifestEntryV2[];
  productInventory: ProductReplayInventory;
  localizations: CanonicalTeamLocalization[];
  historicalFacts: HistoricalMatchFact[];
  eloCurrent: RatingSnapshotRow[];
  eloStart2026: RatingSnapshotRow[];
  fifaRanking: RatingSnapshotRow[];
  scheduleRows: WorldCupScheduleMatch[];
  predictionRows: Map<string, ProductPredictionRow>;
  predictionMarkets: Map<string, ProductPredictionMarketRow[]>;
  refreshResults: RefreshResultLike[];
}) {
  const localizationByKey = buildLocalizationIndex(args.localizations);
  const resultsByMatchId = args.productInventory.resultsByMatchId;
  const byProductMatchId = buildProductMatchMap(args.productInventory);
  const refreshByFixtureId = new Map(args.refreshResults.map((entry) => [entry.provider_fixture_id, entry]));
  return args.manifest
    .filter((entry) => entry.replay_readiness === "ready")
    .map((entry) => {
      const productMatch = byProductMatchId.get(entry.product_match_id);
      const productResult = resultsByMatchId.get(entry.product_match_id);
      const originalPrediction = args.predictionRows.get(entry.product_match_id);
      if (!productMatch || !originalPrediction || !entry.canonical_home_team_key || !entry.canonical_away_team_key) {
        throw new Error(`Incomplete holdout replay inventory for ${entry.product_match_id}.`);
      }
      const scheduleMatch =
        entry.official_match_number != null
          ? args.scheduleRows.find((row) => row.official_match_number === entry.official_match_number) ?? null
          : null;
      const canonicalHistoricalFact =
        scheduleMatch == null
          ? null
          : args.historicalFacts
              .map((fact) => canonicalizeHistoricalFactForReplay(fact, args.scheduleRows))
              .find(
                (fact) =>
                  fact.match_date === scheduleMatch.scheduled_date_et &&
                  fact.team_1_key === scheduleMatch.home_team_key &&
                  fact.team_2_key === scheduleMatch.away_team_key,
              ) ?? null;
      const refreshedResult =
        entry.api_football_fixture_id != null ? refreshByFixtureId.get(entry.api_football_fixture_id) ?? null : null;
      const actualHomeGoals =
        productResult?.home_goals ?? canonicalHistoricalFact?.score_1 ?? refreshedResult?.provider_score.home ?? null;
      const actualAwayGoals =
        productResult?.away_goals ?? canonicalHistoricalFact?.score_2 ?? refreshedResult?.provider_score.away ?? null;
      if (actualHomeGoals == null || actualAwayGoals == null) {
        throw new Error(`Incomplete replay result chain for ${entry.product_match_id}.`);
      }
      const replayInput = buildPredictionIntelligenceV2ReplayInput({
        cutoffAt: entry.kickoff_utc,
        homeTeamKey: entry.canonical_home_team_key,
        awayTeamKey: entry.canonical_away_team_key,
        historicalFacts: args.historicalFacts,
        aliases: [],
        eloCurrent: args.eloCurrent,
        eloStart2026: args.eloStart2026,
        fifaRanking: args.fifaRanking,
        localizations: args.localizations,
        schedule: args.scheduleRows,
      });
      return {
        fixtureId: productMatch.slug,
        productMatchId: productMatch.id,
        officialMatchNumber: entry.official_match_number,
        apiFootballFixtureId: entry.api_football_fixture_id,
        kickoffAt: entry.kickoff_utc,
        homeTeamKey: entry.canonical_home_team_key,
        awayTeamKey: entry.canonical_away_team_key,
        homeNameEn: localizationByKey.get(entry.canonical_home_team_key)?.display_name_en ?? entry.canonical_home_team_key,
        awayNameEn: localizationByKey.get(entry.canonical_away_team_key)?.display_name_en ?? entry.canonical_away_team_key,
        homeNameEs: localizationByKey.get(entry.canonical_home_team_key)?.display_name_es ?? entry.canonical_home_team_key,
        awayNameEs: localizationByKey.get(entry.canonical_away_team_key)?.display_name_es ?? entry.canonical_away_team_key,
        sourceSnapshotIds: replayInput.sourceSnapshotIds,
        homeSignal: replayInput.homeSignal,
        awaySignal: replayInput.awaySignal,
        actual: {
          homeGoals: actualHomeGoals,
          awayGoals: actualAwayGoals,
          score: `${actualHomeGoals}-${actualAwayGoals}`,
          outcome: outcomeFromGoals(actualHomeGoals, actualAwayGoals),
        },
        originalPrediction,
        originalMarkets: args.predictionMarkets.get(originalPrediction.id) ?? [],
      } satisfies ReplayFixtureRecord;
    });
}

export function filterFutureFixturesByCutoff<T extends { kickoffAt: string }>(fixtures: T[], generationCutoff: string) {
  return fixtures.filter((fixture) => fixture.kickoffAt > generationCutoff);
}

function buildFutureFixtureRecords(args: {
  productInventory: ProductReplayInventory;
  localizations: CanonicalTeamLocalization[];
  venues: WorldCupVenue[];
  historicalFacts: HistoricalMatchFact[];
  eloCurrent: RatingSnapshotRow[];
  eloStart2026: RatingSnapshotRow[];
  fifaRanking: RatingSnapshotRow[];
  scheduleRows: WorldCupScheduleMatch[];
  scheduleLinks: Array<{
    official_match_number: number;
    provider_fixture_id: number | null;
  }>;
  generationCutoff: string;
  latestPredictionRows: Map<string, ProductPredictionRow>;
  latestPredictionMarkets: Map<string, ProductPredictionMarketRow[]>;
}) {
  const localizationByKey = buildLocalizationIndex(args.localizations);
  const venueByKey = new Map(args.venues.map((venue) => [venue.venue_key, venue]));
  const scheduleByMatchNumber = new Map(args.scheduleRows.map((row) => [row.official_match_number, row]));
  const futureMatches = filterFutureFixturesByCutoff(
    args.productInventory.matches
      .map((match) => {
        const fixtureId = match.external_id ? Number(match.external_id.split(":").at(-1)) : null;
        const linkedMatchNumber =
          fixtureId == null
            ? null
            : args.scheduleLinks.find((link) => link.provider_fixture_id === fixtureId)?.official_match_number ?? null;
        const scheduleMatch =
          linkedMatchNumber != null
            ? scheduleByMatchNumber.get(linkedMatchNumber) ?? null
            : args.scheduleRows.find((row) => Date.parse(row.scheduled_at_utc) === Date.parse(match.kickoff_at)) ?? null;
        if (!scheduleMatch?.home_team_key || !scheduleMatch.away_team_key) {
          return null;
        }
        return {
          ...match,
          kickoffAt: match.kickoff_at,
          scheduleMatch,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null),
    args.generationCutoff,
  );
  return futureMatches.map((match) => {
    const replayInput = buildPredictionIntelligenceV2ReplayInput({
      cutoffAt: args.generationCutoff,
      homeTeamKey: match.scheduleMatch.home_team_key!,
      awayTeamKey: match.scheduleMatch.away_team_key!,
      historicalFacts: args.historicalFacts,
      aliases: [],
      eloCurrent: args.eloCurrent,
      eloStart2026: args.eloStart2026,
      fifaRanking: args.fifaRanking,
      localizations: args.localizations,
      schedule: args.scheduleRows,
    });
    const latestPrediction = args.latestPredictionRows.get(match.id) ?? null;
    return {
      productMatchId: match.id,
      apiFootballFixtureId: match.external_id ? Number(match.external_id.split(":").at(-1)) : null,
      officialMatchNumber: match.scheduleMatch.official_match_number,
      kickoffAt: match.kickoff_at,
      homeTeamKey: match.scheduleMatch.home_team_key!,
      awayTeamKey: match.scheduleMatch.away_team_key!,
      homeNameEn: localizationByKey.get(match.scheduleMatch.home_team_key!)?.display_name_en ?? match.scheduleMatch.home_team_key!,
      awayNameEn: localizationByKey.get(match.scheduleMatch.away_team_key!)?.display_name_en ?? match.scheduleMatch.away_team_key!,
      homeNameEs: localizationByKey.get(match.scheduleMatch.home_team_key!)?.display_name_es ?? match.scheduleMatch.home_team_key!,
      awayNameEs: localizationByKey.get(match.scheduleMatch.away_team_key!)?.display_name_es ?? match.scheduleMatch.away_team_key!,
      venue: venueByKey.get(match.scheduleMatch.venue_key) ?? null,
      sourceSnapshotIds: replayInput.sourceSnapshotIds,
      homeSignal: replayInput.homeSignal,
      awaySignal: replayInput.awaySignal,
      originalPrediction: latestPrediction,
      originalMarkets: latestPrediction ? args.latestPredictionMarkets.get(latestPrediction.id) ?? [] : [],
    } satisfies FutureFixtureRecord;
  });
}

export function buildPublicSafeShadowExport(args: {
  fixtures: Array<{
    productMatchId: string;
    apiFootballFixtureId: number | null;
    officialMatchNumber: number | null;
    kickoffAt: string;
    homeTeamKey: string;
    awayTeamKey: string;
    homeNameEn: string;
    awayNameEn: string;
    homeNameEs: string;
    awayNameEs: string;
    prediction: ChallengerPrediction;
  }>;
}) {
  return {
    schemaVersion: "torneo-mundialista-shadow-export-v2",
    generatedAt: new Date().toISOString(),
    source: "ufo_predictor_shadow",
    fixtures: args.fixtures.map((fixture) => ({
      productMatchId: fixture.productMatchId,
      apiFootballFixtureId: fixture.apiFootballFixtureId,
      officialMatchNumber: fixture.officialMatchNumber,
      kickoffAt: fixture.kickoffAt,
      teams: {
        home: {
          canonicalKey: fixture.homeTeamKey,
          nameEn: fixture.homeNameEn,
          nameEs: fixture.homeNameEs,
        },
        away: {
          canonicalKey: fixture.awayTeamKey,
          nameEn: fixture.awayNameEn,
          nameEs: fixture.awayNameEs,
        },
      },
      prediction: {
        oneXTwo: fixture.prediction.probabilities.oneXTwo,
        expectedGoals: {
          home: fixture.prediction.expectedGoals.home,
          away: fixture.prediction.expectedGoals.away,
        },
        scenarios: fixture.prediction.scenarios.map((scenario) => ({
          scenarioType: scenario.scenarioType,
          familyCode: scenario.familyCode,
          representativeScore: scenario.representativeScore,
          familyProbability: scenario.familyProbability,
          riskLevel: scenario.riskLevel,
        })),
        sourceCutoff: fixture.prediction.cutoffAt,
      },
    })),
  };
}

function buildPromotionGate(args: {
  validationWinner: CandidateReplayEvaluation;
  holdoutV1: ReplayMetricSummary;
  holdoutV2: ReplayMetricSummary;
  futureWarnings: number;
  validationImproved?: boolean;
  scenarioConsistent?: boolean;
  boundedFutureShifts?: boolean;
  deterministic?: boolean;
}) {
  const brierImprovement =
    args.holdoutV1.oneXTwo.multiclassBrier != null && args.holdoutV2.oneXTwo.multiclassBrier != null
      ? args.holdoutV1.oneXTwo.multiclassBrier - args.holdoutV2.oneXTwo.multiclassBrier
      : null;
  const logLossImprovement =
    args.holdoutV1.oneXTwo.logLoss != null && args.holdoutV2.oneXTwo.logLoss != null
      ? args.holdoutV1.oneXTwo.logLoss - args.holdoutV2.oneXTwo.logLoss
      : null;
  const outcomeImprovement =
    args.holdoutV1.oneXTwo.outcomeAccuracy != null && args.holdoutV2.oneXTwo.outcomeAccuracy != null
      ? args.holdoutV2.oneXTwo.outcomeAccuracy - args.holdoutV1.oneXTwo.outcomeAccuracy
      : null;
  let recommendation: "promote" | "promote_with_warnings" | "do_not_promote" = "do_not_promote";
  if (
    (brierImprovement ?? -1) > 0.01 &&
    (logLossImprovement ?? -1) > 0.01 &&
    (outcomeImprovement ?? -1) >= 0 &&
    args.futureWarnings <= 2 &&
    (args.validationImproved ?? true) &&
    (args.scenarioConsistent ?? true) &&
    (args.boundedFutureShifts ?? true) &&
    (args.deterministic ?? true)
  ) {
    recommendation = "promote";
  } else if (
    (brierImprovement ?? -1) > 0 &&
    (logLossImprovement ?? -1) > 0 &&
    args.futureWarnings <= 6 &&
    (args.validationImproved ?? true) &&
    (args.scenarioConsistent ?? true) &&
    (args.boundedFutureShifts ?? true) &&
    (args.deterministic ?? true)
  ) {
    recommendation = "promote_with_warnings";
  }
  return {
    recommendation,
    decisionContext: {
      selectedCandidate: args.validationWinner.candidate.key,
      validationScore: args.validationWinner.selectionAudit.validationSelectionScore,
      holdoutBrierImprovement: brierImprovement,
      holdoutLogLossImprovement: logLossImprovement,
      holdoutOutcomeAccuracyImprovement: outcomeImprovement,
      futureWarnings: args.futureWarnings,
      validationImproved: args.validationImproved ?? true,
      scenarioConsistent: args.scenarioConsistent ?? true,
      boundedFutureShifts: args.boundedFutureShifts ?? true,
      deterministic: args.deterministic ?? true,
    },
  };
}

function buildCoherenceWarnings(prediction: ChallengerPrediction) {
  const warnings: string[] = [];
  const oneXTwoSum =
    prediction.probabilities.oneXTwo.homeWin +
    prediction.probabilities.oneXTwo.draw +
    prediction.probabilities.oneXTwo.awayWin;
  if (Math.abs(oneXTwoSum - 1) > 0.001) {
    warnings.push("one_x_two_probability_sum_drift");
  }
  if (prediction.scoreMatrixTailMass > 0.015) {
    warnings.push("score_matrix_tail_mass_high");
  }
  if (
    prediction.probabilities.oneXTwo.homeWin > prediction.probabilities.oneXTwo.awayWin &&
    prediction.expectedGoals.home < prediction.expectedGoals.away
  ) {
    warnings.push("home_favorite_with_lower_xg");
  }
  if (
    prediction.probabilities.oneXTwo.awayWin > prediction.probabilities.oneXTwo.homeWin &&
    prediction.expectedGoals.away < prediction.expectedGoals.home
  ) {
    warnings.push("away_favorite_with_lower_xg");
  }
  return warnings;
}

export async function runTask2(paths: PreparedPaths & { artifactDate: string; generationCutoff: string }) {
  const datasets = loadTask1Datasets(paths);
  const productInventory = await loadProductReplayInventory();
  const providerFixtures = await fetchApiFootballFixturesByLeague({
    leagueId: 1,
    season: 2026,
  });
  const refreshPlan = reconcileFinishedFixtures({
    providerFixtures,
    scheduleRows: datasets.schedule,
    historicalFacts: datasets.historicalFacts,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    productInventory,
  });
  const scheduleLinks = buildTask2ScheduleLinks({
    scheduleRows: datasets.schedule,
    providerFixtures,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
  });
  const coverage = buildTask1_2Coverage({
    productInventory,
    refreshPlan,
    scheduleRows: datasets.schedule,
    scheduleLinks,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
  });
  const readyManifest = coverage.manifest.filter((entry) => entry.replay_readiness === "ready");
  const earliestPredictions = await loadPredictionRows({
    matchIds: readyManifest.map((entry) => entry.product_match_id),
    order: "earliest",
  });
  const holdoutRows = buildReplayFixtureRecords({
    manifest: readyManifest,
    productInventory,
    localizations: datasets.localizations,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
    scheduleRows: datasets.schedule,
    predictionRows: earliestPredictions.byMatchId,
    predictionMarkets: earliestPredictions.marketsByPredictionId,
    refreshResults: [
      ...refreshPlan.already_known_results,
      ...refreshPlan.newly_discovered_results,
      ...refreshPlan.score_or_status_corrections,
      ...refreshPlan.unresolved_finished_fixtures,
    ],
  });
  const splitManifest = buildTrainingValidationHoldoutManifest({
    historicalFacts: datasets.historicalFacts,
    holdoutRows,
    scheduleRows: datasets.schedule,
    localizations: datasets.localizations,
  });
  const historicalIndex = buildHistoricalResultIndex(datasets.historicalFacts, datasets.schedule);
  const validationRows = splitManifest.validation.rows.map((row) => {
    const fact = historicalIndex.get(row.naturalMatchKey ?? "") ?? historicalIndex.get(`${row.homeTeamKey}::${row.awayTeamKey}::${row.cutoffAt}`);
    if (!fact) {
      throw new Error(`Missing validation fact for ${row.fixtureId}.`);
    }
    const replayInput = buildPredictionIntelligenceV2ReplayInput({
      cutoffAt: row.cutoffAt,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      historicalFacts: datasets.historicalFacts,
      aliases: datasets.aliases,
      eloCurrent: datasets.eloCurrent,
      eloStart2026: datasets.eloStart2026,
      fifaRanking: datasets.fifaRanking,
      localizations: datasets.localizations,
      schedule: datasets.schedule,
    });
    return {
      fixtureId: row.fixtureId,
      cutoffAt: row.cutoffAt,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      actual: {
        homeGoals: fact.score_1,
        awayGoals: fact.score_2,
        score: `${fact.score_1}-${fact.score_2}`,
        outcome: outcomeFromGoals(fact.score_1, fact.score_2),
      },
      features: buildMatchFeatureVector({
        fixtureId: row.fixtureId,
        cutoffAt: row.cutoffAt,
        homeTeamKey: row.homeTeamKey,
        awayTeamKey: row.awayTeamKey,
        officialMatchNumber: row.officialMatchNumber,
        homeSignal: replayInput.homeSignal,
        awaySignal: replayInput.awaySignal,
        historicalFacts: datasets.historicalFacts,
        localizations: datasets.localizations,
        eloCurrent: datasets.eloCurrent,
        eloStart2026: datasets.eloStart2026,
        fifaRanking: datasets.fifaRanking,
        scheduleRows: datasets.schedule,
      }),
    };
  });
  const candidateEvaluations = buildValidationSelectionAudit(
    MODEL_2_CANDIDATES.map((candidate) => ({
      candidate,
      validationMetrics: computeReplayMetrics(
        validationRows.map((row) => ({
          prediction: parseChallengerPrediction(buildChallengerPrediction({
            candidate,
            features: row.features,
          })),
          actual: row.actual,
        })),
      ),
    })),
  ).ranked;
  const selectedCandidate = candidateEvaluations[0]!;
  const holdoutPredictions = holdoutRows.map((row) => {
    const features = buildMatchFeatureVector({
      fixtureId: row.fixtureId,
      cutoffAt: row.kickoffAt,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      officialMatchNumber: row.officialMatchNumber,
      homeSignal: row.homeSignal,
      awaySignal: row.awaySignal,
      historicalFacts: datasets.historicalFacts,
      localizations: datasets.localizations,
      eloCurrent: datasets.eloCurrent,
      eloStart2026: datasets.eloStart2026,
      fifaRanking: datasets.fifaRanking,
      scheduleRows: datasets.schedule,
    });
    const prediction = buildChallengerPrediction({
      candidate: selectedCandidate.candidate,
      features,
    });
    return {
      row,
      features,
      prediction,
    };
  });
  const holdoutV1Metrics = computeReplayMetrics(
    holdoutPredictions.map((entry) => ({
      prediction: parseOriginalPrediction(entry.row.originalPrediction, entry.row.originalMarkets),
      actual: entry.row.actual,
    })),
  );
  const holdoutV2Metrics = computeReplayMetrics(
    holdoutPredictions.map((entry) => ({
      prediction: parseChallengerPrediction(entry.prediction),
      actual: entry.row.actual,
    })),
  );
  const scenarioSummary = evaluateScenarioRows(
    holdoutPredictions.map((entry) => ({
      actual: entry.row.actual,
      prediction: entry.prediction,
      favoriteSide: entry.features.derived.favoriteSide,
    })),
  );
  const latestPredictions = await loadPredictionRows({
    matchIds: productInventory.matches.map((match) => match.id),
    order: "latest",
  });
  const futureRows = buildFutureFixtureRecords({
    productInventory,
    localizations: datasets.localizations,
    venues: datasets.venues,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
    scheduleRows: datasets.schedule,
    scheduleLinks,
    generationCutoff: paths.generationCutoff,
    latestPredictionRows: latestPredictions.byMatchId,
    latestPredictionMarkets: latestPredictions.marketsByPredictionId,
  });
  const futurePredictions = futureRows.map((row) => {
    const features = buildMatchFeatureVector({
      fixtureId: row.productMatchId,
      cutoffAt: paths.generationCutoff,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      officialMatchNumber: row.officialMatchNumber,
      homeSignal: row.homeSignal,
      awaySignal: row.awaySignal,
      historicalFacts: datasets.historicalFacts,
      localizations: datasets.localizations,
      eloCurrent: datasets.eloCurrent,
      eloStart2026: datasets.eloStart2026,
      fifaRanking: datasets.fifaRanking,
      scheduleRows: datasets.schedule,
    });
    const prediction = buildChallengerPrediction({
      candidate: selectedCandidate.candidate,
      features,
    });
    return {
      ...row,
      prediction,
      coherenceWarnings: buildCoherenceWarnings(prediction),
    };
  });
  const futureWarnings = futurePredictions.reduce((total, row) => total + row.coherenceWarnings.length, 0);
  const promotionGate = buildPromotionGate({
    validationWinner: selectedCandidate,
    holdoutV1: holdoutV1Metrics,
    holdoutV2: holdoutV2Metrics,
    futureWarnings,
  });
  const qualitativeCaseKeys = new Set([
    "germany|curacao|7-1",
    "spain|cape_verde|0-0",
    "brazil|morocco|1-1",
    "germany|ivory_coast|2-1",
    "ecuador|curacao|0-0",
  ]);
  const qualitativeCases = holdoutPredictions
    .filter((entry) => qualitativeCaseKeys.has(`${entry.row.homeTeamKey}|${entry.row.awayTeamKey}|${entry.row.actual.score}`))
    .map((entry) => {
      const actualFamily = familyCodeForScore({
        homeGoals: entry.row.actual.homeGoals,
        awayGoals: entry.row.actual.awayGoals,
        favoriteSide: entry.features.derived.favoriteSide,
      });
      return {
        fixture: `${entry.row.homeNameEn} vs ${entry.row.awayNameEn}`,
        fixtureEs: `${entry.row.homeNameEs} vs ${entry.row.awayNameEs}`,
        actualResult: entry.row.actual.score,
        structuralReading: {
          homeBaselineStrength: entry.features.home.subScores.baselineStrength,
          awayBaselineStrength: entry.features.away.subScores.baselineStrength,
          favoriteSide: entry.features.derived.favoriteSide,
        },
        recentAndTournamentAdjustment: {
          recentGap: entry.features.derived.recentGap,
          tournamentGap: entry.features.derived.tournamentGap,
          expectationGap: entry.features.derived.expectationGap,
        },
        model2: {
          expectedGoals: entry.prediction.expectedGoals,
          oneXTwo: entry.prediction.probabilities.oneXTwo,
          scenarios: entry.prediction.scenarios,
        },
        actualScenarioFamily: actualFamily,
        matchedScenarioFamily: entry.prediction.scenarios.some((scenario) => scenario.familyCode === actualFamily),
        understoodDirectionButMissedVolume:
          outcomeFromGoals(entry.row.actual.homeGoals, entry.row.actual.awayGoals) === favoriteFromOneXTwo(parseChallengerPrediction(entry.prediction)) &&
          Math.abs((entry.row.actual.homeGoals + entry.row.actual.awayGoals) - entry.prediction.expectedGoals.total) > 1.25,
        surpriseLevel:
          entry.prediction.scenarios[2]?.familyCode === actualFamily
            ? "reasonable_risk_scenario"
            : entry.prediction.scenarios.some((scenario) => scenario.familyCode === actualFamily)
              ? "featured_scenario"
              : "extreme_surprise",
      };
    });
  const shadowExport = buildPublicSafeShadowExport({
    fixtures: futurePredictions.map((entry) => ({
      productMatchId: entry.productMatchId,
      apiFootballFixtureId: entry.apiFootballFixtureId,
      officialMatchNumber: entry.officialMatchNumber,
      kickoffAt: entry.kickoffAt,
      homeTeamKey: entry.homeTeamKey,
      awayTeamKey: entry.awayTeamKey,
      homeNameEn: entry.homeNameEn,
      awayNameEn: entry.awayNameEn,
      homeNameEs: entry.homeNameEs,
      awayNameEs: entry.awayNameEs,
      prediction: entry.prediction,
    })),
  });

  const artifactBase = paths.artifactsDir;
  ensureDirectory(artifactBase);
  writeJson(path.join(artifactBase, "model-feature-contract.json"), {
    schemaVersion: "prediction-intelligence-v2-model-feature-contract-v1",
    modelVersion: MODEL_VERSION,
    teamFeatureFields: {
      structuralStrength: Object.keys(holdoutPredictions[0]?.features.home.structuralStrength ?? {}),
      recentForm: Object.keys(holdoutPredictions[0]?.features.home.recentForm ?? {}),
      opponentAdjustment: Object.keys(holdoutPredictions[0]?.features.home.opponentAdjustment ?? {}),
      currentWorldCupForm: Object.keys(holdoutPredictions[0]?.features.home.currentWorldCupForm ?? {}),
      reliability: Object.keys(holdoutPredictions[0]?.features.home.reliability ?? {}),
      subScores: Object.keys(holdoutPredictions[0]?.features.home.subScores ?? {}),
    },
  });
  writeJson(path.join(artifactBase, "training-validation-holdout-manifest.json"), splitManifest);
  writeJson(path.join(artifactBase, "candidate-calibration-results.json"), candidateEvaluations);
  writeJson(path.join(artifactBase, "selected-model-spec.json"), {
    modelVersion: MODEL_VERSION,
    selectedCandidate: selectedCandidate.candidate,
    selectedValidationScore: selectedCandidate.selectionAudit.validationSelectionScore,
    deterministicSeed: "not_applicable_deterministic_formula_model",
  });
  writeJson(path.join(artifactBase, "v1-v2-replay-summary.json"), {
    holdoutCount: holdoutPredictions.length,
    v1: holdoutV1Metrics,
    v2: holdoutV2Metrics,
  });
  writeJson(path.join(artifactBase, "v1-v2-replay-by-fixture.json"), holdoutPredictions.map((entry) => ({
    fixture: `${entry.row.homeNameEn} vs ${entry.row.awayNameEn}`,
    fixtureEs: `${entry.row.homeNameEs} vs ${entry.row.awayNameEs}`,
    officialMatchNumber: entry.row.officialMatchNumber,
    kickoffAt: entry.row.kickoffAt,
    originalPredictionVersionId: entry.row.originalPrediction.id,
    original: parseOriginalPrediction(entry.row.originalPrediction, entry.row.originalMarkets),
    replay: entry.prediction,
    actual: entry.row.actual,
    sourceSnapshotIds: entry.row.sourceSnapshotIds,
  })));
  writeJson(path.join(artifactBase, "scenario-evaluation-summary.json"), scenarioSummary);
  writeJson(path.join(artifactBase, "qualitative-case-reviews.json"), qualitativeCases);
  writeJson(path.join(artifactBase, "future-shadow-predictions.json"), futurePredictions.map((entry) => ({
    productMatchId: entry.productMatchId,
    apiFootballFixtureId: entry.apiFootballFixtureId,
    officialMatchNumber: entry.officialMatchNumber,
    kickoffAt: entry.kickoffAt,
    venue: entry.venue == null ? null : {
      cityEn: entry.venue.host_city_en,
      cityEs: entry.venue.host_city_es,
      venueEn: entry.venue.common_name,
      venueFifaName: entry.venue.fifa_tournament_name,
    },
    teams: {
      home: {
        canonicalKey: entry.homeTeamKey,
        nameEn: entry.homeNameEn,
        nameEs: entry.homeNameEs,
      },
      away: {
        canonicalKey: entry.awayTeamKey,
        nameEn: entry.awayNameEn,
        nameEs: entry.awayNameEs,
      },
    },
    v1: entry.originalPrediction ? parseOriginalPrediction(entry.originalPrediction, entry.originalMarkets) : null,
    v2: entry.prediction,
    comparison: entry.originalPrediction
      ? {
          homeWinDelta: round(entry.prediction.probabilities.oneXTwo.homeWin - entry.originalPrediction.home_win_prob / 100, 6),
          drawDelta: round(entry.prediction.probabilities.oneXTwo.draw - entry.originalPrediction.draw_prob / 100, 6),
          awayWinDelta: round(entry.prediction.probabilities.oneXTwo.awayWin - entry.originalPrediction.away_win_prob / 100, 6),
          expectedHomeGoalsDelta: round(entry.prediction.expectedGoals.home - entry.originalPrediction.expected_home_goals, 6),
          expectedAwayGoalsDelta: round(entry.prediction.expectedGoals.away - entry.originalPrediction.expected_away_goals, 6),
        }
      : null,
    evidenceBundle: entry.prediction.evidenceBundle,
    coherenceWarnings: entry.coherenceWarnings,
    sourceSnapshotIds: entry.sourceSnapshotIds,
  })));
  writeJson(path.join(artifactBase, "torneo-mundialista-shadow-export.json"), shadowExport);
  writeJson(path.join(artifactBase, "promotion-gate.json"), promotionGate);
  writeText(
    path.join(artifactBase, "README.txt"),
    [
      "Prediction Intelligence v2 Task 2 artifacts",
      `artifact_date=${paths.artifactDate}`,
      `generation_cutoff=${paths.generationCutoff}`,
      `holdout_ready=${holdoutPredictions.length}`,
      `future_shadow_predictions=${futurePredictions.length}`,
      `selected_candidate=${selectedCandidate.candidate.key}`,
      `promotion_gate=${promotionGate.recommendation}`,
    ].join("\n"),
  );

  return {
    splitManifest,
    candidateEvaluations,
    selectedCandidate,
    holdoutV1Metrics,
    holdoutV2Metrics,
    scenarioSummary,
    qualitativeCases,
    futurePredictions,
    shadowExport,
    promotionGate,
  };
}

function readJsonIfExists<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function createDeterministicRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function percentile(sortedValues: number[], p: number) {
  if (sortedValues.length === 0) {
    return null;
  }
  const index = clamp(Math.floor((sortedValues.length - 1) * p), 0, sortedValues.length - 1);
  return round(sortedValues[index]!, 6);
}

function bootstrapMeanRange(values: number[], seed: number) {
  if (values.length === 0) {
    return null;
  }
  const random = createDeterministicRandom(seed);
  const samples: number[] = [];
  for (let sample = 0; sample < 400; sample += 1) {
    let total = 0;
    for (let index = 0; index < values.length; index += 1) {
      total += values[Math.floor(random() * values.length)] ?? 0;
    }
    samples.push(total / values.length);
  }
  samples.sort((left, right) => left - right);
  return {
    mean: round(average(values, 6) ?? 0, 6),
    p05: percentile(samples, 0.05),
    p95: percentile(samples, 0.95),
  };
}

function buildAdjustmentDistribution(predictions: ChallengerPrediction[]) {
  const audits = predictions
    .map((prediction) => prediction.internalAudit)
    .filter((audit): audit is PredictionAdjustmentAudit => audit != null);
  const adjustmentKeys = [
    "structuralDisagreement",
    "recentForm",
    "attack",
    "defense",
    "opponentAdjustment",
    "tournamentForm",
    "venueContext",
    "reliabilityShrinkage",
  ] as const;
  return {
    predictionCount: predictions.length,
    byAdjustment: Object.fromEntries(
      adjustmentKeys.map((key) => {
        const values = audits.map((audit) => audit.signalAdjustments[key]);
        return [
          key,
          {
            mean: average(values, 6),
            min: values.length === 0 ? null : round(Math.min(...values), 6),
            max: values.length === 0 ? null : round(Math.max(...values), 6),
          },
        ];
      }),
    ),
    capsAppliedCounts: audits.flatMap((audit) => audit.capsApplied).reduce<Record<string, number>>((accumulator, cap) => {
      accumulator[cap] = (accumulator[cap] ?? 0) + 1;
      return accumulator;
    }, {}),
    aggregateMeanGoalDifferenceAdjustment: average(
      audits.map((audit) => audit.finalExpectedGoalDifference - audit.v1ExpectedGoalDifference),
      6,
    ),
    aggregateMeanTotalGoalAdjustment: average(
      audits.map((audit) => audit.finalExpectedTotalGoals - audit.v1ExpectedTotalGoals),
      6,
    ),
  };
}

function buildNeutralContextAudit(args: {
  holdoutRows: ReplayFixtureRecord[];
  futureRows: FutureFixtureRecord[];
  datasets: ReturnType<typeof loadTask1Datasets>;
  generationCutoff: string;
}) {
  const inspectRow = (row: {
    fixtureId: string;
    officialMatchNumber: number | null;
    cutoffAt: string;
    homeTeamKey: string;
    awayTeamKey: string;
    homeSignal: TeamSignalSnapshot;
    awaySignal: TeamSignalSnapshot;
  }) => {
    const features = buildMatchFeatureVector({
      fixtureId: row.fixtureId,
      cutoffAt: row.cutoffAt,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      officialMatchNumber: row.officialMatchNumber,
      homeSignal: row.homeSignal,
      awaySignal: row.awaySignal,
      historicalFacts: args.datasets.historicalFacts,
      localizations: args.datasets.localizations,
      eloCurrent: args.datasets.eloCurrent,
      eloStart2026: args.datasets.eloStart2026,
      fifaRanking: args.datasets.fifaRanking,
      scheduleRows: args.datasets.schedule,
    });
    return {
      fixtureId: row.fixtureId,
      officialMatchNumber: row.officialMatchNumber,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      priorNaiveContext: "home",
      correctedContext: features.derived.venueContext.fixtureContext,
      appliesTo: features.derived.venueContext.appliesTo,
      venueCountryCode: features.derived.venueContext.venueCountryCode,
      changed: features.derived.venueContext.appliesTo !== "home",
      reasonCode: features.derived.venueContext.reasonCode,
    };
  };
  const holdoutAudit = args.holdoutRows.map((row) =>
    inspectRow({
      fixtureId: row.fixtureId,
      officialMatchNumber: row.officialMatchNumber,
      cutoffAt: row.kickoffAt,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      homeSignal: row.homeSignal,
      awaySignal: row.awaySignal,
    }),
  );
  const futureAudit = args.futureRows.map((row) =>
    inspectRow({
      fixtureId: row.productMatchId,
      officialMatchNumber: row.officialMatchNumber,
      cutoffAt: args.generationCutoff,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      homeSignal: row.homeSignal,
      awaySignal: row.awaySignal,
    }),
  );
  const allRows = [...holdoutAudit, ...futureAudit];
  return {
    rowsInspected: allRows.length,
    changedFixtures: allRows.filter((row) => row.changed).length,
    hostContextFixtures: allRows.filter((row) => row.appliesTo != null).length,
    neutralFixtures: allRows.filter((row) => row.correctedContext === "neutral").length,
    examples: allRows.slice(0, 60),
  };
}

type HistoricalEvaluationRow = {
  fixtureId: string;
  cutoffAt: string;
  officialMatchNumber: number | null;
  homeTeamKey: string;
  awayTeamKey: string;
  actual: { homeGoals: number; awayGoals: number; score: string; outcome: MatchOutcomeKey };
  features: MatchFeatureVector;
};

function materializeHistoricalRows(args: {
  rows: Task2SplitManifest["rows"];
  datasets: ReturnType<typeof loadTask1Datasets>;
}) {
  const historicalIndex = buildHistoricalResultIndex(args.datasets.historicalFacts, args.datasets.schedule);
  return args.rows.map((row) => {
    const fact =
      historicalIndex.get(row.naturalMatchKey ?? "") ??
      historicalIndex.get(`${row.homeTeamKey}::${row.awayTeamKey}::${row.cutoffAt}`);
    if (!fact) {
      throw new Error(`Missing historical fact for ${row.fixtureId}.`);
    }
    const replayInput = buildPredictionIntelligenceV2ReplayInput({
      cutoffAt: row.cutoffAt,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      historicalFacts: args.datasets.historicalFacts,
      aliases: args.datasets.aliases,
      eloCurrent: args.datasets.eloCurrent,
      eloStart2026: args.datasets.eloStart2026,
      fifaRanking: args.datasets.fifaRanking,
      localizations: args.datasets.localizations,
      schedule: args.datasets.schedule,
    });
    return {
      fixtureId: row.fixtureId,
      cutoffAt: row.cutoffAt,
      officialMatchNumber: row.officialMatchNumber,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      actual: {
        homeGoals: fact.score_1,
        awayGoals: fact.score_2,
        score: `${fact.score_1}-${fact.score_2}`,
        outcome: outcomeFromGoals(fact.score_1, fact.score_2),
      },
      features: buildMatchFeatureVector({
        fixtureId: row.fixtureId,
        cutoffAt: row.cutoffAt,
        homeTeamKey: row.homeTeamKey,
        awayTeamKey: row.awayTeamKey,
        officialMatchNumber: row.officialMatchNumber,
        homeSignal: replayInput.homeSignal,
        awaySignal: replayInput.awaySignal,
        historicalFacts: args.datasets.historicalFacts,
        localizations: args.datasets.localizations,
        eloCurrent: args.datasets.eloCurrent,
        eloStart2026: args.datasets.eloStart2026,
        fifaRanking: args.datasets.fifaRanking,
        scheduleRows: args.datasets.schedule,
      }),
    } satisfies HistoricalEvaluationRow;
  });
}

function buildFutureAnomalyReview(rows: Array<{
  fixture: string;
  v1: PredictionLike | null;
  prediction: ChallengerPrediction;
  venueContext: MatchFeatureVector["derived"]["venueContext"];
  coherenceWarnings: string[];
}>) {
  const targets = new Set([
    "Belgium vs Iran",
    "Panama vs Croatia",
    "Norway vs Senegal",
    "Argentina vs Austria",
    "England vs Ghana",
    "Spain vs Saudi Arabia",
  ]);
  return rows
    .filter((row) => targets.has(row.fixture))
    .map((row) => {
      const deltas =
        row.v1 == null
          ? null
          : {
              homeWinDelta: round(row.prediction.probabilities.oneXTwo.homeWin - row.v1.homeWin, 6),
              drawDelta: round(row.prediction.probabilities.oneXTwo.draw - row.v1.draw, 6),
              awayWinDelta: round(row.prediction.probabilities.oneXTwo.awayWin - row.v1.awayWin, 6),
              expectedHomeGoalsDelta: round(row.prediction.expectedGoals.home - row.v1.expectedHomeGoals, 6),
              expectedAwayGoalsDelta: round(row.prediction.expectedGoals.away - row.v1.expectedAwayGoals, 6),
            };
      const maxDelta =
        deltas == null
          ? null
          : Math.max(Math.abs(deltas.homeWinDelta), Math.abs(deltas.drawDelta), Math.abs(deltas.awayWinDelta));
      return {
        fixture: row.fixture,
        deltas,
        venueContext: row.venueContext,
        capsApplied: row.prediction.internalAudit?.capsApplied ?? [],
        coherenceWarnings: row.coherenceWarnings,
        flaggedUnexplainedShift: maxDelta != null && maxDelta > 0.1,
        conclusion:
          maxDelta == null
            ? "missing_v1_reference"
            : maxDelta > 0.1
              ? "flagged_shift_above_threshold"
              : "bounded_shift_within_threshold",
      };
    });
}

export async function runTask2_1(paths: PreparedPaths & { artifactDate: string; generationCutoff: string }) {
  const datasets = loadTask1Datasets(paths);
  const productInventory = await loadProductReplayInventory();
  const providerFixtures = await fetchApiFootballFixturesByLeague({
    leagueId: 1,
    season: 2026,
  });
  const refreshPlan = reconcileFinishedFixtures({
    providerFixtures,
    scheduleRows: datasets.schedule,
    historicalFacts: datasets.historicalFacts,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    productInventory,
  });
  const scheduleLinks = buildTask2ScheduleLinks({
    scheduleRows: datasets.schedule,
    providerFixtures,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
  });
  const coverage = buildTask1_2Coverage({
    productInventory,
    refreshPlan,
    scheduleRows: datasets.schedule,
    scheduleLinks,
    aliases: datasets.aliases,
    localizations: datasets.localizations,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
  });
  const readyManifest = coverage.manifest.filter((entry) => entry.replay_readiness === "ready");
  const earliestPredictions = await loadPredictionRows({
    matchIds: readyManifest.map((entry) => entry.product_match_id),
    order: "earliest",
  });
  const holdoutRows = buildReplayFixtureRecords({
    manifest: readyManifest,
    productInventory,
    localizations: datasets.localizations,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
    scheduleRows: datasets.schedule,
    predictionRows: earliestPredictions.byMatchId,
    predictionMarkets: earliestPredictions.marketsByPredictionId,
    refreshResults: [
      ...refreshPlan.already_known_results,
      ...refreshPlan.newly_discovered_results,
      ...refreshPlan.score_or_status_corrections,
      ...refreshPlan.unresolved_finished_fixtures,
    ],
  });
  const expandedManifest = buildExpandedCalibrationManifest({
    historicalFacts: datasets.historicalFacts,
    holdoutRows,
    scheduleRows: datasets.schedule,
    localizations: datasets.localizations,
  });
  const trainingRows = materializeHistoricalRows({
    rows: expandedManifest.splitManifest.training.rows,
    datasets,
  });
  const validationRows = materializeHistoricalRows({
    rows: expandedManifest.splitManifest.validation.rows,
    datasets,
  });
  const featureCoverage = buildHistoricalFeatureCoverage([...trainingRows, ...validationRows].map((row) => row.features));
  const validationSelection = buildValidationSelectionAudit(
    TASK2_1_CANDIDATES.map((candidate) => ({
      candidate,
      validationMetrics: computeReplayMetrics(
        validationRows.map((row) => ({
          prediction: parseChallengerPrediction(buildChallengerPrediction({
            candidate,
            features: row.features,
          })),
          actual: row.actual,
        })),
      ),
    })),
  );
  const selectedCandidate = validationSelection.winner;
  const holdoutByCandidate = Object.fromEntries(
    validationSelection.ranked.map((evaluation) => {
      const predictions = holdoutRows.map((row) => {
        const features = buildMatchFeatureVector({
          fixtureId: row.fixtureId,
          cutoffAt: row.kickoffAt,
          homeTeamKey: row.homeTeamKey,
          awayTeamKey: row.awayTeamKey,
          officialMatchNumber: row.officialMatchNumber,
          homeSignal: row.homeSignal,
          awaySignal: row.awaySignal,
          historicalFacts: datasets.historicalFacts,
          localizations: datasets.localizations,
          eloCurrent: datasets.eloCurrent,
          eloStart2026: datasets.eloStart2026,
          fifaRanking: datasets.fifaRanking,
          scheduleRows: datasets.schedule,
        });
        const prediction = buildChallengerPrediction({
          candidate: evaluation.candidate,
          features,
        });
        return {
          row,
          features,
          prediction,
        };
      });
      return [
        evaluation.candidate.key,
        {
          metrics: computeReplayMetrics(
            predictions.map((entry) => ({
              prediction: parseChallengerPrediction(entry.prediction),
              actual: entry.row.actual,
            })),
          ),
          predictions,
        },
      ];
    }),
  ) as Record<string, {
    metrics: ReplayMetricSummary;
    predictions: Array<{ row: ReplayFixtureRecord; features: MatchFeatureVector; prediction: ChallengerPrediction }>;
  }>;
  const selectedHoldout = holdoutByCandidate[selectedCandidate.candidate.key]!;
  const holdoutV1Metrics = computeReplayMetrics(
    holdoutRows.map((row) => ({
      prediction: parseOriginalPrediction(row.originalPrediction, row.originalMarkets),
      actual: row.actual,
    })),
  );
  const holdoutComparisonDiffs = holdoutRows.map((row, index) => {
    const v1 = parseOriginalPrediction(row.originalPrediction, row.originalMarkets);
    const v2 = parseChallengerPrediction(selectedHoldout.predictions[index]!.prediction);
    return {
      brierDiff: multiclassBrier(v1, row.actual.outcome) - multiclassBrier(v2, row.actual.outcome),
      logLossDiff: logLoss(v1, row.actual.outcome) - logLoss(v2, row.actual.outcome),
    };
  });
  const latestPredictions = await loadPredictionRows({
    matchIds: productInventory.matches.map((match) => match.id),
    order: "latest",
  });
  const futureRows = buildFutureFixtureRecords({
    productInventory,
    localizations: datasets.localizations,
    venues: datasets.venues,
    historicalFacts: datasets.historicalFacts,
    eloCurrent: datasets.eloCurrent,
    eloStart2026: datasets.eloStart2026,
    fifaRanking: datasets.fifaRanking,
    scheduleRows: datasets.schedule,
    scheduleLinks,
    generationCutoff: paths.generationCutoff,
    latestPredictionRows: latestPredictions.byMatchId,
    latestPredictionMarkets: latestPredictions.marketsByPredictionId,
  });
  const futurePredictions = futureRows.map((row) => {
    const features = buildMatchFeatureVector({
      fixtureId: row.productMatchId,
      cutoffAt: paths.generationCutoff,
      homeTeamKey: row.homeTeamKey,
      awayTeamKey: row.awayTeamKey,
      officialMatchNumber: row.officialMatchNumber,
      homeSignal: row.homeSignal,
      awaySignal: row.awaySignal,
      historicalFacts: datasets.historicalFacts,
      localizations: datasets.localizations,
      eloCurrent: datasets.eloCurrent,
      eloStart2026: datasets.eloStart2026,
      fifaRanking: datasets.fifaRanking,
      scheduleRows: datasets.schedule,
    });
    const prediction = buildChallengerPrediction({
      candidate: selectedCandidate.candidate,
      features,
    });
    const v1 = row.originalPrediction ? parseOriginalPrediction(row.originalPrediction, row.originalMarkets) : null;
    return {
      ...row,
      features,
      prediction,
      v1,
      coherenceWarnings: buildCoherenceWarnings(prediction),
    };
  });
  const futureWarnings = futurePredictions.reduce((total, row) => total + row.coherenceWarnings.length, 0);
  const scenarioSummary = evaluateScenarioRows(
    selectedHoldout.predictions.map((entry) => ({
      actual: entry.row.actual,
      prediction: entry.prediction,
      favoriteSide: entry.features.derived.favoriteSide,
    })),
  );
  const qualitativeCaseKeys = new Set([
    "germany|curacao|7-1",
    "spain|cape_verde|0-0",
    "brazil|morocco|1-1",
    "germany|ivory_coast|2-1",
    "ecuador|curacao|0-0",
  ]);
  const qualitativeCases = selectedHoldout.predictions
    .filter((entry) =>
      qualitativeCaseKeys.has(`${entry.row.homeTeamKey}|${entry.row.awayTeamKey}|${entry.row.actual.score}`),
    )
    .map((entry) => ({
      fixture: `${entry.row.homeNameEn} vs ${entry.row.awayNameEn}`,
      actualResult: entry.row.actual.score,
      actualScenarioFamily: familyCodeForScore({
        homeGoals: entry.row.actual.homeGoals,
        awayGoals: entry.row.actual.awayGoals,
        favoriteSide: entry.features.derived.favoriteSide,
      }),
      displayedFamilies: entry.prediction.scenarios.map((scenario) => scenario.familyCode),
      evaluatorMatched: entry.prediction.scenarios.some((scenario) =>
        familyMatchesScore({
          familyCode: scenario.familyCode,
          homeGoals: entry.row.actual.homeGoals,
          awayGoals: entry.row.actual.awayGoals,
          favoriteSide: entry.features.derived.favoriteSide,
        }),
      ),
    }));
  const adjustmentDistribution = buildAdjustmentDistribution([
    ...validationRows.map((row) => buildChallengerPrediction({ candidate: selectedCandidate.candidate, features: row.features })),
    ...futurePredictions.map((row) => row.prediction),
  ]);
  const futureAnomalyReview = buildFutureAnomalyReview(
    futurePredictions.map((row) => ({
      fixture: `${row.homeNameEn} vs ${row.awayNameEn}`,
      v1: row.v1,
      prediction: row.prediction,
      venueContext: row.features.derived.venueContext,
      coherenceWarnings: row.coherenceWarnings,
    })),
  );
  const boundedFutureShifts = futureAnomalyReview.every((row) => !row.flaggedUnexplainedShift);
  const promotionGate = buildPromotionGate({
    validationWinner: selectedCandidate,
    holdoutV1: holdoutV1Metrics,
    holdoutV2: selectedHoldout.metrics,
    futureWarnings,
    validationImproved:
      (selectedCandidate.validationMetrics.oneXTwo.multiclassBrier ?? Number.POSITIVE_INFINITY) <=
      ((validationSelection.ranked.find((entry) => entry.candidate.key === "v1_compatible_baseline")?.validationMetrics.oneXTwo.multiclassBrier) ?? Number.POSITIVE_INFINITY),
    scenarioConsistent: scenarioSummary.perFixture.every(
      (row) => !(row.resultOutsideAllThreeScenarioFamilies && row.selectedFamilies.includes(row.actualFamily)),
    ),
    boundedFutureShifts,
    deterministic: true,
  });
  const previousTask2CandidateResults = readJsonIfExists<Array<{
    candidate?: { key?: string };
    validationMetrics?: ReplayMetricSummary;
    score?: number;
  }>>(path.join(paths.repoRoot, "artifacts", "prediction-intelligence-v2", "task2", "2026-06-21", "candidate-calibration-results.json"));
  const previousTask2SelectionBug =
    previousTask2CandidateResults == null
      ? null
      : (() => {
          const structural = previousTask2CandidateResults.find((entry) => entry.candidate?.key === "structural_only_ablation");
          const baseline = previousTask2CandidateResults.find((entry) => entry.candidate?.key === "baseline_compatible_v2");
          return structural && baseline
            ? {
                selectedCandidate: structural.candidate?.key,
                lowerCompositeScore: structural.score ?? null,
                butWorseThanBaseline: {
                  brier:
                    (structural.validationMetrics?.oneXTwo.multiclassBrier ?? Number.POSITIVE_INFINITY) >
                    (baseline.validationMetrics?.oneXTwo.multiclassBrier ?? Number.POSITIVE_INFINITY),
                  logLoss:
                    (structural.validationMetrics?.oneXTwo.logLoss ?? Number.POSITIVE_INFINITY) >
                    (baseline.validationMetrics?.oneXTwo.logLoss ?? Number.POSITIVE_INFINITY),
                  accuracy:
                    (structural.validationMetrics?.oneXTwo.outcomeAccuracy ?? -1) <
                    (baseline.validationMetrics?.oneXTwo.outcomeAccuracy ?? -1),
                },
              }
            : null;
        })();
  const neutralContextAudit = buildNeutralContextAudit({
    holdoutRows,
    futureRows,
    datasets,
    generationCutoff: paths.generationCutoff,
  });
  const artifactBase = paths.artifactsDir;
  ensureDirectory(artifactBase);
  writeJson(path.join(artifactBase, "historical-row-inclusion-audit.json"), expandedManifest.audit);
  writeJson(path.join(artifactBase, "expanded-calibration-manifest.json"), {
    ...expandedManifest.splitManifest,
    featureCoverage,
  });
  writeJson(path.join(artifactBase, "neutral-context-audit.json"), neutralContextAudit);
  writeJson(path.join(artifactBase, "candidate-selection-audit.json"), {
    previousTask2SelectionBug,
    selectionRule: validationSelection.rule,
    rankedCandidates: validationSelection.ranked,
    selectedCandidate: validationSelection.winner.candidate.key,
  });
  writeJson(path.join(artifactBase, "hybrid-adjustment-distribution.json"), adjustmentDistribution);
  writeJson(path.join(artifactBase, "validation-candidate-results.json"), validationSelection);
  writeJson(path.join(artifactBase, "v1-v2-holdout-comparison.json"), {
    v1: holdoutV1Metrics,
    candidates: Object.fromEntries(
      validationSelection.ranked.map((entry) => [entry.candidate.key, holdoutByCandidate[entry.candidate.key]!.metrics]),
    ),
    selectedCandidate: selectedCandidate.candidate.key,
    bootstrapRanges: {
      multiclassBrierImprovement: bootstrapMeanRange(holdoutComparisonDiffs.map((entry) => entry.brierDiff), 21),
      logLossImprovement: bootstrapMeanRange(holdoutComparisonDiffs.map((entry) => entry.logLossDiff), 22),
    },
  });
  writeJson(path.join(artifactBase, "scenario-definition-contract.json"), SCENARIO_FAMILY_CONTRACTS);
  writeJson(path.join(artifactBase, "scenario-evaluation-audit.json"), {
    summary: scenarioSummary,
    qualitativeCases,
  });
  writeJson(path.join(artifactBase, "future-shadow-predictions.json"), futurePredictions.map((row) => ({
    productMatchId: row.productMatchId,
    officialMatchNumber: row.officialMatchNumber,
    fixture: `${row.homeNameEn} vs ${row.awayNameEn}`,
    kickoffAt: row.kickoffAt,
    venueContext: row.features.derived.venueContext,
    v1: row.v1,
    v2: row.prediction,
    probabilityDeltas:
      row.v1 == null
        ? null
        : {
            homeWin: round(row.prediction.probabilities.oneXTwo.homeWin - row.v1.homeWin, 6),
            draw: round(row.prediction.probabilities.oneXTwo.draw - row.v1.draw, 6),
            awayWin: round(row.prediction.probabilities.oneXTwo.awayWin - row.v1.awayWin, 6),
          },
    xgDeltas:
      row.v1 == null
        ? null
        : {
            home: round(row.prediction.expectedGoals.home - row.v1.expectedHomeGoals, 6),
            away: round(row.prediction.expectedGoals.away - row.v1.expectedAwayGoals, 6),
          },
    capsApplied: row.prediction.internalAudit?.capsApplied ?? [],
    coherenceWarnings: row.coherenceWarnings,
  })));
  writeJson(path.join(artifactBase, "future-anomaly-review.json"), futureAnomalyReview);
  writeJson(path.join(artifactBase, "promotion-gate.json"), promotionGate);
  writeText(
    path.join(artifactBase, "README.txt"),
    [
      "Prediction Intelligence v2 Task 2.1 artifacts",
      `artifact_date=${paths.artifactDate}`,
      `generation_cutoff=${paths.generationCutoff}`,
      `training_rows=${expandedManifest.splitManifest.training.rowCount}`,
      `validation_rows=${expandedManifest.splitManifest.validation.rowCount}`,
      `holdout_rows=${expandedManifest.splitManifest.holdout.rowCount}`,
      `selected_candidate=${selectedCandidate.candidate.key}`,
      `promotion_gate=${promotionGate.recommendation}`,
      `future_shadow_predictions=${futurePredictions.length}`,
    ].join("\n"),
  );
  return {
    expandedManifest,
    featureCoverage,
    validationSelection,
    holdoutV1Metrics,
    holdoutByCandidate,
    selectedCandidate,
    scenarioSummary,
    futurePredictions,
    futureAnomalyReview,
    neutralContextAudit,
    promotionGate,
  };
}
