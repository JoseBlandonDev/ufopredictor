export type BillingType = "free" | "one_time" | "monthly" | "custom_pack";

export type PlanFeature = {
  key: string;
  label: string;
  included: boolean;
};

export type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: "USD" | "COP" | "EUR";
  billingType: BillingType;
  isActive: boolean;
  highlighted?: boolean;
  features: PlanFeature[];
};

export type UserEntitlement = {
  id: string;
  userId: string;
  entitlementType: "free_daily" | "full_access" | "match_pack" | "team_access";
  resourceType: "competition" | "match" | "team" | "global";
  resourceId: string;
  quantity?: number;
  endsAt?: string;
};

export type UserMatchUnlock = {
  id: string;
  userId: string;
  matchId: string;
  sourcePlanId: string;
  unlockedAt: string;
  expiresAt: string;
};

export type MockUser = {
  id: string;
  name: string;
  email: string;
  planSlug: string;
  entitlements: UserEntitlement[];
  matchUnlocks: UserMatchUnlock[];
};
