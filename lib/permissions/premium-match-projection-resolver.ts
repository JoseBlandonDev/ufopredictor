import {
  buildAuthorizedPremiumPayload,
  shapePremiumMatchProjection,
  type PremiumMatchAuthorizedPayload,
  type PremiumMatchProjection,
  type RawPremiumMarketCandidate,
  type RawPremiumNarrativeCandidate,
} from "./premium-match-projection";

export type PremiumProjectionRpcRow = {
  markets?: RawPremiumMarketCandidate[] | null;
  narratives?: RawPremiumNarrativeCandidate[] | null;
};

export type PremiumProjectionAccess =
  | { status: "authorized" }
  | { status: "locked"; reason: "no_entitlement" }
  | {
      status: "unavailable";
      reason: "missing_match_context" | "invalid_match_context" | "access_decision_unavailable";
    };

function toAuthorizedPremiumPayload(
  rpcRow: PremiumProjectionRpcRow,
): PremiumMatchAuthorizedPayload {
  const narratives = rpcRow.narratives ?? [];
  const preferredNarrative =
    narratives.find((narrative) => narrative.locale === "es") ?? narratives[0] ?? null;

  return buildAuthorizedPremiumPayload({
    markets: rpcRow.markets ?? [],
    narrative: preferredNarrative,
    confidenceContext: null,
  });
}

export async function resolvePremiumProjectionForMatch(input: {
  premiumAccess: PremiumProjectionAccess;
  matchId: string;
  fetchProjection: (matchId: string) => Promise<{
    data: PremiumProjectionRpcRow | null;
    error: unknown;
  }>;
}): Promise<PremiumMatchProjection> {
  const { premiumAccess, matchId, fetchProjection } = input;

  if (premiumAccess.status !== "authorized") {
    return shapePremiumMatchProjection(premiumAccess, null);
  }

  const { data, error } = await fetchProjection(matchId);
  if (error || data === null) {
    return shapePremiumMatchProjection({ status: "authorized" }, null);
  }

  const payload = toAuthorizedPremiumPayload(data);
  return shapePremiumMatchProjection({ status: "authorized" }, payload);
}
