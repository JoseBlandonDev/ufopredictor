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

export type PremiumMatchResource = {
  access: "premium";
  resourceType: "match";
  resourceId: string;
  matchId: string;
  competitionId: string;
  // Derive server-side as a canonical stable key (for example `${competitionId}:${stage}`).
  stageAccessKey: string | null;
  homeTeamId: string;
  awayTeamId: string;
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
  if (entitlement.quantity !== null || entitlement.entitlement_type === "match_pack") {
    return false;
  }

  if (entitlement.resource_type === "global") {
    return true;
  }

  return (
    entitlement.resource_type === resource.resourceType &&
    entitlement.resource_id === resource.resourceId
  );
}

function entitlementCoversPremiumMatch(
  entitlement: UserEntitlementRow,
  resource: PremiumMatchResource,
) {
  if (entitlement.quantity !== null || entitlement.entitlement_type === "match_pack") {
    return false;
  }

  switch (entitlement.resource_type) {
    case "global":
      return true;
    case "match":
      return entitlement.resource_id === resource.matchId;
    case "competition":
      return entitlement.resource_id === resource.competitionId;
    case "stage":
      return (
        resource.stageAccessKey !== null &&
        entitlement.resource_id === resource.stageAccessKey
      );
    case "team":
      return (
        entitlement.resource_id === resource.homeTeamId ||
        entitlement.resource_id === resource.awayTeamId
      );
  }
}

function resolvedAccess(
  viewer: ViewerAccessContext,
  source: AccessSource,
  canAccess: boolean,
  now: Date,
): ResolvedAccess {
  return {
    source,
    canAccess,
    isSubscribed: viewer.subscriptions.some((subscription) =>
      isActiveSubscription(subscription, now),
    ),
  };
}

export function resolveResourceAccess(
  viewer: ViewerAccessContext,
  resource: AccessResource,
  now = new Date(),
): ResolvedAccess {
  if (resource.access === "public") {
    return resolvedAccess(viewer, "public_basic_access", true, now);
  }

  if (viewer.role === "admin") {
    return resolvedAccess(viewer, "admin_access", true, now);
  }

  if (viewer.betaFreeResourceIds?.includes(resource.resourceId)) {
    return resolvedAccess(viewer, "beta_free_access", true, now);
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
    return resolvedAccess(viewer, "entitlement_access", true, now);
  }

  return resolvedAccess(viewer, "none", false, now);
}

export function resolvePremiumMatchAccess(
  viewer: ViewerAccessContext,
  resource: PremiumMatchResource,
  now = new Date(),
): ResolvedAccess {
  if (viewer.role === "admin") {
    return resolvedAccess(viewer, "admin_access", true, now);
  }

  if (viewer.betaFreeResourceIds?.includes(resource.matchId)) {
    return resolvedAccess(viewer, "beta_free_access", true, now);
  }

  const hasEntitlement = viewer.entitlements.some(
    (entitlement) =>
      isCurrentEntitlement(entitlement, now) &&
      entitlementCoversPremiumMatch(entitlement, resource),
  );
  const hasUnlock = viewer.matchUnlocks.some(
    (unlock) =>
      unlock.match_id === resource.matchId && isCurrentMatchUnlock(unlock, now),
  );

  if (hasEntitlement || hasUnlock) {
    return resolvedAccess(viewer, "entitlement_access", true, now);
  }

  return resolvedAccess(viewer, "none", false, now);
}
