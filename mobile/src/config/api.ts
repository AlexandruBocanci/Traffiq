import { NativeModules, Platform } from 'react-native';

function getDevelopmentApiBaseUrl() {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  const scriptUrl = NativeModules.SourceCode?.scriptURL as string | undefined;
  const host = scriptUrl?.split('://')[1]?.split(':')[0];

  if (host) {
    return `http://${host}:8000`;
  }

  return 'http://192.168.1.10:8000';
}

export const API_BASE_URL = getDevelopmentApiBaseUrl();
