import { API_BASE_URL } from '../config/api';
import {
  ApiListResponse,
  DriveOverviewResponse,
  HealthResponse,
  MapEventRecord,
  RideHistoryRecord,
  RouteHourlyRecord,
  RoutePreviewResponse,
  RouteReportRecord,
  TopCongestedStreetRecord,
  TrafficRecord,
  WeatherImpactRecord,
} from '../types/api';

type FetchOptions = {
  accessToken?: string;
  body?: unknown;
  method?: 'GET' | 'POST';
};

type KnownRouteLocation = {
  aliases: string[];
  latitude: number;
  longitude: number;
  name: string;
};

const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';

const SUCEAVA_ROUTE_LOCATIONS: KnownRouteLocation[] = [
  {
    aliases: ['city center', 'suceava center', 'centru'],
    latitude: 47.6514,
    longitude: 26.2556,
    name: 'City Center',
  },
  {
    aliases: ['iulius mall suceava', 'iulius mall', 'mall'],
    latitude: 47.6703,
    longitude: 26.2589,
    name: 'Iulius Mall Suceava',
  },
  {
    aliases: ['stefan cel mare university', 'universitatea stefan cel mare', 'usv', 'university'],
    latitude: 47.6416,
    longitude: 26.2449,
    name: 'Stefan cel Mare University',
  },
  {
    aliases: ['suceava fortress', 'cetatea de scaun', 'fortress'],
    latitude: 47.6467,
    longitude: 26.2704,
    name: 'Suceava Fortress',
  },
  {
    aliases: ['suceava railway station', 'gara suceava', 'railway station'],
    latitude: 47.6613,
    longitude: 26.2736,
    name: 'Suceava Railway Station',
  },
];

function normalizeLocationName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveKnownRouteLocation(value: string) {
  const normalizedValue = normalizeLocationName(value);

  const location = SUCEAVA_ROUTE_LOCATIONS.find((candidate) => {
    const names = [candidate.name, ...candidate.aliases].map(normalizeLocationName);
    return names.includes(normalizedValue);
  });

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

export async function getMapEvents() {
  return fetchFromApi<ApiListResponse<MapEventRecord>>('/map/events');
}

export async function getDriveOverview() {
  return fetchFromApi<DriveOverviewResponse>('/mobile/drive-overview');
}
