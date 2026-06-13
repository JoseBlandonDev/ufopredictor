export const ALLOWED_PREMIUM_MARKETS_V1 = [
  "btts",
  "over_2_5",
  "exact_score",
  "match_winner",
] as const;

export type AllowedPremiumMarket = (typeof ALLOWED_PREMIUM_MARKETS_V1)[number];

export type PremiumMarketProjection = {
  marketKey: AllowedPremiumMarket;
  label: string;
  selection: string;
  probability: number;
  confidence?: number | null;
};

export type PremiumNarrativeProjection = {
  locale: "es" | "en";
  premiumAnalysis: string;
  whyItChanged?: string | null;
  riskNotes?: string | null;
};

export type PremiumModelDetailProjection = {
  expectedGoals: {
    home: number;
    away: number;
  };
  topScorelines: Array<{
    score: string;
    probability: number;
  }>;
  bothTeamsToScore: {
    yesProbability: number;
    noProbability: number;
  };
  totalGoals25: {
    overProbability: number;
    underProbability: number;
  };
  confidence?: {
    score: number;
    riskLevel: "low" | "medium" | "high";
  } | null;
};

export type PremiumMatchAuthorizedPayload = {
  markets: PremiumMarketProjection[];
  narrative: PremiumNarrativeProjection | null;
  modelDetail?: PremiumModelDetailProjection | null;
  confidenceContext?: {
    confidenceScore: number;
    riskLevel: "low" | "medium" | "high";
    explanation?: string | null;
  } | null;
};

export type RawPremiumMarketCandidate = {
  marketKey: string;
  label: string;
  selection: string;
  probability: number;
  confidence?: number | null;
};

type AllowedPremiumMarketCandidate = Omit<RawPremiumMarketCandidate, "marketKey"> & {
  marketKey: AllowedPremiumMarket;
};

export type RawPremiumNarrativeCandidate = {
  locale: "es" | "en";
  premium_analysis?: string | null;
  why_it_changed?: string | null;
  risk_notes?: string | null;
};

export type RawPremiumModelDetailCandidate = {
  expected_goals?: {
    home?: number | null;
    away?: number | null;
  } | null;
  top_scorelines?:
    | Array<{
        score?: string | null;
        probability?: number | null;
      }>
    | null;
  both_teams_to_score?: {
    yes_probability?: number | null;
    no_probability?: number | null;
  } | null;
  total_goals_2_5?: {
    over_probability?: number | null;
    under_probability?: number | null;
  } | null;
  confidence?: {
    score?: number | null;
    risk_level?: "low" | "medium" | "high" | null;
  } | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeScorelineCandidate(candidate: {
  score?: string | null;
  probability?: number | null;
}) {
  if (
    typeof candidate.score !== "string" ||
    candidate.score.length === 0 ||
    !isFiniteNumber(candidate.probability)
  ) {
    return null;
  }

  return {
    score: candidate.score,
    probability: candidate.probability,
  };
}

function isAllowedPremiumMarket(marketKey: string): marketKey is AllowedPremiumMarket {
  return ALLOWED_PREMIUM_MARKETS_V1.includes(marketKey as AllowedPremiumMarket);
}

function isAllowedPremiumMarketCandidate(
  candidate: RawPremiumMarketCandidate,
): candidate is AllowedPremiumMarketCandidate {
  return isAllowedPremiumMarket(candidate.marketKey);
}

export function selectAllowedPremiumMarkets(
  candidates: RawPremiumMarketCandidate[],
): PremiumMarketProjection[] {
  return candidates
    .filter(isAllowedPremiumMarketCandidate)
    .map((candidate) => ({
      marketKey: candidate.marketKey,
      label: candidate.label,
      selection: candidate.selection,
      probability: candidate.probability,
      confidence: candidate.confidence ?? null,
    }));
}

export function selectAllowedPremiumNarrative(
  candidate: RawPremiumNarrativeCandidate | null,
): PremiumNarrativeProjection | null {
  if (!candidate || !candidate.premium_analysis) {
    return null;
  }

  return {
    locale: candidate.locale,
    premiumAnalysis: candidate.premium_analysis,
    whyItChanged: candidate.why_it_changed ?? null,
    riskNotes: candidate.risk_notes ?? null,
  };
}

export function selectAllowedPremiumModelDetail(
  candidate: RawPremiumModelDetailCandidate | null | undefined,
): PremiumModelDetailProjection | null {
  if (!candidate) {
    return null;
  }

  const expectedGoals = candidate.expected_goals;
  const bothTeamsToScore = candidate.both_teams_to_score;
  const totalGoals25 = candidate.total_goals_2_5;
  const topScorelines = (candidate.top_scorelines ?? [])
    .map(normalizeScorelineCandidate)
    .filter((scoreline): scoreline is NonNullable<typeof scoreline> => scoreline !== null)
    .slice(0, 3);

  if (
    !expectedGoals ||
    !isFiniteNumber(expectedGoals.home) ||
    !isFiniteNumber(expectedGoals.away) ||
    !bothTeamsToScore ||
    !isFiniteNumber(bothTeamsToScore.yes_probability) ||
    !isFiniteNumber(bothTeamsToScore.no_probability) ||
    !totalGoals25 ||
    !isFiniteNumber(totalGoals25.over_probability) ||
    !isFiniteNumber(totalGoals25.under_probability) ||
    topScorelines.length === 0
  ) {
    return null;
  }

  const confidence =
    candidate.confidence &&
    isFiniteNumber(candidate.confidence.score) &&
    (candidate.confidence.risk_level === "low" ||
      candidate.confidence.risk_level === "medium" ||
      candidate.confidence.risk_level === "high")
      ? {
          score: candidate.confidence.score,
          riskLevel: candidate.confidence.risk_level,
        }
      : null;

  return {
    expectedGoals: {
      home: expectedGoals.home,
      away: expectedGoals.away,
    },
    topScorelines,
    bothTeamsToScore: {
      yesProbability: bothTeamsToScore.yes_probability,
      noProbability: bothTeamsToScore.no_probability,
    },
    totalGoals25: {
      overProbability: totalGoals25.over_probability,
      underProbability: totalGoals25.under_probability,
    },
    confidence,
  };
}

export function buildAuthorizedPremiumPayload(input: {
  markets: RawPremiumMarketCandidate[];
  narrative: RawPremiumNarrativeCandidate | null;
  modelDetail?: RawPremiumModelDetailCandidate | null;
  confidenceContext?: PremiumMatchAuthorizedPayload["confidenceContext"];
}): PremiumMatchAuthorizedPayload {
  const modelDetail = selectAllowedPremiumModelDetail(input.modelDetail ?? null);
  const confidenceContext =
    input.confidenceContext ??
    (modelDetail?.confidence
      ? {
          confidenceScore: modelDetail.confidence.score,
          riskLevel: modelDetail.confidence.riskLevel,
          explanation: null,
        }
      : null);

  return {
    markets: selectAllowedPremiumMarkets(input.markets),
    narrative: selectAllowedPremiumNarrative(input.narrative),
    modelDetail,
    confidenceContext,
  };
}

export type LockedPremiumMatchProjection = {
  status: "locked";
  reason: "no_entitlement";
};

export type UnavailablePremiumMatchProjection = {
  status: "unavailable";
  reason: "missing_match_context" | "invalid_match_context" | "access_decision_unavailable";
};

export type AuthorizedPremiumMatchProjection = {
  status: "authorized";
  payload: PremiumMatchAuthorizedPayload;
};

export type MissingAuthorizedPayloadProjection = {
  status: "authorized_unavailable";
  reason: "missing_authorized_payload";
};

export type PremiumMatchProjection =
  | LockedPremiumMatchProjection
  | UnavailablePremiumMatchProjection
  | AuthorizedPremiumMatchProjection
  | MissingAuthorizedPayloadProjection;

export type PremiumAccessStatus =
  | LockedPremiumMatchProjection
  | UnavailablePremiumMatchProjection
  | { status: "authorized" };

export function shapePremiumMatchProjection(
  premiumAccess: PremiumAccessStatus,
  payload: PremiumMatchAuthorizedPayload | null,
): PremiumMatchProjection {
  if (premiumAccess.status === "locked") {
    return premiumAccess;
  }

  if (premiumAccess.status === "unavailable") {
    return premiumAccess;
  }

  if (payload === null) {
    return {
      status: "authorized_unavailable",
      reason: "missing_authorized_payload",
    };
  }

  return {
    status: "authorized",
    payload,
  };
}
