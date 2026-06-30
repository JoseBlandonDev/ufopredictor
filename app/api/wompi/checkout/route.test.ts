import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/wompi/checkout", () => ({
  buildWompiCheckoutPayload: vi.fn(),
}));

vi.mock("@/lib/wompi/config", () => ({
  requireWompiServerConfig: vi.fn(),
}));

import { buildWompiCheckoutPayload } from "@/lib/wompi/checkout";
import { requireWompiServerConfig } from "@/lib/wompi/config";
import { POST } from "./route";

describe("Wompi checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated direct requests with 401", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("builds checkout from the server-side intent amount instead of any client-provided amount", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        id: "intent-1",
        reference: "ufo_wc_20260630120000_abcdef123456",
        user_id: "user-1",
        plan_id: "plan-1",
        amount_in_cents: 3500000,
        currency: "COP",
        status: "PENDING",
        checkout_payload: {},
        entitlement_mapping_json: {},
        expires_at: "2026-06-30T12:30:00.000Z",
        created_at: "2026-06-30T12:00:00.000Z",
        updated_at: "2026-06-30T12:00:00.000Z",
      },
      error: null,
    });

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      rpc,
    });

    vi.mocked(requireWompiServerConfig).mockReturnValue({
      env: "sandbox",
      apiBaseUrl: "https://sandbox.wompi.co/v1",
      publicKey: "pub_test_xxx",
      privateKey: "prv_test_xxx",
      integritySecret: "test_integrity_xxx",
      currency: "COP",
      appUrl: "https://ufopredictor.com",
      usdCopRate: 3500,
    });
    vi.mocked(buildWompiCheckoutPayload).mockReturnValue({
      publicKey: "pub_test_xxx",
      currency: "COP",
      amountInCents: 3500000,
      reference: "ufo_wc_20260630120000_abcdef123456",
      redirectUrl: "https://ufopredictor.com/payments/wompi/return",
      expirationTime: "2026-06-30T12:30:00.000Z",
      integritySignature: "sig",
      checkoutUrl: "https://checkout.wompi.co/p/?amount-in-cents=3500000",
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("create_wompi_world_cup_pass_intent", {
      p_expires_at: expect.any(String),
    });
    expect(buildWompiCheckoutPayload).toHaveBeenCalledWith(expect.objectContaining({
      amountInCents: 3500000,
      reference: "ufo_wc_20260630120000_abcdef123456",
    }));
    expect(body).toMatchObject({
      reference: "ufo_wc_20260630120000_abcdef123456",
      amountInCents: 3500000,
      currency: "COP",
    });
  });

  it("returns 409 when the server-side intent RPC rejects a repurchase for an active pass", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "world-cup-pass already active for this account" },
      }),
    });

    vi.mocked(requireWompiServerConfig).mockReturnValue({
      env: "sandbox",
      apiBaseUrl: "https://sandbox.wompi.co/v1",
      publicKey: "pub_test_xxx",
      privateKey: "prv_test_xxx",
      integritySecret: "test_integrity_xxx",
      currency: "COP",
      appUrl: "https://ufopredictor.com",
      usdCopRate: 3500,
    });

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "World Cup Pass already active for this account.",
    });
    expect(buildWompiCheckoutPayload).not.toHaveBeenCalled();
  });
});
