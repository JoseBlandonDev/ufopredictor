import { describe, expect, it } from "vitest";
import { hasCurrentPremiumAccess } from "./current-premium-access";

describe("hasCurrentPremiumAccess", () => {
  it("does not treat an unavailable summary as premium", () => {
    expect(hasCurrentPremiumAccess({ status: "unavailable" })).toBe(false);
    expect(hasCurrentPremiumAccess(null)).toBe(false);
  });

  it("does not treat subscription-only state as premium access", () => {
    expect(
      hasCurrentPremiumAccess({
        status: "ready",
        entitlements: [],
        matchUnlocks: [],
      }),
    ).toBe(false);
  });

  it("treats current entitlements or match unlocks as premium access", () => {
    expect(
      hasCurrentPremiumAccess({
        status: "ready",
        entitlements: [{ id: "entitlement-1" }],
        matchUnlocks: [],
      }),
    ).toBe(true);
    expect(
      hasCurrentPremiumAccess({
        status: "ready",
        entitlements: [],
        matchUnlocks: [{ id: "unlock-1" }],
      }),
    ).toBe(true);
  });
});
