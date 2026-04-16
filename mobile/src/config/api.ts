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

export type ApiListResponse<T> = {
  count: number;
  data: T[];
};
