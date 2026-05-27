CREATE OR REPLACE VIEW serving.vw_traffic_observations AS
SELECT
  flow_obs_id AS traffic_obs_id,
  observed_at AS event_timestamp,
  corridor_name AS street_name,
  current_speed_kmh AS avg_speed,
  (SELECT weather_label FROM silver.current_weather_snapshot WHERE source_provider = 'open-meteo') AS weather_label
FROM silver.tomtom_flow_observations
WHERE source_provider = 'tomtom';

CREATE OR REPLACE VIEW serving.vw_top_congested_streets AS
SELECT
  observed_at::date AS metric_date,
  EXTRACT(HOUR FROM observed_at)::integer AS hour_of_day,
  corridor_name AS street_name,
  current_speed_kmh AS avg_speed,
  congestion_score
FROM gold.current_corridor_traffic
WHERE source_provider = 'tomtom';

CREATE OR REPLACE VIEW serving.vw_weather_impact AS
SELECT
  weather.observed_at::date AS metric_date,
  weather.weather_label,
  ROUND(AVG(traffic.current_speed_kmh), 2)::NUMERIC(10, 2) AS avg_speed,
  ROUND(AVG(traffic.congestion_score), 2)::NUMERIC(5, 2) AS avg_congestion_score
FROM silver.current_weather_snapshot weather
CROSS JOIN gold.current_corridor_traffic traffic
WHERE weather.source_provider = 'open-meteo'
  AND traffic.source_provider = 'tomtom'
GROUP BY weather.observed_at::date, weather.weather_label;

CREATE OR REPLACE VIEW serving.vw_routes_report AS
SELECT
  route_id,
  route_name,
  origin_name,
  destination_name,
  route_distance_km,
  observation_count,
  avg_speed,
  min_speed,
  max_speed,
  avg_congestion_score,
  estimated_duration_minutes,
  congestion_level
FROM gold.route_summary
WHERE FALSE;

CREATE OR REPLACE VIEW serving.vw_routes_hourly AS
SELECT
  route_id,
  route_name,
  metric_date,
  hour_of_day,
  avg_speed,
  avg_congestion_score,
  estimated_duration_minutes
FROM gold.route_hourly_report
WHERE FALSE;

CREATE OR REPLACE VIEW serving.vw_map_events AS
SELECT
  event_obs_id AS event_id,
  event_timestamp,
  event_type,
  street_name,
  event_description,
  severity,
  latitude,
  longitude
FROM silver.tomtom_incidents
WHERE source_provider = 'tomtom';

CREATE OR REPLACE VIEW serving.vw_ride_history AS
SELECT
  ride_id,
  started_at,
  ended_at,
  origin_name,
  destination_name,
  route_name,
  distance_km,
  avg_speed,
  congestion_score,
  estimated_duration_minutes,
  ride_status
FROM silver.ride_history;

CREATE OR REPLACE VIEW serving.vw_user_ride_history AS
SELECT
  ride_id,
  cognito_user_sub,
  started_at,
  ended_at,
  origin_name,
  destination_name,
  route_name,
  distance_km,
  avg_speed,
  congestion_score,
  estimated_duration_minutes,
  ride_status,
  source,
  created_at,
  traffic_data_source
FROM silver.user_ride_history;

CREATE OR REPLACE VIEW serving.vw_user_preferences AS
SELECT
  preference_id,
  cognito_user_sub,
  distance_unit,
  preferred_route_type,
  theme_mode,
  created_at,
  updated_at
FROM silver.user_preferences;

CREATE OR REPLACE VIEW serving.vw_saved_routes AS
SELECT
  saved_route_id,
  cognito_user_sub,
  route_name,
  origin_name,
  origin_latitude,
  origin_longitude,
  destination_name,
  destination_latitude,
  destination_longitude,
  distance_km,
  duration_minutes,
  provider,
  created_at,
  updated_at
FROM silver.saved_routes;

CREATE OR REPLACE VIEW serving.vw_reports_summary AS
SELECT
  0::bigint AS route_count,
  (SELECT COUNT(*) FROM gold.current_corridor_traffic WHERE source_provider = 'tomtom') AS congested_segment_count,
  (SELECT COUNT(*) FROM silver.tomtom_incidents WHERE source_provider = 'tomtom') AS event_count,
  (SELECT COUNT(*) FROM silver.ride_history) AS ride_count,
  (SELECT ROUND(AVG(congestion_score), 2) FROM gold.current_corridor_traffic WHERE source_provider = 'tomtom') AS avg_route_congestion_score,
  (SELECT ROUND(AVG(current_speed_kmh), 2) FROM gold.current_corridor_traffic WHERE source_provider = 'tomtom') AS avg_route_speed,
  (SELECT COUNT(*) FROM gold.current_corridor_traffic WHERE source_provider = 'tomtom' AND congestion_score >= 65) AS high_congestion_route_count;

CREATE OR REPLACE VIEW serving.vw_top_congested_segments AS
SELECT
  ROW_NUMBER() OVER (ORDER BY congestion_score DESC, corridor_key ASC)::integer AS segment_rank,
  corridor_name AS street_name,
  1::integer AS observation_count,
  current_speed_kmh AS avg_speed,
  congestion_score AS avg_congestion_score
FROM gold.current_corridor_traffic
WHERE source_provider = 'tomtom';
