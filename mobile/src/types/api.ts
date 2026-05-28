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
  observed_at: string;
  free_flow_speed_kmh: number | null;
  confidence: number | null;
  source_provider: 'tomtom';
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

export type RouteLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

export type RouteGeometry = {
  type: 'LineString';
  coordinates: [number, number][];
};

export type RoutePreviewResponse = {
  origin: RouteLocation;
  destination: RouteLocation;
  distance_km: number;
  duration_minutes: number;
  geometry: RouteGeometry;
  provider: string;
};

export type SavedRouteRecord = {
  saved_route_id: number;
  route_name: string;
  origin_name: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_name: string;
  destination_latitude: number;
  destination_longitude: number;
  distance_km: number;
  duration_minutes: number;
  provider: string;
  created_at: string;
  updated_at: string;
};

export type SaveRouteResponse = {
  saved: boolean;
  data: SavedRouteRecord;
};

export type DistanceUnit = 'km' | 'mi';

export type PreferredRouteType = 'fastest' | 'balanced' | 'less_congested';

export type ThemeMode = 'system' | 'dark' | 'light';

export type UserPreferencesRecord = {
  preference_id: number;
  distance_unit: DistanceUnit;
  preferred_route_type: PreferredRouteType;
  theme_mode: ThemeMode;
  created_at: string;
  updated_at: string;
};

export type PreferencesResponse = {
  data: UserPreferencesRecord;
};

export type UpdatePreferencesResponse = {
  updated: boolean;
  data: UserPreferencesRecord;
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
  traffic_data_source: 'tomtom_snapshot' | 'legacy_seed' | 'unavailable';
};

export type AddRideHistoryResponse = {
  created: boolean;
  data: RideHistoryRecord;
};

export type MapEventRecord = {
  event_id: number;
  event_timestamp: string;
  event_type: string;
  street_name: string;
  event_description: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
};

export type PipelineRunRecord = {
  run_id: number;
  pipeline_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  records_extracted: number;
  records_loaded: number;
  error_message: string | null;
};

export type DataQualityCheckRecord = {
  check_id: number;
  run_id: number;
  check_name: string;
  check_status: string;
  affected_records: number;
  details: string | null;
};

export type PipelineStatusResponse = {
  latest_run: PipelineRunRecord | null;
  data_quality_checks: DataQualityCheckRecord[];
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
  traffic_source: 'tomtom';
  traffic_scope: string;
  traffic_observed_at: string | null;
};

export type MobilityRefreshResponse = {
  refreshed: boolean;
  reason?: 'rate_limited' | 'refresh_failed';
  pipeline_name?: string;
  run_id?: number;
};

export type TrafficProfileValueSource = 'baseline' | 'tomtom_observed';

export type TrafficProfileRecord = {
  weekday_index: number;
  weekday_label: string;
  hour_of_day: number;
  traffic_score: number;
  baseline_congestion_score: number;
  observed_congestion_score: number | null;
  observations_count: number;
  latest_observed_at: string | null;
  value_source: TrafficProfileValueSource;
};

export type TrafficProfileResponse = {
  traffic_scope: string;
  metric_label: string;
  current_weekday_index: number;
  current_hour: number;
  generated_at: string;
  data: TrafficProfileRecord[];
};
