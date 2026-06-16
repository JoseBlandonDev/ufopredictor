import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getRealFixturePublishQueueData,
  REAL_FIXTURE_PUBLISH_QUEUE_EXTERNAL_IDS,
} from "./real-fixture-publish-queue-queries";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

describe("real fixture publish queue queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("reads only the exact pending fixture ids and performs no writes", async () => {
    const matchInCalls: Array<[string, unknown[]]> = [];

    const fakeClient = {
      from(table: string) {
        if (table === "model_versions") {
          return {
            select() {
              return {
                eq() {
                  return this;
                },
                order() {
                  return this;
                },
                limit() {
                  return this;
                },
                maybeSingle() {
                  return Promise.resolve({ data: { id: "model-1", created_at: "2026-06-16T00:00:00Z" }, error: null });
                },
              };
            },
          };
        }

        if (table === "matches") {
          return {
            select() {
              return {
                in(column: string, values: unknown[]) {
                  matchInCalls.push([column, values]);
                  return this;
                },
                eq() {
                  return this;
                },
                order() {
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
          };
        }

        return {
          select() {
            throw new Error(`unexpected table access: ${table}`);
          },
          insert() {
            throw new Error("writes are not allowed in publish queue query helper");
          },
          update() {
            throw new Error("writes are not allowed in publish queue query helper");
          },
          delete() {
            throw new Error("writes are not allowed in publish queue query helper");
          },
        };
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getRealFixturePublishQueueData();

    expect(result).toEqual({
      activeModelVersionId: "model-1",
      rows: [],
    });
    expect(matchInCalls).toEqual([["external_id", [...REAL_FIXTURE_PUBLISH_QUEUE_EXTERNAL_IDS]]]);
  });
});
