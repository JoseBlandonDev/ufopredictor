import { describe, expect, it } from "vitest";
import {
  buildAuthorizedPremiumPayload,
  selectAllowedPremiumMarkets,
  selectAllowedPremiumNarrative,
  shapePremiumMatchProjection,
  type PremiumMatchAuthorizedPayload,
} from "./premium-match-projection";

const authorizedPayload: PremiumMatchAuthorizedPayload = {
  markets: [
    {
      marketKey: "btts",
      label: "BTTS",
      selection: "yes",
      probability: 58.2,
      confidence: 71.5,
    },
  ],
  narrative: {
    locale: "es",
    premiumAnalysis: "Resumen premium",
    whyItChanged: "Contexto adicional",
    riskNotes: "Notas de riesgo",
  },
  confidenceContext: {
    confidenceScore: 74.1,
    riskLevel: "medium",
    explanation: "Lectura contextual premium",
  },
};

describe("premium match projection contract", () => {
  it("allows only approved premium markets", () => {
    const selected = selectAllowedPremiumMarkets([
      {
        marketKey: "btts",
        label: "BTTS",
        selection: "yes",
        probability: 58.2,
      },
      {
        marketKey: "golden_hour_delta",
        label: "Golden Hour Delta",
        selection: "up",
        probability: 52.1,
      },
    ]);

    expect(selected).toEqual([
      {
        marketKey: "btts",
        label: "BTTS",
        selection: "yes",
        probability: 58.2,
        confidence: null,
      },
    ]);
  });

  it("selects only allowed narrative fields", () => {
    const narrative = selectAllowedPremiumNarrative({
      locale: "es",
      premium_analysis: "Análisis premium",
      why_it_changed: "Cambios detectados",
      risk_notes: "Riesgo medio",
    });

    expect(narrative).toEqual({
      locale: "es",
      premiumAnalysis: "Análisis premium",
      whyItChanged: "Cambios detectados",
      riskNotes: "Riesgo medio",
    });
  });

  it("returns null narrative when premium_analysis is missing", () => {
    const narrative = selectAllowedPremiumNarrative({
      locale: "es",
      premium_analysis: null,
      why_it_changed: "Cambios detectados",
      risk_notes: "Riesgo medio",
    });

    expect(narrative).toBeNull();
  });

  it("builds authorized payload with filtered fields only", () => {
    const payload = buildAuthorizedPremiumPayload({
      markets: [
        {
          marketKey: "match_winner",
          label: "Winner",
          selection: "home",
          probability: 44.1,
        },
        {
          marketKey: "model_vs_market",
          label: "Model vs Market",
          selection: "delta",
          probability: 51.9,
        },
      ],
      narrative: {
        locale: "en",
        premium_analysis: "Premium analysis",
        why_it_changed: "Injuries updated",
        risk_notes: "Volatility high",
      },
      confidenceContext: null,
    });

    expect(payload).toEqual({
      markets: [
        {
          marketKey: "match_winner",
          label: "Winner",
          selection: "home",
          probability: 44.1,
          confidence: null,
        },
      ],
      narrative: {
        locale: "en",
        premiumAnalysis: "Premium analysis",
        whyItChanged: "Injuries updated",
        riskNotes: "Volatility high",
      },
      confidenceContext: null,
    });
  });

  it("locked never includes premium payload", () => {
    const projection = shapePremiumMatchProjection(
      { status: "locked", reason: "no_entitlement" },
      authorizedPayload,
    );

    expect(projection).toEqual({ status: "locked", reason: "no_entitlement" });
    expect("payload" in projection).toBe(false);
  });

  it("unavailable never includes premium payload", () => {
    const projection = shapePremiumMatchProjection(
      { status: "unavailable", reason: "access_decision_unavailable" },
      authorizedPayload,
    );

    expect(projection).toEqual({
      status: "unavailable",
      reason: "access_decision_unavailable",
    });
    expect("payload" in projection).toBe(false);
  });

  it("authorized can include payload when explicitly provided", () => {
    const projection = shapePremiumMatchProjection({ status: "authorized" }, authorizedPayload);

    expect(projection).toEqual({
      status: "authorized",
      payload: authorizedPayload,
    });
  });

  it("authorized without payload returns controlled unavailable state", () => {
    const projection = shapePremiumMatchProjection({ status: "authorized" }, null);

    expect(projection).toEqual({
      status: "authorized_unavailable",
      reason: "missing_authorized_payload",
    });
  });

  it("contract excludes prediction_results in v1", () => {
    const projection = shapePremiumMatchProjection({ status: "authorized" }, authorizedPayload);
    expect(JSON.stringify(projection)).not.toContain("prediction_results");
  });
});
