import type {
  ProfileRow,
  SubscriptionRow,
  UserEntitlementRow,
  UserMatchUnlockRow,
} from "@/types/database";

export type ViewerKind = "anon" | "authenticated";
export type AccessSource =
  | "public_basic_access"
  | "beta_free_access"
  | "entitlement_access"
  | "admin_access"
  | "none";

export type ViewerAccessContext = {
  viewerKind: ViewerKind;
  role: ProfileRow["role"] | null;
  subscriptions: SubscriptionRow[];
  entitlements: UserEntitlementRow[];
  matchUnlocks: UserMatchUnlockRow[];
  // Populate only from server-controlled beta configuration or grants.
  betaFreeResourceIds?: string[];
};

export type AccessResource = {
  access: "public" | "premium";
  resourceType: UserEntitlementRow["resource_type"];
  resourceId: string;
  matchId?: string;
};

export type ResolvedAccess = {
  source: AccessSource;
  canAccess: boolean;
  isSubscribed: boolean;
};

function hasStarted(startsAt: string | null, now: Date) {
  return startsAt === null || new Date(startsAt).getTime() <= now.getTime();
}

function hasNotExpired(endsAt: string | null, now: Date) {
  return endsAt === null || new Date(endsAt).getTime() > now.getTime();
}

export function isActiveSubscription(subscription: SubscriptionRow, now = new Date()) {
  return (
    subscription.status === "active" &&
    hasStarted(subscription.starts_at, now) &&
    hasNotExpired(subscription.ends_at, now)
  );
}

export function isCurrentEntitlement(entitlement: UserEntitlementRow, now = new Date()) {
  return hasStarted(entitlement.starts_at, now) && hasNotExpired(entitlement.ends_at, now);
}

export function isCurrentMatchUnlock(unlock: UserMatchUnlockRow, now = new Date()) {
  return hasNotExpired(unlock.expires_at, now);
}

function entitlementCoversResource(
  entitlement: UserEntitlementRow,
  resource: AccessResource,
) {
  if (entitlement.resource_type === "global") {
    return true;
  }

  return (
    entitlement.resource_type === resource.resourceType &&
    entitlement.resource_id === resource.resourceId
  );
}

export function resolveResourceAccess(
  viewer: ViewerAccessContext,
  resource: AccessResource,
  now = new Date(),
): ResolvedAccess {
  const isSubscribed = viewer.subscriptions.some((subscription) =>
    isActiveSubscription(subscription, now),
  );

  if (resource.access === "public") {
    return { source: "public_basic_access", canAccess: true, isSubscribed };
  }

  if (viewer.role === "admin") {
    return { source: "admin_access", canAccess: true, isSubscribed };
  }

  if (viewer.betaFreeResourceIds?.includes(resource.resourceId)) {
    return { source: "beta_free_access", canAccess: true, isSubscribed };
  }

  const hasEntitlement = viewer.entitlements.some(
    (entitlement) =>
      isCurrentEntitlement(entitlement, now) &&
      entitlementCoversResource(entitlement, resource),
  );
  const hasUnlock =
    resource.matchId !== undefined &&
    viewer.matchUnlocks.some(
      (unlock) =>
        unlock.match_id === resource.matchId && isCurrentMatchUnlock(unlock, now),
    );

  if (hasEntitlement || hasUnlock) {
    return { source: "entitlement_access", canAccess: true, isSubscribed };
  }

  return { source: "none", canAccess: false, isSubscribed };
}
