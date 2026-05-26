import "server-only";

import type { Plan } from "@/types/plans";
import type {
  Json,
  PlanFeatureRow,
  PlanRow,
  ProfileRow,
  SubscriptionRow,
  UserEntitlementRow,
  UserMatchUnlockRow,
} from "@/types/database";
import {
  isActiveSubscription,
  isCurrentEntitlement,
  isCurrentMatchUnlock,
  type ViewerAccessContext,
} from "@/lib/permissions/entitlements";
import { createSupabaseServerClient } from "./server";

const planFeatureLabels: Record<string, string> = {
  basic_1x2: "Probabilidades 1X2 básicas",
  competition_scope: "Cobertura de competición",
  golden_hour_delta: "Seguimiento de cambios del modelo",
  matches_limit: "Partidos incluidos",
  model_vs_market: "Comparación modelo vs. mercado",
  monthly_access: "Acceso mensual",
  short_summary: "Resumen corto",
  stage_scope: "Cobertura por fase",
  team_scope: "Cobertura por equipo",
};

export type PublicPlansCatalogData =
  | {
      status: "ready";
      plans: Plan[];
    }
  | {
      status: "unavailable";
      message: string;
    };

export type ViewerEntitlementSummary =
  | {
      status: "ready";
      role: ProfileRow["role"];
      activeSubscriptions: Array<{
        id: string;
        planName: string | null;
        status: SubscriptionRow["status"];
        endsAt: string | null;
      }>;
      entitlements: UserEntitlementRow[];
      matchUnlocks: UserMatchUnlockRow[];
      accessContext: ViewerAccessContext;
    }
  | {
      status: "unavailable";
      message: string;
    };

function isVisiblePlan(plan: PlanRow, now = new Date()) {
  return (
    plan.is_active &&
    (plan.starts_at === null || new Date(plan.starts_at).getTime() <= now.getTime()) &&
    (plan.ends_at === null || new Date(plan.ends_at).getTime() > now.getTime())
  );
}

function featureLabel(featureKey: string) {
  return (
    planFeatureLabels[featureKey] ??
    featureKey
      .split("_")
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ")
  );
}

function featureIsIncluded(featureValue: Json) {
  if (
    typeof featureValue === "object" &&
    featureValue !== null &&
    !Array.isArray(featureValue)
  ) {
    return featureValue.included !== false;
  }

  return featureValue !== false;
}

function toCatalogPlan(plan: PlanRow, features: PlanFeatureRow[]): Plan {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? "",
    price: plan.price,
    currency: plan.currency,
    billingType: plan.billing_type,
    isActive: plan.is_active,
    highlighted: plan.slug === "world-cup-pass",
    features: features.map((feature) => ({
      key: feature.feature_key,
      label: featureLabel(feature.feature_key),
      included: featureIsIncluded(feature.feature_value),
    })),
  };
}

export async function getPublicPlansCatalogData(): Promise<PublicPlansCatalogData> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "unavailable",
      message: "El catálogo beta no está disponible en este momento.",
    };
  }

  const { data: plansData, error: plansError } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (plansError) {
    return {
      status: "unavailable",
      message: "El catálogo beta no está disponible en este momento.",
    };
  }

  const plans = ((plansData ?? []) as PlanRow[]).filter((plan) => isVisiblePlan(plan));

  if (plans.length === 0) {
    return { status: "ready", plans: [] };
  }

  const planIds = plans.map((plan) => plan.id);
  const { data: featuresData, error: featuresError } = await supabase
    .from("plan_features")
    .select("*")
    .in("plan_id", planIds)
    .order("created_at", { ascending: true });

  if (featuresError) {
    return {
      status: "unavailable",
      message: "El catálogo beta no está disponible en este momento.",
    };
  }

  const features = (featuresData ?? []) as PlanFeatureRow[];

  return {
    status: "ready",
    plans: plans.map((plan) =>
      toCatalogPlan(
        plan,
        features.filter((feature) => feature.plan_id === plan.id),
      ),
    ),
  };
}

export async function getViewerEntitlementSummary(): Promise<ViewerEntitlementSummary> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "unavailable",
      message: "No fue posible consultar tu estado de acceso.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "unavailable",
      message: "No fue posible consultar tu estado de acceso.",
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
    return {
      status: "unavailable",
      message: "No fue posible consultar tu estado de acceso.",
    };
  }

  const profile = profileData as ProfileRow;
  const subscriptions = ((subscriptionsData ?? []) as SubscriptionRow[]).filter(
    (subscription) => isActiveSubscription(subscription),
  );
  const entitlements = ((entitlementsData ?? []) as UserEntitlementRow[]).filter(
    (entitlement) => isCurrentEntitlement(entitlement),
  );
  const matchUnlocks = ((unlocksData ?? []) as UserMatchUnlockRow[]).filter((unlock) =>
    isCurrentMatchUnlock(unlock),
  );

  const planIds = [...new Set(subscriptions.map((subscription) => subscription.plan_id))];
  const { data: subscriptionPlans } =
    planIds.length > 0
      ? await supabase.from("plans").select("id, name").in("id", planIds)
      : { data: [] as Array<{ id: string; name: string }> };
  const planNames = new Map(
    (subscriptionPlans ?? []).map((plan) => [plan.id, plan.name]),
  );

  return {
    status: "ready",
    role: profile.role,
    activeSubscriptions: subscriptions.map((subscription) => ({
      id: subscription.id,
      planName: planNames.get(subscription.plan_id) ?? null,
      status: subscription.status,
      endsAt: subscription.ends_at,
    })),
    entitlements,
    matchUnlocks,
    accessContext: {
      viewerKind: "authenticated",
      role: profile.role,
      subscriptions,
      entitlements,
      matchUnlocks,
    },
  };
}
