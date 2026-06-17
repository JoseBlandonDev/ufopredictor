import { describe, expect, it } from "vitest";
import {
  isActiveSubscription,
  resolvePremiumMatchAccess,
  resolveResourceAccess,
  type PremiumMatchResource,
  type ViewerAccessContext,
} from "./entitlements";
import type {
  SubscriptionRow,
  UserEntitlementRow,
  UserMatchUnlockRow,
} from "@/types/database";

const now = new Date("2026-05-26T12:00:00.000Z");
const premiumMatch = {
  access: "premium",
  resourceType: "match",
  resourceId: "match-premium",
  matchId: "match-premium",
} as const;
const protectedMatch: PremiumMatchResource = {
  access: "premium",
  resourceType: "match",
  resourceId: "match-premium",
  matchId: "match-premium",
  competitionId: "competition-world-cup",
  stageAccessKey: "competition-world-cup:semifinal",
  homeTeamId: "team-home",
  awayTeamId: "team-away",
};
const emptyViewer: ViewerAccessContext = {
  viewerKind: "anon",
  role: null,
  subscriptions: [],
  entitlements: [],
  matchUnlocks: [],
};

function entitlement(overrides: Partial<UserEntitlementRow> = {}): UserEntitlementRow {
  return {
    id: "entitlement-1",
    user_id: "user-1",
    entitlement_type: "match_access",
    resource_type: "match",
    resource_id: "match-premium",
    quantity: null,
    starts_at: null,
    ends_at: null,
    source_plan_id: "plan-1",
    created_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function unlock(overrides: Partial<UserMatchUnlockRow> = {}): UserMatchUnlockRow {
  return {
    id: "unlock-1",
    user_id: "user-1",
    match_id: "match-premium",
    source_plan_id: "plan-1",
    unlocked_at: "2026-05-25T00:00:00.000Z",
    expires_at: null,
    ...overrides,
  };
}

function subscription(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: "subscription-1",
    user_id: "user-1",
    plan_id: "plan-1",
    status: "active",
    starts_at: null,
    ends_at: null,
    payment_provider: null,
    provider_customer_id: null,
    provider_subscription_id: null,
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveResourceAccess", () => {
  it("grants anonymous visitors only public basic access", () => {
    expect(
      resolveResourceAccess(
        emptyViewer,
        { access: "public", resourceType: "match", resourceId: "public-match" },
        now,
      ),
    ).toMatchObject({ source: "public_basic_access", canAccess: true });
    expect(resolveResourceAccess(emptyViewer, premiumMatch, now).canAccess).toBe(false);
  });

  it("does not grant premium access to a free user without rights", () => {
    expect(
      resolveResourceAccess(
        { ...emptyViewer, viewerKind: "authenticated", role: "free_user" },
        premiumMatch,
        now,
      ),
    ).toMatchObject({ source: "none", canAccess: false });
  });

  it("represents explicit beta free access without a purchase", () => {
    expect(
      resolveResourceAccess(
        {
          ...emptyViewer,
          viewerKind: "authenticated",
          role: "free_user",
          betaFreeResourceIds: ["match-premium"],
        },
        premiumMatch,
        now,
      ),
    ).toMatchObject({ source: "beta_free_access", canAccess: true });
  });

  it("grants a current entitlement and rejects an expired entitlement", () => {
    const viewer = {
      ...emptyViewer,
      viewerKind: "authenticated" as const,
      role: "premium_user" as const,
      entitlements: [entitlement()],
    };

    expect(resolveResourceAccess(viewer, premiumMatch, now).canAccess).toBe(true);
    expect(
      resolveResourceAccess(
        { ...viewer, entitlements: [entitlement({ ends_at: "2026-05-25T00:00:00.000Z" })] },
        premiumMatch,
        now,
      ).canAccess,
    ).toBe(false);
  });

  it("grants a current match unlock and rejects an expired unlock", () => {
    const viewer = {
      ...emptyViewer,
      viewerKind: "authenticated" as const,
      role: "free_user" as const,
      matchUnlocks: [unlock()],
    };

    expect(resolveResourceAccess(viewer, premiumMatch, now).canAccess).toBe(true);
    expect(
      resolveResourceAccess(
        { ...viewer, matchUnlocks: [unlock({ expires_at: "2026-05-25T00:00:00.000Z" })] },
        premiumMatch,
        now,
      ).canAccess,
    ).toBe(false);
  });

  it("marks active subscriptions but does not use subscription status alone as access", () => {
    const viewer = {
      ...emptyViewer,
      viewerKind: "authenticated" as const,
      role: "premium_user" as const,
      subscriptions: [subscription()],
    };

    expect(resolveResourceAccess(viewer, premiumMatch, now)).toMatchObject({
      canAccess: false,
      isSubscribed: true,
    });
    expect(isActiveSubscription(subscription({ status: "expired" }), now)).toBe(false);
    expect(isActiveSubscription(subscription({ status: "cancelled" }), now)).toBe(false);
    expect(isActiveSubscription(subscription({ status: "pending" }), now)).toBe(false);
  });

  it("permits explicit admin bypass for protected resources", () => {
    expect(
      resolveResourceAccess(
        { ...emptyViewer, viewerKind: "authenticated", role: "admin" },
        premiumMatch,
        now,
      ),
    ).toMatchObject({ source: "admin_access", canAccess: true });
  });
});

describe("resolvePremiumMatchAccess", () => {
  it("denies a protected match without a viewer or rights", () => {
    expect(resolvePremiumMatchAccess(emptyViewer, protectedMatch, now)).toMatchObject({
      source: "none",
      canAccess: false,
    });
  });

  it("does not grant access from premium role alone", () => {
    expect(
      resolvePremiumMatchAccess(
        { ...emptyViewer, viewerKind: "authenticated", role: "premium_user" },
        protectedMatch,
        now,
      ),
    ).toMatchObject({ source: "none", canAccess: false });
  });

  it("reports an active subscription without granting protected access", () => {
    expect(
      resolvePremiumMatchAccess(
        {
          ...emptyViewer,
          viewerKind: "authenticated",
          role: "premium_user",
          subscriptions: [subscription()],
        },
        protectedMatch,
        now,
      ),
    ).toMatchObject({ source: "none", canAccess: false, isSubscribed: true });
  });

  it("grants an exact current match entitlement", () => {
    expect(
      resolvePremiumMatchAccess(
        {
          ...emptyViewer,
          viewerKind: "authenticated",
          role: "free_user",
          entitlements: [entitlement()],
        },
        protectedMatch,
        now,
      ),
    ).toMatchObject({ source: "entitlement_access", canAccess: true });
  });

  it("grants a current match unlock and rejects an expired unlock", () => {
    const viewer = {
      ...emptyViewer,
      viewerKind: "authenticated" as const,
      role: "free_user" as const,
      matchUnlocks: [unlock()],
    };

    expect(resolvePremiumMatchAccess(viewer, protectedMatch, now).canAccess).toBe(true);
    expect(
      resolvePremiumMatchAccess(
        { ...viewer, matchUnlocks: [unlock({ expires_at: "2026-05-25T00:00:00.000Z" })] },
        protectedMatch,
        now,
      ).canAccess,
    ).toBe(false);
  });

  it("grants only a matching competition entitlement", () => {
    const viewer = {
      ...emptyViewer,
      viewerKind: "authenticated" as const,
      role: "free_user" as const,
      entitlements: [
        entitlement({
          entitlement_type: "competition_access",
          resource_type: "competition",
          resource_id: "competition-world-cup",
        }),
      ],
    };

    expect(resolvePremiumMatchAccess(viewer, protectedMatch, now).canAccess).toBe(true);
    expect(
      resolvePremiumMatchAccess(
        viewer,
        { ...protectedMatch, competitionId: "competition-other" },
        now,
      ).canAccess,
    ).toBe(false);
  });

  it("grants only a matching stage entitlement", () => {
    const viewer = {
      ...emptyViewer,
      viewerKind: "authenticated" as const,
      role: "free_user" as const,
      entitlements: [
        entitlement({
          entitlement_type: "stage_access",
          resource_type: "stage",
          resource_id: "competition-world-cup:semifinal",
        }),
      ],
    };

    expect(resolvePremiumMatchAccess(viewer, protectedMatch, now).canAccess).toBe(true);
    expect(
      resolvePremiumMatchAccess(
        viewer,
        { ...protectedMatch, stageAccessKey: "competition-world-cup:final" },
        now,
      ).canAccess,
    ).toBe(false);
  });

  it("does not grant stage access from a non-canonical stage label", () => {
    const viewer = {
      ...emptyViewer,
      viewerKind: "authenticated" as const,
      role: "free_user" as const,
      entitlements: [
        entitlement({
          entitlement_type: "stage_access",
          resource_type: "stage",
          resource_id: "semifinal",
        }),
      ],
    };

    expect(resolvePremiumMatchAccess(viewer, protectedMatch, now).canAccess).toBe(false);
  });

  it("grants a team entitlement for either participating team only", () => {
    const viewerFor = (resourceId: string) => ({
      ...emptyViewer,
      viewerKind: "authenticated" as const,
      role: "free_user" as const,
      entitlements: [
        entitlement({
          entitlement_type: "team_access",
          resource_type: "team",
          resource_id: resourceId,
        }),
      ],
    });

    expect(resolvePremiumMatchAccess(viewerFor("team-home"), protectedMatch, now).canAccess).toBe(true);
    expect(resolvePremiumMatchAccess(viewerFor("team-away"), protectedMatch, now).canAccess).toBe(true);
    expect(resolvePremiumMatchAccess(viewerFor("team-other"), protectedMatch, now).canAccess).toBe(false);
  });

  it("grants a current global entitlement and rejects an expired global entitlement", () => {
    const globalEntitlement = entitlement({
      entitlement_type: "global_premium_access",
      resource_type: "global",
      resource_id: "premium",
    });

    expect(
      resolvePremiumMatchAccess(
        { ...emptyViewer, entitlements: [globalEntitlement] },
        protectedMatch,
        now,
      ).canAccess,
    ).toBe(true);
    expect(
      resolvePremiumMatchAccess(
        {
          ...emptyViewer,
          entitlements: [entitlement({ ...globalEntitlement, ends_at: "2026-05-25T00:00:00.000Z" })],
        },
        protectedMatch,
        now,
      ).canAccess,
    ).toBe(false);
  });

  it("recognizes access after a manual competition grant materializes an entitlement", () => {
    const manualGrantEntitlement = entitlement({
      entitlement_type: "competition_access",
      resource_type: "competition",
      resource_id: protectedMatch.competitionId,
      starts_at: "2026-05-25T00:00:00.000Z",
      ends_at: null,
    });

    expect(
      resolvePremiumMatchAccess(
        {
          ...emptyViewer,
          viewerKind: "authenticated",
          role: "free_user",
          entitlements: [manualGrantEntitlement],
        },
        protectedMatch,
        now,
      ),
    ).toMatchObject({ source: "entitlement_access", canAccess: true });
  });

  it("stops recognizing access after a manual grant revocation expires its entitlement", () => {
    const revokedGrantEntitlement = entitlement({
      entitlement_type: "competition_access",
      resource_type: "competition",
      resource_id: protectedMatch.competitionId,
      starts_at: "2026-05-25T00:00:00.000Z",
      ends_at: "2026-05-26T11:59:59.000Z",
    });

    expect(
      resolvePremiumMatchAccess(
        {
          ...emptyViewer,
          viewerKind: "authenticated",
          role: "free_user",
          entitlements: [revokedGrantEntitlement],
        },
        protectedMatch,
        now,
      ),
    ).toMatchObject({ source: "none", canAccess: false });
  });

  it("does not grant consumable match-pack quantity without an explicit unlock", () => {
    expect(
      resolvePremiumMatchAccess(
        {
          ...emptyViewer,
          viewerKind: "authenticated",
          role: "premium_user",
          entitlements: [
            entitlement({
              entitlement_type: "match_pack",
              resource_type: "match",
              resource_id: protectedMatch.matchId,
              quantity: 10,
            }),
          ],
        },
        protectedMatch,
        now,
      ),
    ).toMatchObject({ source: "none", canAccess: false });
  });

  it("grants beta access only when trusted server context includes the match", () => {
    expect(
      resolvePremiumMatchAccess(
        {
          ...emptyViewer,
          viewerKind: "authenticated",
          role: "free_user",
          betaFreeResourceIds: [protectedMatch.matchId],
        },
        protectedMatch,
        now,
      ),
    ).toMatchObject({ source: "beta_free_access", canAccess: true });
    expect(
      resolvePremiumMatchAccess(
        {
          ...emptyViewer,
          viewerKind: "authenticated",
          role: "free_user",
          betaFreeResourceIds: ["match-other"],
        },
        protectedMatch,
        now,
      ).canAccess,
    ).toBe(false);
  });

  it("returns explicit admin access for an administrator", () => {
    expect(
      resolvePremiumMatchAccess(
        { ...emptyViewer, viewerKind: "authenticated", role: "admin" },
        protectedMatch,
        now,
      ),
    ).toMatchObject({ source: "admin_access", canAccess: true });
  });
});
