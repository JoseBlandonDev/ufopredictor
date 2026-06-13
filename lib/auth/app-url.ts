export function getAppUrl(fallbackOrigin?: string) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  return fallbackOrigin ?? "http://localhost:3000";
}

export function buildAppUrl(path: string, fallbackOrigin?: string) {
  return new URL(path, getAppUrl(fallbackOrigin));
}
