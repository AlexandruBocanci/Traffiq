import { API_BASE_URL } from '../config/api';
import {
  ApiListResponse,
  TrafficRecord,
  TopCongestedStreetRecord,
  WeatherImpactRecord,
} from '../types/api';

async function fetchFromApi<T>(path: string): Promise<ApiListResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getTraffic() {
  return fetchFromApi<TrafficRecord>('/traffic');
}

export async function getTopSpeedTraffic() {
  return fetchFromApi<TrafficRecord>('/traffic/top-speed');
}

export async function getTopCongestedStreets() {
  return fetchFromApi<TopCongestedStreetRecord>('/streets/top-congested');
}

export async function getWeatherImpact() {
  return fetchFromApi<WeatherImpactRecord>('/weather-impact');
}
