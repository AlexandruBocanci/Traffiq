import { API_BASE_URL } from '../config/api';
import {
  ApiListResponse,
  DriveOverviewResponse,
  HealthResponse,
  MapEventRecord,
  RideHistoryRecord,
  RouteHourlyRecord,
  RouteReportRecord,
  TopCongestedStreetRecord,
  TrafficRecord,
  WeatherImpactRecord,
} from '../types/api';

type FetchOptions = {
  accessToken?: string;
};

async function fetchFromApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
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
