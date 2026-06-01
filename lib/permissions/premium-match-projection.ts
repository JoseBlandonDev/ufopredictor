export type PremiumMarketKey =
  | "btts"
  | "over_2_5"
  | "exact_score"
  | "model_vs_market"
  | "golden_hour_delta";

export type PremiumMarketProjection = {
  marketKey: PremiumMarketKey;
  label: string;
  selection: string;
  probability: number;
  confidence?: number | null;
};

export type PremiumNarrativeProjection = {
  locale: "es" | "en";
  summary: string;
  deeperContext?: string | null;
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
