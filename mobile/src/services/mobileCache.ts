import AsyncStorage from '@react-native-async-storage/async-storage';

import { DriveOverviewResponse, RoutePreviewResponse } from '../types/api';

type CacheEnvelope<T> = {
  data: T;
  savedAt: string;
};

const DRIVE_OVERVIEW_CACHE_KEY = 'traffiq.cache.driveOverview.v1';
const ROUTE_PREVIEW_CACHE_KEY = 'traffiq.cache.routePreview.v1';

async function readCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  const rawValue = await AsyncStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as CacheEnvelope<T>;

    if (!parsedValue?.data || !parsedValue.savedAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsedValue;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

async function writeCache<T>(key: string, data: T) {
  const value: CacheEnvelope<T> = {
    data,
    savedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function getCachedDriveOverview() {
  return readCache<DriveOverviewResponse>(DRIVE_OVERVIEW_CACHE_KEY);
}

export function saveCachedDriveOverview(data: DriveOverviewResponse) {
  return writeCache(DRIVE_OVERVIEW_CACHE_KEY, data);
}

export function getCachedRoutePreview() {
  return readCache<RoutePreviewResponse>(ROUTE_PREVIEW_CACHE_KEY);
}

export function saveCachedRoutePreview(data: RoutePreviewResponse) {
  return writeCache(ROUTE_PREVIEW_CACHE_KEY, data);
}
