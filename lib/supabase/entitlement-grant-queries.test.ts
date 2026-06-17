import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  activateManualEntitlementGrant,
  revokeManualEntitlementGrant,
} from "./entitlement-grant-queries";
import type { EntitlementGrantRow } from "@/types/database";

const { createSupabaseServerClientMock, requireAdminMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  requireAdminMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

const activeGrant = {
  id: "grant-1",
  idempotency_key: "manual:user-1:world-cup-pass",
  source_type: "manual_admin",
  source_reference: null,
  user_id: "user-1",
  plan_id: "plan-1",
  subscription_id: "subscription-1",
  user_entitlement_id: "entitlement-1",
  user_match_unlock_id: null,
  grant_type: "competition_access",
  resource_type: "competition",
  resource_id: "world_cup_2026",
  match_id: null,
  starts_at: "2026-06-17T00:00:00.000Z",
  ends_at: null,
  status: "active",
  created_by: "admin-1",
  revoked_by: null,
  revoked_at: null,
  metadata_json: {},
  created_at: "2026-06-17T00:00:00.000Z",
  updated_at: "2026-06-17T00:00:00.000Z",
} satisfies EntitlementGrantRow;

type RpcResult = {
  data: EntitlementGrantRow | null;
  error: { message: string } | null;
};

function createFakeSupabaseClient(result: RpcResult = { data: activeGrant, error: null }) {
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];

  return {
    rpcCalls,
    client: {
      rpc(fn: string, args: Record<string, unknown>) {
        rpcCalls.push({ fn, args });
        return Promise.resolve(result);
      },
    },
  };
}

describe("entitlement grant queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({
      user: { id: "admin-1" },
      profile: { role: "admin" },
    });
  });

  it("activates a manual admin grant through the admin-only RPC", async () => {
    const { client, rpcCalls } = createFakeSupabaseClient();
    createSupabaseServerClientMock.mockResolvedValue(client);

    const result = await activateManualEntitlementGrant({
      idempotencyKey: "manual:user-1:world-cup-pass",
      userId: "user-1",
      grantType: "competition_access",
      resourceType: "competition",
      resourceId: "world_cup_2026",
      planId: "plan-1",
      startsAt: "2026-06-17T00:00:00.000Z",
      metadata: { note: "manual test grant" },
    });

    expect(requireAdminMock).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({ status: "ready", grant: activeGrant });
    expect(rpcCalls).toEqual([
      {
        fn: "activate_entitlement_grant",
        args: {
          p_idempotency_key: "manual:user-1:world-cup-pass",
          p_user_id: "user-1",
          p_grant_type: "competition_access",
          p_resource_type: "competition",
          p_resource_id: "world_cup_2026",
          p_match_id: null,
          p_plan_id: "plan-1",
          p_starts_at: "2026-06-17T00:00:00.000Z",
          p_ends_at: null,
          p_source_type: "manual_admin",
          p_source_reference: null,
          p_metadata_json: { note: "manual test grant" },
        },
      },
    ]);
  });

  it("does not call the activation RPC for non-admin or anonymous callers", async () => {
    requireAdminMock.mockRejectedValue(new Error("REDIRECT:/dashboard?error=admin-access-required"));
    const { client, rpcCalls } = createFakeSupabaseClient();
    createSupabaseServerClientMock.mockResolvedValue(client);

    await expect(
      activateManualEntitlementGrant({
        idempotencyKey: "manual:user-1:world-cup-pass",
        userId: "user-1",
        grantType: "competition_access",
        resourceType: "competition",
        resourceId: "world_cup_2026",
      }),
    ).rejects.toThrow(/admin-access-required/);
    expect(rpcCalls).toEqual([]);
  });

  it("returns unavailable when activation RPC fails", async () => {
    const { client } = createFakeSupabaseClient({
      data: null,
      error: { message: "rpc failed" },
    });
    createSupabaseServerClientMock.mockResolvedValue(client);

    const result = await activateManualEntitlementGrant({
      idempotencyKey: "manual:user-1:world-cup-pass",
      userId: "user-1",
      grantType: "competition_access",
      resourceType: "competition",
      resourceId: "world_cup_2026",
    });

    expect(result).toEqual({
      status: "unavailable",
      message: "No fue posible activar el acceso premium manual en este momento.",
    });
  });

  it("revokes a manual grant through the admin-only RPC", async () => {
    const revokedGrant = {
      ...activeGrant,
      status: "revoked",
      revoked_by: "admin-1",
      revoked_at: "2026-06-18T00:00:00.000Z",
    } satisfies EntitlementGrantRow;
    const { client, rpcCalls } = createFakeSupabaseClient({
      data: revokedGrant,
      error: null,
    });
    createSupabaseServerClientMock.mockResolvedValue(client);

    const result = await revokeManualEntitlementGrant({
      idempotencyKey: "manual:user-1:world-cup-pass",
      metadata: { reason: "manual revoke test" },
    });

    expect(requireAdminMock).toHaveBeenCalledWith("/admin");
    expect(result).toEqual({ status: "ready", grant: revokedGrant });
    expect(rpcCalls).toEqual([
      {
        fn: "revoke_entitlement_grant",
        args: {
          p_idempotency_key: "manual:user-1:world-cup-pass",
          p_metadata_json: { reason: "manual revoke test" },
        },
      },
    ]);
  });

  it("does not call the revocation RPC for non-admin callers", async () => {
    requireAdminMock.mockRejectedValue(new Error("REDIRECT:/dashboard?error=admin-access-required"));
    const { client, rpcCalls } = createFakeSupabaseClient();
    createSupabaseServerClientMock.mockResolvedValue(client);

    await expect(
      revokeManualEntitlementGrant({
        idempotencyKey: "manual:user-1:world-cup-pass",
      }),
    ).rejects.toThrow(/admin-access-required/);
    expect(rpcCalls).toEqual([]);
  });
});
