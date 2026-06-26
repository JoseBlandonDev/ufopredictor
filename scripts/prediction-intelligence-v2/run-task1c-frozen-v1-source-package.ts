import fs from "node:fs";
import path from "node:path";

import {
  resolveTask1cDefaults,
  runTask1cFrozenV1SourcePackage,
} from "../../lib/prediction-intelligence-v2/task1c-frozen-v1-source-package";

function parseFlagValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return argv[index + 1] ?? null;
}

function loadEnvFile(envFilePath: string): void {
  const absolutePath = path.resolve(envFilePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Environment file not found: ${absolutePath}`);
  }

  const lines = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    process.env[name] = value;
  }
}

async function main() {
  const repoRoot = process.cwd();
  const envFile = parseFlagValue(process.argv, "--env-file") ?? ".env.local";
  loadEnvFile(envFile);

  const defaults = resolveTask1cDefaults(repoRoot);
  const artifactsDir = parseFlagValue(process.argv, "--artifacts-dir") ?? defaults.artifactsDir;
  const projectRef = parseFlagValue(process.argv, "--project-ref") ?? "";
  const denyProjectRef = parseFlagValue(process.argv, "--deny-project-ref") ?? "";

  const result = await runTask1cFrozenV1SourcePackage({
    repoRoot,
    artifactsDir,
    projectRef,
    denyProjectRef,
    supabaseUrl: defaults.supabaseUrl,
  });

  console.log(`artifact_dir=${result.artifactDirectory}`);
  console.log(`package_path=${result.packagePath}`);
  console.log(`manifest_path=${result.manifestPath}`);
  console.log(`validation_path=${result.validationPath}`);
  console.log(`checksums_path=${result.checksumsPath}`);
  console.log(`source_project_ref=${result.authorization.sourceProjectRef}`);
  console.log(`package_sha256=${result.runReportData.reads.first.packageSha256}`);
  console.log(`byte_equality=${result.runReportData.byteEquality}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
