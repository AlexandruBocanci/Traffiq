import { API_BASE_URL, MOBILITY_REFRESH_URL } from '../config/api';
import { resolveSuceavaLocation, SUCEAVA_LOCATIONS } from '../data/suceavaLocations';
import {
  AddRideHistoryResponse,
  ApiListResponse,
  DriveOverviewResponse,
  HealthResponse,
  MapEventRecord,
  MobilityRefreshResponse,
  PipelineStatusResponse,
  PreferencesResponse,
  RideHistoryRecord,
  RouteHourlyRecord,
  RoutePreviewResponse,
  RouteReportRecord,
  SavedRouteRecord,
  SaveRouteResponse,
  TopCongestedStreetRecord,
  TrafficRecord,
  TrafficProfileResponse,
  UpdatePreferencesResponse,
  UserPreferencesRecord,
  WeatherImpactRecord,
} from '../types/api';

type FetchOptions = {
  accessToken?: string;
  body?: unknown;
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT';
};

const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';

function resolveKnownRouteLocation(value: string) {
  const location = resolveSuceavaLocation(value);

  if (!location) {
    throw new Error('Unknown Suceava route location.');
  }

  return location;
}

async function fetchFromApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers,
    method: options.method ?? 'GET',
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getHealthStatus() {
  return fetchFromApi<HealthResponse>('/health');
}

export async function getTraffic() {
  return fetchFromApi<ApiListResponse<TrafficRecord>>('/traffic');
}

export async function getTopSpeedTraffic() {
  return fetchFromApi<ApiListResponse<TrafficRecord>>('/traffic/top-speed');
}

export async function getTopCongestedStreets() {
  return fetchFromApi<ApiListResponse<TopCongestedStreetRecord>>(
    '/streets/top-congested'
  );
}

export async function getWeatherImpact() {
  return fetchFromApi<ApiListResponse<WeatherImpactRecord>>('/weather-impact');
}

export async function getRoutesReport() {
  return fetchFromApi<ApiListResponse<RouteReportRecord>>('/routes/report');
}

export async function getRoutesHourly() {
  return fetchFromApi<ApiListResponse<RouteHourlyRecord>>('/routes/hourly');
}

type RoutePreviewOptions = {
  originLatitude?: number;
  originLongitude?: number;
};

export async function previewRoute(
  originName: string,
  destinationName: string,
  options: RoutePreviewOptions = {}
) {
  try {
    const backendPreview = await fetchFromApi<RoutePreviewResponse>('/routes/preview', {
      body: {
        destination_name: destinationName,
        origin_latitude: options.originLatitude,
        origin_longitude: options.originLongitude,
        origin_name: originName,
      },
      method: 'POST',
    });

    if (backendPreview.provider !== 'local_suceava_fallback') {
      return backendPreview;
    }

    try {
      return await previewRouteDirectlyWithOsrm(originName, destinationName, options);
    } catch {
      return backendPreview;
    }
  } catch {
    return previewRouteDirectlyWithOsrm(originName, destinationName, options);
  }
}

async function previewRouteDirectlyWithOsrm(
  originName: string,
  destinationName: string,
  options: RoutePreviewOptions = {}
): Promise<RoutePreviewResponse> {
  const origin =
    options.originLatitude !== undefined && options.originLongitude !== undefined
      ? {
          aliases: [],
          latitude: options.originLatitude,
          longitude: options.originLongitude,
          name: originName || 'Current location',
        }
      : resolveKnownRouteLocation(originName);
  const destination = resolveKnownRouteLocation(destinationName);
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const params = new URLSearchParams({
    alternatives: 'false',
    geometries: 'geojson',
    overview: 'full',
    steps: 'false',
  });

  const response = await fetch(`${OSRM_ROUTE_URL}/${coordinates}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`OSRM request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const route = payload.routes?.[0];

  if (payload.code !== 'Ok' || !route) {
    throw new Error('OSRM could not calculate this route.');
  }

  return {
    destination: {
      latitude: destination.latitude,
      longitude: destination.longitude,
      name: destination.name,
    },
    distance_km: Math.round((route.distance / 1000) * 100) / 100,
    duration_minutes: Math.round((route.duration / 60) * 10) / 10,
    geometry: route.geometry,
    origin: {
      latitude: origin.latitude,
      longitude: origin.longitude,
      name: origin.name,
    },
    provider: 'OSRM direct',
  };
}

export async function getRidesHistory(accessToken: string) {
  return fetchFromApi<ApiListResponse<RideHistoryRecord>>('/rides/history', {
    accessToken,
  });
}

export async function addRideToHistory(
  routePreview: RoutePreviewResponse,
  accessToken: string,
  congestionScore?: number | null
) {
  return fetchFromApi<AddRideHistoryResponse>('/rides/history', {
    accessToken,
    body: {
      congestion_score: congestionScore ?? null,
      destination: {
        name: routePreview.destination.name,
      },
      distance_km: routePreview.distance_km,
      duration_minutes: routePreview.duration_minutes,
      origin: {
        name: routePreview.origin.name,
      },
      ride_status: 'completed',
      route_name: `${routePreview.origin.name} to ${routePreview.destination.name}`,
    },
    method: 'POST',
  });
}

export async function getSavedRoutes(accessToken: string) {
  return fetchFromApi<ApiListResponse<SavedRouteRecord>>('/saved-routes', {
    accessToken,
  });
}

export async function saveRoute(routePreview: RoutePreviewResponse, accessToken: string) {
  return fetchFromApi<SaveRouteResponse>('/saved-routes', {
    accessToken,
    body: {
      destination: routePreview.destination,
      distance_km: routePreview.distance_km,
      duration_minutes: routePreview.duration_minutes,
      origin: routePreview.origin,
      provider: routePreview.provider,
      route_name: `${routePreview.origin.name} to ${routePreview.destination.name}`,
    },
    method: 'POST',
  });
}

export async function getUserPreferences(accessToken: string) {
  return fetchFromApi<PreferencesResponse>('/preferences', {
    accessToken,
  });
}

export async function updateUserPreferences(
  preferences: Pick<
    UserPreferencesRecord,
    'distance_unit' | 'preferred_route_type' | 'theme_mode'
  >,
  accessToken: string
) {
  return fetchFromApi<UpdatePreferencesResponse>('/preferences', {
    accessToken,
    body: preferences,
    method: 'PUT',
  });
}

export async function getMapEvents() {
  return fetchFromApi<ApiListResponse<MapEventRecord>>('/map/events');
}

export async function getDriveOverview() {
  return fetchFromApi<DriveOverviewResponse>('/mobile/drive-overview');
}

export function getSupportedSuceavaLocations() {
  return SUCEAVA_LOCATIONS;
}

export async function getTrafficProfile() {
  return fetchFromApi<TrafficProfileResponse>('/mobile/traffic-profile');
}

export async function requestMobilityRefresh() {
  if (!MOBILITY_REFRESH_URL) {
    return null;
  }

  const response = await fetch(MOBILITY_REFRESH_URL, { method: 'POST' });

  if (!response.ok) {
    throw new Error(`Mobility refresh request failed with status ${response.status}`);
  }

  return response.json() as Promise<MobilityRefreshResponse>;
}

export async function getPipelineStatus() {
  return fetchFromApi<PipelineStatusResponse>('/pipeline/status');
}
