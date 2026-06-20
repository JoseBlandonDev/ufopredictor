import "server-only";

import { createHash } from "node:crypto";
import { DEFAULT_PREDICTION_ENGINE_CONFIG } from "../prediction-engine/config";
import { generatePrediction } from "../prediction-engine/generate-prediction";
import { resolveNationalTeamStrengthSnapshot } from "../prediction-engine/national-team-strength-snapshots";
import type { MatchPredictionInput, NormalizedTeamInput, TeamSignalKey } from "../prediction-engine/types";
import { calculateTeamPower } from "../prediction-engine/team-power";
import type { PredictionReviewCoherenceFixture } from "./types";
import { findPredictionReviewCoherenceFixture } from "./coherence-source";
import {
  ATYPICAL_FIXTURE_DETECTOR_VERSION,
} from "./anomaly-constants";
import { resolveOutcomeLeader } from "./anomaly-outcome";
import type {
  AtypicalFixtureDetectorInput,
} from "./types";
import sourceSnapshot from "../../data/prediction-engine/national-team-signals/2026-06-19/source.json";
import qualityReport from "../../data/prediction-engine/national-team-signals/2026-06-19/quality-report.json";

type AdapterMatch = {
  id: string;
  external_id: string;
  kickoff_at: string;
  status: string;
  stage: string | null;
};

type AdapterCompetition = {
  name: string;
};

type AdapterPredictionVersion = {
  id: string;
  model_version_id: string | null;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  most_likely_score: string;
  top_scores_json: unknown;
  confidence_score: number;
  risk_level: string;
  run_scope: string;
  created_at: string;
};

type AdapterPredictionMarket = {
  prediction_version_id: string;
  market: string;
  selection: string;
  probability: number;
};

type AdapterArgs = {
  match: AdapterMatch;
  competition: AdapterCompetition;
  homeTeamName: string;
  awayTeamName: string;
  predictionVersion: AdapterPredictionVersion;
  markets: AdapterPredictionMarket[];
  modelVersionName: string | null;
  analysisAsOf: string;
  exactSourceSnapshotId?: string | null;
};

type SourceTeamRecord = (typeof sourceSnapshot.teams)[number];
const PREMATCH_MARKET_TOLERANCE = 0.75;

type ValidatedMarketSelection =
  | { status: "valid"; probability: number }
  | { status: "missing" | "duplicate" | "wrong_version" | "malformed"; reasons: string[] };

type ValidatedBinaryPair = {
  yes: ValidatedMarketSelection;
  no: ValidatedMarketSelection;
  complete: boolean;
  missingEvidence: string[];
  yesProbability: number | null;
};

type ValidatedModalProbability = {
  probabilityPct: number | null;
  provenance: "prediction_version" | "market_row" | "unknown";
  missingEvidence: string[];
};

type ValidatedConsumedMarkets = {
  complete: boolean;
  missingEvidence: string[];
  btts: ValidatedBinaryPair;
  over25: ValidatedBinaryPair;
  modalProbability: ValidatedModalProbability;
};

const QUALITY_VERDICT =
  qualityReport.verdict === "PASS_SOURCE_REFRESH"
    ? "PASS"
    : qualityReport.verdict
      ? "FAIL"
      : "UNKNOWN";

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCompetitionKey(value: string) {
  return normalizeKey(value);
}

function parseProviderFixtureId(externalId: string) {
  const match = externalId.match(/fixture:(\d+)/);
  return match ? Number(match[1]) : null;
}

function round(value: number, digits = 6) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function resolveSnapshotWithAliasFallback(teamName: string) {
  const direct = resolveNationalTeamStrengthSnapshot({ name: teamName });
  if (direct) {
    return direct;
  }

  const fallbackName =
    normalizeKey(teamName) === "cape-verde" || normalizeKey(teamName) === "cape-verde-islands"
      ? "Cabo Verde"
      : teamName;

  return resolveNationalTeamStrengthSnapshot({ name: fallbackName });
}

function toCanonicalSignalEvidence(teamName: string) {
  const snapshot = resolveSnapshotWithAliasFallback(teamName);
  const normalizedSnapshotKey = snapshot ? normalizeKey(snapshot.teamKey) : normalizeKey(teamName);
  const sourceRecord =
    sourceSnapshot.teams.find((entry) => {
      const candidates = [
        entry.teamKey,
        entry.databaseNameEn,
        entry.displayNameEn,
        ...(entry.aliases ?? []),
      ];

      return candidates.some((candidate) => normalizeKey(candidate) === normalizedSnapshotKey);
    }) ?? null;

  if (!snapshot && !sourceRecord) {
    return {
      snapshot: null,
      sourceRecord: null,
      canonicalKey: normalizeKey(teamName),
      aliasResolved: false,
      weightedPower: null,
    };
  }

  if (!snapshot) {
    return {
      snapshot: null,
      sourceRecord,
      canonicalKey: sourceRecord?.teamKey ?? normalizeKey(teamName),
      aliasResolved: Boolean(sourceRecord),
      weightedPower: null,
    };
  }

  const normalizedTeam: NormalizedTeamInput = {
    id: snapshot.teamKey,
    name: snapshot.displayName,
    signals: {
      ratingScore: snapshot.signals.ratingScore ?? DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore,
      recentFormScore: snapshot.signals.recentFormScore ?? DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore,
      attackScore: snapshot.signals.attackScore ?? DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore,
      defenseScore: snapshot.signals.defenseScore ?? DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore,
      marketScore: snapshot.signals.marketScore ?? DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore,
      lineupContextScore: snapshot.signals.lineupContextScore ?? DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore,
    },
    metadata: {
      fifaRank: snapshot.fifaRank,
      fifaPoints: snapshot.fifaPoints,
      eloRank: snapshot.eloRank,
      eloRating: snapshot.eloRating,
      eloAverageRank: snapshot.eloAverageRank,
      eloAverageRating: snapshot.eloAverageRating,
      historicalGoalsForPerMatch: snapshot.historicalGoalsForPerMatch,
      historicalGoalsAgainstPerMatch: snapshot.historicalGoalsAgainstPerMatch,
      recentMatchCount: snapshot.recentMatchCount,
    },
    providedSignals: Object.keys(snapshot.signals) as TeamSignalKey[],
    defaultedSignals: [],
  };

  return {
    snapshot,
    sourceRecord,
    canonicalKey: snapshot.teamKey,
    aliasResolved: true,
    weightedPower: calculateTeamPower(normalizedTeam, DEFAULT_PREDICTION_ENGINE_CONFIG).score,
  };
}

function parseModalScore(score: string) {
  const match = score.match(/^(\d+)-(\d+)$/);
  if (!match) {
    return { homeGoals: null, awayGoals: null };
  }

  return {
    homeGoals: Number(match[1]),
    awayGoals: Number(match[2]),
  };
}

function validatePredictionVersionTopScore(args: {
  mostLikelyScore: string;
  topScoresJson: unknown;
}) {
  if (Array.isArray(args.topScoresJson)) {
    const candidate = args.topScoresJson.find((entry) => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      const score = "score" in entry ? entry.score : null;
      const probability = "probability" in entry ? entry.probability : null;
      return score === args.mostLikelyScore && typeof probability === "number";
    }) as { probability: number } | undefined;

    if (!candidate) {
      return { status: "missing" as const };
    }

    return Number.isFinite(candidate.probability)
      ? { status: "valid" as const, probability: candidate.probability }
      : { status: "malformed" as const };
  }

  return { status: "missing" as const };
}

function normalizeTimestampString(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : value;
}

function shouldNormalizeTimestamp(path: string[]) {
  const key = path[path.length - 1] ?? "";
  return key === "analysisAsOf" ||
    key.endsWith("At") ||
    key.endsWith("Date") ||
    key === "kickoffAt" ||
    key === "generatedAt";
}

function looksLikeIsoDateOrTimestamp(value: string) {
  return /^\d{4}-\d{2}-\d{2}(?:T[\d:.+-]+(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value);
}

function shouldSortArray(path: string[]) {
  const key = path[path.length - 1] ?? "";
  return key === "missingEvidence" ||
    key === "changedComponents" ||
    key === "supportingFlagCodes" ||
    key === "alternativeCauseCodes" ||
    key === "evidenceRefs";
}

export function normalizeAtypicalFixtureFingerprintValue(value: unknown, path: string[] = []): unknown {
  if (value === undefined) {
    return { __type: "undefined" };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Fingerprint payload contains a non-finite numeric value at ${path.join(".") || "<root>"}.`);
    }

    return round(value);
  }

  if (typeof value === "string" && (shouldNormalizeTimestamp(path) || looksLikeIsoDateOrTimestamp(value))) {
    return normalizeTimestampString(value);
  }

  if (Array.isArray(value)) {
    const normalizedEntries = value.map((entry, index) =>
      normalizeAtypicalFixtureFingerprintValue(entry, [...path, String(index)]),
    );

    if (shouldSortArray(path)) {
      return [...normalizedEntries].sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
    }

    return normalizedEntries;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeAtypicalFixtureFingerprintValue(entry, [...path, key])]),
    );
  }

  return value;
}

function validateBinaryProbabilityPair(args: {
  yes: ValidatedMarketSelection;
  no: ValidatedMarketSelection;
  missingEvidenceKey: string;
}): ValidatedBinaryPair {
  if (args.yes.status !== "valid" || args.no.status !== "valid") {
    const missingEvidence = [
      ...(args.yes.status === "valid" ? [] : args.yes.reasons),
      ...(args.no.status === "valid" ? [] : args.no.reasons),
    ];

    if (missingEvidence.length === 0) {
      missingEvidence.push(args.missingEvidenceKey);
    }

    return {
      yes: args.yes,
      no: args.no,
      complete: false,
      missingEvidence,
      yesProbability: null,
    };
  }

  const values = [args.yes.probability, args.no.probability];
  if (values.some((value) => !isFiniteNumber(value) || value < 0 || value > 100)) {
    return {
      yes: { status: "malformed", reasons: [`${args.missingEvidenceKey}.probabilityRange`] },
      no: { status: "malformed", reasons: [`${args.missingEvidenceKey}.probabilityRange`] },
      complete: false,
      missingEvidence: [`${args.missingEvidenceKey}.probabilityRange`],
      yesProbability: null,
    };
  }

  if (Math.abs(values[0]! + values[1]! - 100) > PREMATCH_MARKET_TOLERANCE) {
    return {
      yes: { status: "malformed", reasons: [`${args.missingEvidenceKey}.sumTolerance`] },
      no: { status: "malformed", reasons: [`${args.missingEvidenceKey}.sumTolerance`] },
      complete: false,
      missingEvidence: [`${args.missingEvidenceKey}.sumTolerance`],
      yesProbability: null,
    };
  }

  return {
    yes: args.yes,
    no: args.no,
    complete: true,
    missingEvidence: [],
    yesProbability: args.yes.probability,
  };
}

function buildValidatedMarketSelection(args: {
  markets: AdapterPredictionMarket[];
  predictionVersionId: string;
  market: string;
  selection: string;
  missingEvidenceKey: string;
}): ValidatedMarketSelection {
  const matching = args.markets.filter((entry) => entry.market === args.market && entry.selection === args.selection);
  const sameVersion = matching.filter((entry) => entry.prediction_version_id === args.predictionVersionId);

  if (sameVersion.length > 1) {
    return { status: "duplicate", reasons: ["markets.duplicateSelection", args.missingEvidenceKey] };
  }

  if (matching.length > sameVersion.length) {
    return { status: "wrong_version", reasons: ["markets.predictionVersionId", args.missingEvidenceKey] };
  }

  if (sameVersion.length === 0) {
    return { status: "missing", reasons: [args.missingEvidenceKey] };
  }

  const candidate = sameVersion[0]!;
  if (!isFiniteNumber(candidate.probability) || candidate.probability < 0 || candidate.probability > 100) {
    return { status: "malformed", reasons: [`${args.missingEvidenceKey}.probabilityRange`] };
  }

  return { status: "valid", probability: candidate.probability };
}

function validateConsumedMarkets(args: {
  markets: AdapterPredictionMarket[];
  predictionVersionId: string;
  topScoresJson: unknown;
  mostLikelyScore: string;
}): ValidatedConsumedMarkets {
  const missingEvidence = new Set<string>();
  const bttsYes = buildValidatedMarketSelection({
    markets: args.markets,
    predictionVersionId: args.predictionVersionId,
    market: "btts",
    selection: "yes",
    missingEvidenceKey: "markets.btts",
  });
  const bttsNo = buildValidatedMarketSelection({
    markets: args.markets,
    predictionVersionId: args.predictionVersionId,
    market: "btts",
    selection: "no",
    missingEvidenceKey: "markets.btts",
  });
  const bttsValidation = validateBinaryProbabilityPair({
    yes: bttsYes,
    no: bttsNo,
    missingEvidenceKey: "markets.btts",
  });
  for (const key of bttsValidation.missingEvidence) {
    missingEvidence.add(key);
  }

  const over25Over = buildValidatedMarketSelection({
    markets: args.markets,
    predictionVersionId: args.predictionVersionId,
    market: "over_2_5",
    selection: "over",
    missingEvidenceKey: "markets.over_2_5",
  });
  const over25Under = buildValidatedMarketSelection({
    markets: args.markets,
    predictionVersionId: args.predictionVersionId,
    market: "over_2_5",
    selection: "under",
    missingEvidenceKey: "markets.over_2_5",
  });
  const overUnderValidation = validateBinaryProbabilityPair({
    yes: over25Over,
    no: over25Under,
    missingEvidenceKey: "markets.over_2_5",
  });
  for (const key of overUnderValidation.missingEvidence) {
    missingEvidence.add(key);
  }

  const predictionVersionTopScore = validatePredictionVersionTopScore({
    mostLikelyScore: args.mostLikelyScore,
    topScoresJson: args.topScoresJson,
  });
  const exactScoreSelection = buildValidatedMarketSelection({
    markets: args.markets,
    predictionVersionId: args.predictionVersionId,
    market: "exact_score",
    selection: args.mostLikelyScore,
    missingEvidenceKey: "markets.topScorelineProvenance",
  });

  let modalProbability: ValidatedModalProbability;
  if (predictionVersionTopScore.status === "valid") {
    modalProbability = {
      probabilityPct: predictionVersionTopScore.probability,
      provenance: "prediction_version",
      missingEvidence: [],
    };
  } else if (predictionVersionTopScore.status === "malformed") {
    modalProbability = {
      probabilityPct: null,
      provenance: "unknown",
      missingEvidence: ["markets.topScorelineProvenance"],
    };
  } else if (exactScoreSelection.status === "valid") {
    modalProbability = {
      probabilityPct: exactScoreSelection.probability,
      provenance: "market_row",
      missingEvidence: [],
    };
  } else {
    modalProbability = {
      probabilityPct: null,
      provenance: "unknown",
      missingEvidence:
        exactScoreSelection.reasons.length > 0
          ? exactScoreSelection.reasons
          : ["markets.topScorelineProvenance"],
    };
  }

  for (const key of modalProbability.missingEvidence) {
    missingEvidence.add(key);
  }

  return {
    complete:
      missingEvidence.size === 0 &&
      bttsValidation.complete &&
      overUnderValidation.complete,
    missingEvidence: [...missingEvidence],
    btts: bttsValidation,
    over25: overUnderValidation,
    modalProbability,
  };
}

function findLatestEvidenceAt(records: Array<SourceTeamRecord | null>) {
  const dates = records
    .flatMap((record) => record?.recent.last5 ?? [])
    .map((match) => match.date)
    .filter((value): value is string => typeof value === "string");

  if (dates.length === 0) {
    return null;
  }

  return [...dates].sort().at(-1) ?? null;
}

function countPostCutoffEvidence(records: Array<SourceTeamRecord | null>, cutoffIso: string) {
  const cutoffMs = Date.parse(cutoffIso);
  if (!Number.isFinite(cutoffMs)) {
    return 0;
  }

  return records
    .flatMap((record) => record?.recent.last5 ?? [])
    .filter((match) => {
      const observedAt = Date.parse(`${match.date}T00:00:00.000Z`);
      return Number.isFinite(observedAt) && observedAt > cutoffMs;
    })
    .length;
}

function buildReferenceProjection(args: {
  match: AdapterMatch;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const home = resolveSnapshotWithAliasFallback(args.homeTeamName);
  const away = resolveSnapshotWithAliasFallback(args.awayTeamName);

  if (!home || !away) {
    return {
      available: false,
      output: null,
    };
  }

  const input: MatchPredictionInput = {
    matchId: args.match.id,
    homeTeam: {
      id: `${args.match.id}:home`,
      name: args.homeTeamName,
      signals: home.signals,
      metadata: {
        fifaRank: home.fifaRank,
        fifaPoints: home.fifaPoints,
        eloRank: home.eloRank,
        eloRating: home.eloRating,
        eloAverageRank: home.eloAverageRank,
        eloAverageRating: home.eloAverageRating,
        historicalGoalsForPerMatch: home.historicalGoalsForPerMatch,
        historicalGoalsAgainstPerMatch: home.historicalGoalsAgainstPerMatch,
        recentMatchCount: home.recentMatchCount,
      },
    },
    awayTeam: {
      id: `${args.match.id}:away`,
      name: args.awayTeamName,
      signals: away.signals,
      metadata: {
        fifaRank: away.fifaRank,
        fifaPoints: away.fifaPoints,
        eloRank: away.eloRank,
        eloRating: away.eloRating,
        eloAverageRank: away.eloAverageRank,
        eloAverageRating: away.eloAverageRating,
        historicalGoalsForPerMatch: away.historicalGoalsForPerMatch,
        historicalGoalsAgainstPerMatch: away.historicalGoalsAgainstPerMatch,
        recentMatchCount: away.recentMatchCount,
      },
    },
    context: {
      neutralVenue: false,
    },
    predictionType: "pre_match_24h",
    runScope: "public_product",
  };

  return {
    available: true,
    output: generatePrediction(input),
  };
}

function buildEloEvidence(args: {
  coherenceFixture: PredictionReviewCoherenceFixture | null;
  homeCanonicalKey: string;
}) {
  const coherenceFixture = args.coherenceFixture;
  if (!coherenceFixture) {
    return {
      available: false,
      homeTwoWayPct: null,
      awayTwoWayPct: null,
      homeRating: null,
      awayRating: null,
    };
  }

  const direct = coherenceFixture.teamAKey === args.homeCanonicalKey;

  return {
    available: true,
    homeTwoWayPct: direct ? coherenceFixture.eloWinningExpectancyA : coherenceFixture.eloWinningExpectancyB,
    awayTwoWayPct: direct ? coherenceFixture.eloWinningExpectancyB : coherenceFixture.eloWinningExpectancyA,
    homeRating: direct ? coherenceFixture.eloRatingA : coherenceFixture.eloRatingB,
    awayRating: direct ? coherenceFixture.eloRatingB : coherenceFixture.eloRatingA,
  };
}

export function createAtypicalFixtureInputFingerprint(args: {
  input: AtypicalFixtureDetectorInput;
  analysisAsOf: string;
}) {
  const payload = normalizeAtypicalFixtureFingerprintValue({
    detectorVersion: ATYPICAL_FIXTURE_DETECTOR_VERSION,
    analysisAsOf: args.analysisAsOf,
    input: args.input,
  });

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildAtypicalFixtureDetectorInput(args: AdapterArgs) {
  const homeEvidence = toCanonicalSignalEvidence(args.homeTeamName);
  const awayEvidence = toCanonicalSignalEvidence(args.awayTeamName);
  const coherenceFixture = findPredictionReviewCoherenceFixture({
    homeTeamName: args.homeTeamName,
    awayTeamName: args.awayTeamName,
  });

  const homeCanonicalKey = homeEvidence.canonicalKey;
  const awayCanonicalKey = awayEvidence.canonicalKey;
  const elo = buildEloEvidence({
    coherenceFixture,
    homeCanonicalKey,
  });
  const marketValidation = validateConsumedMarkets({
    markets: args.markets,
    predictionVersionId: args.predictionVersion.id,
    topScoresJson: args.predictionVersion.top_scores_json,
    mostLikelyScore: args.predictionVersion.most_likely_score,
  });

  const resolvedSignalSnapshotId =
    typeof args.exactSourceSnapshotId === "string" && args.exactSourceSnapshotId.trim().length > 0
      ? args.exactSourceSnapshotId.trim()
      : null;
  const preMatchCutoff = new Date(
    Math.min(Date.parse(args.analysisAsOf), Date.parse(args.match.kickoff_at)),
  ).toISOString();
  const latestEvidenceAt = findLatestEvidenceAt([homeEvidence.sourceRecord, awayEvidence.sourceRecord]);
  const postCutoffEvidenceCount = countPostCutoffEvidence(
    [homeEvidence.sourceRecord, awayEvidence.sourceRecord],
    preMatchCutoff,
  );
  const referenceProjection = buildReferenceProjection({
    match: args.match,
    homeTeamName: args.homeTeamName,
    awayTeamName: args.awayTeamName,
  });

  const currentFavorite = resolveOutcomeLeader(
    args.predictionVersion.home_win_prob,
    args.predictionVersion.draw_prob,
    args.predictionVersion.away_win_prob,
  );
  const referenceFavorite = referenceProjection.output
    ? resolveOutcomeLeader(
        referenceProjection.output.predictionVersionProjection.homeWinProb,
        referenceProjection.output.predictionVersionProjection.drawProb,
        referenceProjection.output.predictionVersionProjection.awayWinProb,
      )
    : null;
  const missingEvidence = [
    ...marketValidation.missingEvidence,
    ...(resolvedSignalSnapshotId ? [] : ["prediction.signalSnapshotId"]),
    "signals.movement.history",
    ...(homeEvidence.aliasResolved ? [] : ["teams.home.aliasResolution"]),
    ...(awayEvidence.aliasResolved ? [] : ["teams.away.aliasResolution"]),
  ];

  const input: AtypicalFixtureDetectorInput = {
    fixture: {
      matchId: args.match.id,
      providerFixtureId: parseProviderFixtureId(args.match.external_id),
      competitionKey: normalizeCompetitionKey(args.competition.name),
      stage: args.match.stage,
      kickoffAt: args.match.kickoff_at,
      status: args.match.status,
      homeTeam: {
        canonicalKey: homeCanonicalKey,
        displayName: args.homeTeamName,
      },
      awayTeam: {
        canonicalKey: awayCanonicalKey,
        displayName: args.awayTeamName,
      },
    },
    prediction: {
      predictionVersionId: args.predictionVersion.id,
      modelVersionId: args.predictionVersion.model_version_id,
      modelVersionName: args.modelVersionName,
      generatedAt: args.predictionVersion.created_at,
      scope: args.predictionVersion.run_scope,
      signalSnapshotId: resolvedSignalSnapshotId,
    },
    coverage: {
      missingEvidence,
      preMatchCutoffSatisfied: postCutoffEvidenceCount === 0,
    },
    evidence: {
      oneXtwo: {
        homePct: args.predictionVersion.home_win_prob,
        drawPct: args.predictionVersion.draw_prob,
        awayPct: args.predictionVersion.away_win_prob,
      },
      expectedGoals: {
        home: args.predictionVersion.expected_home_goals,
        away: args.predictionVersion.expected_away_goals,
      },
      modalScore: {
        ...parseModalScore(args.predictionVersion.most_likely_score),
        probabilityPct: marketValidation.modalProbability.probabilityPct,
      },
      elo: {
        available: elo.available,
        homeTwoWayPct: elo.homeTwoWayPct,
        awayTwoWayPct: elo.awayTwoWayPct,
        homeRating: elo.homeRating,
        awayRating: elo.awayRating,
        favoriteNeutralMarginPct: 7,
        dominantFavoriteThresholdPct: 70,
        dominantInversionFavoriteWinThresholdPct: 75,
        dominantInversionRawFavoriteMarginPp: 12,
      },
      signals: {
        home: {
          ratingScore: homeEvidence.snapshot?.signals.ratingScore ?? null,
          recentFormScore: homeEvidence.snapshot?.signals.recentFormScore ?? null,
          attackScore: homeEvidence.snapshot?.signals.attackScore ?? null,
          defenseScore: homeEvidence.snapshot?.signals.defenseScore ?? null,
          weightedPower: homeEvidence.weightedPower,
        },
        away: {
          ratingScore: awayEvidence.snapshot?.signals.ratingScore ?? null,
          recentFormScore: awayEvidence.snapshot?.signals.recentFormScore ?? null,
          attackScore: awayEvidence.snapshot?.signals.attackScore ?? null,
          defenseScore: awayEvidence.snapshot?.signals.defenseScore ?? null,
          weightedPower: awayEvidence.weightedPower,
        },
        componentGaps: {
          rating: isFiniteNumber(homeEvidence.snapshot?.signals.ratingScore) && isFiniteNumber(awayEvidence.snapshot?.signals.ratingScore)
            ? round(homeEvidence.snapshot!.signals.ratingScore - awayEvidence.snapshot!.signals.ratingScore)
            : null,
          recentForm: isFiniteNumber(homeEvidence.snapshot?.signals.recentFormScore) && isFiniteNumber(awayEvidence.snapshot?.signals.recentFormScore)
            ? round(homeEvidence.snapshot!.signals.recentFormScore - awayEvidence.snapshot!.signals.recentFormScore)
            : null,
          attack: isFiniteNumber(homeEvidence.snapshot?.signals.attackScore) && isFiniteNumber(awayEvidence.snapshot?.signals.attackScore)
            ? round(homeEvidence.snapshot!.signals.attackScore - awayEvidence.snapshot!.signals.attackScore)
            : null,
          defense: isFiniteNumber(homeEvidence.snapshot?.signals.defenseScore) && isFiniteNumber(awayEvidence.snapshot?.signals.defenseScore)
            ? round(homeEvidence.snapshot!.signals.defenseScore - awayEvidence.snapshot!.signals.defenseScore)
            : null,
          weightedPower: isFiniteNumber(homeEvidence.weightedPower) && isFiniteNumber(awayEvidence.weightedPower)
            ? round(homeEvidence.weightedPower - awayEvidence.weightedPower)
            : null,
        },
        movement: {
          available: false,
          maxAbsoluteDelta: null,
          totalAbsoluteDelta: null,
          changedComponents: [],
        },
      },
      markets: {
        bttsYesPct: marketValidation.btts.yesProbability,
        over25Pct: marketValidation.over25.yesProbability,
      },
      confidenceRisk: {
        confidenceScore: args.predictionVersion.confidence_score,
        riskLevel: args.predictionVersion.risk_level,
      },
      sourceIntegrity: {
        qualityVerdict: QUALITY_VERDICT,
        homeAliasResolved: homeEvidence.aliasResolved,
        awayAliasResolved: awayEvidence.aliasResolved,
        homeRecentSampleSize: homeEvidence.sourceRecord?.recent.recentMatchCount ?? null,
        awayRecentSampleSize: awayEvidence.sourceRecord?.recent.recentMatchCount ?? null,
        latestEvidenceAt: latestEvidenceAt ? `${latestEvidenceAt}T00:00:00.000Z` : null,
        postCutoffEvidenceCount,
        centralProvenanceComplete:
          Boolean(args.predictionVersion.id) &&
          Boolean(args.predictionVersion.model_version_id) &&
          Boolean(resolvedSignalSnapshotId) &&
          marketValidation.complete,
      },
      referenceProjection: {
        available: referenceProjection.available && Boolean(referenceProjection.output),
        oneXtwoDeltaMaxPp: referenceProjection.output
          ? Math.max(
              Math.abs(referenceProjection.output.predictionVersionProjection.homeWinProb - args.predictionVersion.home_win_prob),
              Math.abs(referenceProjection.output.predictionVersionProjection.drawProb - args.predictionVersion.draw_prob),
              Math.abs(referenceProjection.output.predictionVersionProjection.awayWinProb - args.predictionVersion.away_win_prob),
            )
          : null,
        expectedGoalsDeltaMax: referenceProjection.output
          ? Math.max(
              Math.abs(referenceProjection.output.predictionVersionProjection.expectedHomeGoals - args.predictionVersion.expected_home_goals),
              Math.abs(referenceProjection.output.predictionVersionProjection.expectedAwayGoals - args.predictionVersion.expected_away_goals),
            )
          : null,
        favoriteChanged: referenceFavorite ? referenceFavorite !== currentFavorite : null,
      },
    },
    provenance: {
      predictionVersionId: args.predictionVersion.id,
      modelVersionId: args.predictionVersion.model_version_id,
      signalSnapshotId: resolvedSignalSnapshotId,
      signalSnapshotDate: resolvedSignalSnapshotId,
      eloSnapshotId: coherenceFixture && resolvedSignalSnapshotId ? `fixture-elo-coherence:${resolvedSignalSnapshotId}` : null,
      qualityReportId: resolvedSignalSnapshotId ? `quality-report:${resolvedSignalSnapshotId}` : null,
      sourceManifestId: resolvedSignalSnapshotId ? `source-manifest:${resolvedSignalSnapshotId}` : null,
      aliasResolverVersion: resolvedSignalSnapshotId ? `national-team-strength-snapshots:${resolvedSignalSnapshotId}` : null,
      referenceProjectionGeneratedInMemory: Boolean(referenceProjection.output),
    },
  };

  return {
    input,
    inputFingerprint: createAtypicalFixtureInputFingerprint({
      input,
      analysisAsOf: args.analysisAsOf,
    }),
  };
}
