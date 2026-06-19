import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260619143000_prediction_refresh_review_gate.sql",
);

const migrationSql = fs.readFileSync(migrationPath, "utf8");

describe("prediction refresh review migration hardening", () => {
  it("locks review cases to one row per match and one publish decision per case", () => {
    expect(migrationSql).toContain("create unique index if not exists prediction_review_cases_match_id_unique");
    expect(migrationSql).toContain("create unique index if not exists prediction_review_decisions_single_publish_idx");
    expect(migrationSql).toContain("create unique index if not exists prediction_review_decisions_published_version_idx");
  });

  it("keeps audit lineage, timestamps, and RLS policies in place", () => {
    expect(migrationSql).toContain("latest_shadow_snapshot_id");
    expect(migrationSql).toContain("latest_ai_execution_id");
    expect(migrationSql).toContain("latest_decision_id");
    expect(migrationSql).toContain("created_at timestamptz not null default now()");
    expect(migrationSql).toContain("updated_at timestamptz not null default now()");
    expect(migrationSql).toContain("enable row level security");
    expect(migrationSql).toContain("public.is_real_fixture_lab_admin()");
  });
});
