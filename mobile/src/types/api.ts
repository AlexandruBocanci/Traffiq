export type TrafficRecord = {
  traffic_obs_id: number;
  event_timestamp: string;
  street_name: string;
  avg_speed: number | null;
  weather_label: string | null;
};

export type TopCongestedStreetRecord = {
  metric_date: string;
  hour_of_day: number;
  street_name: string;
  avg_speed: number | null;
  congestion_score: number | null;
};

export type WeatherImpactRecord = {
  metric_date: string;
  weather_label: string;
  avg_speed: number | null;
  avg_congestion_score: number | null;
};

export type RouteReportRecord = {
  route_id: number;
  route_name: string;
  origin_name: string;
  destination_name: string;
  route_distance_km: number | null;
  observation_count: number;
  avg_speed: number | null;
  min_speed: number | null;
  max_speed: number | null;
  avg_congestion_score: number | null;
  estimated_duration_minutes: number | null;
  congestion_level: string | null;
};

export type RouteHourlyRecord = {
  route_id: number;
  route_name: string;
  metric_date: string;
  hour_of_day: number;
  avg_speed: number | null;
  avg_congestion_score: number | null;
  estimated_duration_minutes: number | null;
};

export type RideHistoryRecord = {
  ride_id: number;
  started_at: string;
  ended_at: string;
  origin_name: string;
  destination_name: string;
  route_name: string;
  distance_km: number | null;
  avg_speed: number | null;
  congestion_score: number | null;
  estimated_duration_minutes: number | null;
  ride_status: string;
};

export type MapEventRecord = {
  event_id: number;
  event_timestamp: string;
  event_type: string;
  street_name: string;
  event_description: string;
  severity: string;
};

export type ApiListResponse<T> = {
  count: number;
  data: T[];
};

export type HealthResponse = {
  status: string;
};

export type DriveOverviewResponse = {
  routes: RouteReportRecord[];
  events: MapEventRecord[];
  rides: RideHistoryRecord[];
  congested: TopCongestedStreetRecord[];
  weather: WeatherImpactRecord[];
};
