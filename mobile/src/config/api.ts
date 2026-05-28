const CLOUD_API_BASE_URL = 'https://eguwdq6puz.eu-central-1.awsapprunner.com';
const CLOUD_MOBILITY_REFRESH_URL =
  'https://vmazc4lutvisfoj5ko7gsxudcu0abedr.lambda-url.eu-central-1.on.aws/';

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function getConfiguredApiBaseUrl() {
  const processEnv = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;

  const configuredUrl = processEnv?.EXPO_PUBLIC_TRAFFIQ_API_BASE_URL?.trim();

  if (configuredUrl) {
    return normalizeApiBaseUrl(configuredUrl);
  }

  return CLOUD_API_BASE_URL;
}

export const API_BASE_URL = getConfiguredApiBaseUrl();

export function getConfiguredMobilityRefreshUrl() {
  const processEnv = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;

  const configuredUrl =
    processEnv?.EXPO_PUBLIC_TRAFFIQ_MOBILITY_REFRESH_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  return CLOUD_MOBILITY_REFRESH_URL;
}

export const MOBILITY_REFRESH_URL = getConfiguredMobilityRefreshUrl();
