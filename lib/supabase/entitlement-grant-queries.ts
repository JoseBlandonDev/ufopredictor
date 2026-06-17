import "server-only";

import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EntitlementGrantRow, Json } from "@/types/database";

export type ManualEntitlementGrantInput = {
  idempotencyKey: string;
  userId: string;
  grantType: EntitlementGrantRow["grant_type"];
  resourceType: EntitlementGrantRow["resource_type"];
  resourceId?: string | null;
  matchId?: string | null;
  planId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  sourceReference?: string | null;
  metadata?: Json;
};

export type EntitlementGrantMutationResult =
  | {
      status: "ready";
      grant: EntitlementGrantRow;
    }
  | {
      status: "unavailable";
      message: string;
    };

const activationUnavailable =
  "No fue posible activar el acceso premium manual en este momento.";
const revocationUnavailable =
  "No fue posible revocar el acceso premium manual en este momento.";

export async function activateManualEntitlementGrant(
  input: ManualEntitlementGrantInput,
): Promise<EntitlementGrantMutationResult> {
  await requireAdmin("/admin");

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "unavailable",
      message: activationUnavailable,
    };
  }

  const { data, error } = await supabase.rpc("activate_entitlement_grant", {
    p_idempotency_key: input.idempotencyKey,
    p_user_id: input.userId,
    p_grant_type: input.grantType,
    p_resource_type: input.resourceType,
    p_resource_id: input.resourceId ?? null,
    p_match_id: input.matchId ?? null,
    p_plan_id: input.planId ?? null,
    p_starts_at: input.startsAt ?? new Date().toISOString(),
    p_ends_at: input.endsAt ?? null,
    p_source_type: "manual_admin",
    p_source_reference: input.sourceReference ?? null,
    p_metadata_json: input.metadata ?? {},
  });

  if (error || !data) {
    return {
      status: "unavailable",
      message: activationUnavailable,
    };
  }

  return {
    status: "ready",
    grant: data as EntitlementGrantRow,
  };
}

export async function revokeManualEntitlementGrant(input: {
  idempotencyKey: string;
  metadata?: Json;
}): Promise<EntitlementGrantMutationResult> {
  await requireAdmin("/admin");

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "unavailable",
      message: revocationUnavailable,
    };
  }

  const { data, error } = await supabase.rpc("revoke_entitlement_grant", {
    p_idempotency_key: input.idempotencyKey,
    p_metadata_json: input.metadata ?? {},
  });

  if (error || !data) {
    return {
      status: "unavailable",
      message: revocationUnavailable,
    };
  }

  return {
    status: "ready",
    grant: data as EntitlementGrantRow,
  };
}
