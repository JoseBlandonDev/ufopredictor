import "server-only";

export const WOMPI_WORLD_CUP_PASS_PLAN_SLUG = "world-cup-pass";
export const WOMPI_WORLD_CUP_PASS_RESOURCE_ID = "world_cup_2026";

export type WompiEnvironment = "sandbox" | "production";

export type WompiServerConfig = {
  env: WompiEnvironment;
  apiBaseUrl: string;
  publicKey: string;
  privateKey: string;
  integritySecret: string;
  currency: "COP";
  appUrl: string;
  usdCopRate: number;
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Configure Wompi server environment variables before using checkout.`);
  }

  return value;
}

function parseWompiEnvironment(value: string): WompiEnvironment {
  if (value === "sandbox" || value === "production") {
    return value;
  }

  throw new Error("WOMPI_ENV must be either sandbox or production.");
}

function parsePositiveInteger(name: string, value: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer.`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive safe integer.`);
  }

  return parsed;
}

export function requireWompiUsdCopRate() {
  return parsePositiveInteger("WOMPI_USD_COP_RATE", requireEnv("WOMPI_USD_COP_RATE"));
}

export function requireWompiServerConfig(): WompiServerConfig {
  const currency = requireEnv("WOMPI_CURRENCY");

  if (currency !== "COP") {
    throw new Error("WOMPI_CURRENCY must be COP for the Wompi Colombia MVP.");
  }

  return {
    env: parseWompiEnvironment(requireEnv("WOMPI_ENV")),
    apiBaseUrl: requireEnv("WOMPI_API_BASE_URL"),
    publicKey: requireEnv("NEXT_PUBLIC_WOMPI_PUBLIC_KEY"),
    privateKey: requireEnv("WOMPI_PRIVATE_KEY"),
    integritySecret: requireEnv("WOMPI_INTEGRITY_SECRET"),
    currency,
    appUrl: requireEnv("NEXT_PUBLIC_APP_URL"),
    usdCopRate: requireWompiUsdCopRate(),
  };
}
