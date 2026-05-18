const CLOUD_API_BASE_URL = 'https://eguwdq6puz.eu-central-1.awsapprunner.com';

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
