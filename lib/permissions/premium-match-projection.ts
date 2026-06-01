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

export type PremiumMatchAuthorizedPayload = {
  markets: PremiumMarketProjection[];
  narrative: PremiumNarrativeProjection | null;
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

export function buildAuthorizedPremiumPayload(input: {
  markets: RawPremiumMarketCandidate[];
  narrative: RawPremiumNarrativeCandidate | null;
  confidenceContext?: PremiumMatchAuthorizedPayload["confidenceContext"];
}): PremiumMatchAuthorizedPayload {
  return {
    markets: selectAllowedPremiumMarkets(input.markets),
    narrative: selectAllowedPremiumNarrative(input.narrative),
    confidenceContext: input.confidenceContext ?? null,
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
