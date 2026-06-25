import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type MigrationVersionEntry = {
  fileName: string;
  version: string;
};

function getSqlMigrationFiles() {
  return readdirSync(join(process.cwd(), "supabase/migrations"))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
}

function parseMigrationVersion(fileName: string) {
  const match = /^(\d+)_/.exec(fileName);
  return match?.[1] ?? null;
}

describe("migration version uniqueness", () => {
  it("requires every SQL migration filename to start with a numeric version prefix", () => {
    const sqlFiles = getSqlMigrationFiles();
    const invalidFiles = sqlFiles.filter((fileName) => parseMigrationVersion(fileName) === null);

    expect(invalidFiles).toEqual([]);
  });

  it("rejects duplicate migration versions across numbered and timestamp SQL files", () => {
    const sqlFiles = getSqlMigrationFiles();
    const entries: MigrationVersionEntry[] = sqlFiles.map((fileName) => ({
      fileName,
      version: parseMigrationVersion(fileName) ?? "<invalid>",
    }));

    const duplicates = new Map<string, string[]>();

    for (const entry of entries) {
      const current = duplicates.get(entry.version) ?? [];
      current.push(entry.fileName);
      duplicates.set(entry.version, current);
    }

    const duplicateGroups = [...duplicates.entries()]
      .filter(([, fileNames]) => fileNames.length > 1)
      .map(([version, fileNames]) => ({ version, fileNames }));

    expect(
      duplicateGroups,
      duplicateGroups.length === 0
        ? undefined
        : `Duplicate migration versions found: ${duplicateGroups
            .map(({ version, fileNames }) => `${version} -> ${fileNames.join(", ")}`)
            .join(" | ")}`,
    ).toEqual([]);
  });
});
