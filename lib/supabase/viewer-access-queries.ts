import "server-only";

import type {
  ProfileRow,
  SubscriptionRow,
  UserEntitlementRow,
  UserMatchUnlockRow,
} from "@/types/database";
import {
  isActiveSubscription,
  isCurrentEntitlement,
  isCurrentMatchUnlock,
  resolvePremiumMatchAccess,
  type PremiumMatchResource,
  type ResolvedAccess,
  type ViewerAccessContext,
} from "@/lib/permissions/entitlements";
import { createSupabaseServerClient } from "./server";

export type PremiumMatchAccessDecision =
  | {
      status: "ready";
      access: ResolvedAccess;
    }
  | {
      status: "unavailable";
      message: string;
    };

function unavailableDecision(): PremiumMatchAccessDecision {
  return {
    status: "unavailable",
    message: "No fue posible validar el acceso a este contenido.",
  };
}

export async function getPremiumMatchAccessDecision(
  resource: PremiumMatchResource,
  // This list must be assembled from trusted server-side beta grants only.
  trustedBetaFreeMatchIds: readonly string[] = [],
): Promise<PremiumMatchAccessDecision> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return unavailableDecision();
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return unavailableDecision();
  }

  if (!user) {
    return {
      status: "ready",
      access: resolvePremiumMatchAccess(
        {
          viewerKind: "anon",
          role: null,
          subscriptions: [],
          entitlements: [],
          matchUnlocks: [],
          betaFreeResourceIds: [...trustedBetaFreeMatchIds],
        },
        resource,
      ),
    };
  }

  const [
    { data: profileData, error: profileError },
    { data: subscriptionsData, error: subscriptionsError },
    { data: entitlementsData, error: entitlementsError },
    { data: unlocksData, error: unlocksError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id),
    supabase.from("user_entitlements").select("*").eq("user_id", user.id),
    supabase.from("user_match_unlocks").select("*").eq("user_id", user.id),
  ]);

  if (
    profileError ||
    !profileData ||
    subscriptionsError ||
    entitlementsError ||
    unlocksError
  ) {
    return unavailableDecision();
  }

  const profile = profileData as ProfileRow;
  const viewer: ViewerAccessContext = {
    viewerKind: "authenticated",
    role: profile.role,
    subscriptions: ((subscriptionsData ?? []) as SubscriptionRow[]).filter(
      (subscription) => isActiveSubscription(subscription),
    ),
    entitlements: ((entitlementsData ?? []) as UserEntitlementRow[]).filter(
      (entitlement) => isCurrentEntitlement(entitlement),
    ),
    matchUnlocks: ((unlocksData ?? []) as UserMatchUnlockRow[]).filter((unlock) =>
      isCurrentMatchUnlock(unlock),
    ),
    betaFreeResourceIds: [...trustedBetaFreeMatchIds],
  };

  return {
    status: "ready",
    access: resolvePremiumMatchAccess(viewer, resource),
  };
}
