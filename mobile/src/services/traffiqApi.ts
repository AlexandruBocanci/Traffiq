import { API_BASE_URL } from '../config/api';
import {
  ApiListResponse,
  HealthResponse,
  TopCongestedStreetRecord,
  TrafficRecord,
  WeatherImpactRecord,
} from '../types/api';

async function fetchFromApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

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
