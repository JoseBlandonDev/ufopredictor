import { describe, expect, it } from "vitest";

import {
  parseSupabaseSeedPaths,
  resolveTask3AEnvironmentGuard,
} from "./task3";

describe("prediction intelligence v2 task3", () => {
  it("parses the repository seed path from supabase config", () => {
    const config = `
[db.seed]
enabled = true
sql_paths = ["./seed/seed.sql"]
`;

    expect(parseSupabaseSeedPaths(config)).toEqual(["./seed/seed.sql"]);
  });

  it("blocks writes against an unproven hosted Supabase target", () => {
    const guard = resolveTask3AEnvironmentGuard({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://gcpdffkgsdomzyoenalg.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        API_FOOTBALL_KEY: "api",
        PREDICTION_INTELLIGENCE_V2_ENABLE_WRITES: "true",
      },
      envExampleValues: new Map([["NEXT_PUBLIC_APP_URL", "https://ufopredictor.com"]]),
      writeRequested: true,
    });

    expect(guard.targetKind).toBe("hosted_unproven");
    expect(guard.writesAllowed).toBe(false);
    expect(guard.productionWritesImpossible).toBe(true);
  });

  it("allows writes only when a hosted development target is explicitly confirmed", () => {
    const guard = resolveTask3AEnvironmentGuard({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://dev-example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        API_FOOTBALL_KEY: "api",
        PREDICTION_INTELLIGENCE_V2_ENABLE_WRITES: "true",
        PREDICTION_INTELLIGENCE_V2_TARGET_ENV: "development",
        PREDICTION_INTELLIGENCE_V2_CONFIRMED_SAFE_SUPABASE_HOST: "dev-example.supabase.co",
      },
      envExampleValues: new Map([["NEXT_PUBLIC_APP_URL", "https://ufopredictor.com"]]),
      writeRequested: true,
    });

    expect(guard.targetKind).toBe("hosted_confirmed_dev");
    expect(guard.writesAllowed).toBe(true);
  });
});
