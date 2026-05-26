import { describe, expect, it } from "vitest";
import {
  isActiveSubscription,
  resolveResourceAccess,
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
