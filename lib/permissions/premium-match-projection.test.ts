import { describe, expect, it } from "vitest";
import {
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
    summary: "Resumen premium",
    deeperContext: "Contexto adicional",
    riskNotes: "Notas de riesgo",
  },
  confidenceContext: {
    confidenceScore: 74.1,
    riskLevel: "medium",
    explanation: "Lectura contextual premium",
  },
};

describe("premium match projection contract", () => {
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
