import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName = readdirSync(join(process.cwd(), "supabase/migrations")).find((fileName) =>
  fileName.endsWith("_prediction_intelligence_v2_data_foundation.sql"),
);
const migration = migrationName
  ? readFileSync(join(process.cwd(), "supabase/migrations", migrationName), "utf8")
  : "";

describe("prediction intelligence v2 task1 migration", () => {
  it("creates the durable analytical snapshot and identity tables", () => {
    expect(migrationName).toBeDefined();
    expect(migration).toContain("create table if not exists public.source_snapshots");
    expect(migration).toContain("create table if not exists public.canonical_team_aliases");
    expect(migration).toContain("create table if not exists public.canonical_team_localizations");
    expect(migration).toContain("create table if not exists public.team_rating_snapshots");
    expect(migration).toContain("create table if not exists public.historical_match_facts");
    expect(migration).toContain("create table if not exists public.signal_snapshots");
  });

  it("adds world cup schedule, venue, and linkage tables without exposing them publicly", () => {
    expect(migration).toContain("create table if not exists public.world_cup_venue_catalog");
    expect(migration).toContain("create table if not exists public.official_schedule_matches");
    expect(migration).toContain("create table if not exists public.official_schedule_match_links");
    expect(migration).toContain('create policy "No direct reads for official schedule matches"');
    expect(migration).toContain('create policy "No direct reads for signal snapshots"');
  });

  it("keeps match identity score-free while preserving correction lineage", () => {
    expect(migration).toContain("natural_match_key text not null");
    expect(migration).toContain("correction_of_id uuid references public.historical_match_facts");
    expect(migration).toContain("unique (source_snapshot_id, natural_match_key)");
  });
});
