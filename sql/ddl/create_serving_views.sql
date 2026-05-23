CREATE OR REPLACE VIEW serving.vw_traffic_observations AS
SELECT
  traffic_obs_id,
  event_timestamp,
  street_name,
  avg_speed,
  weather_label
FROM silver.traffic_observations;

CREATE OR REPLACE VIEW serving.vw_top_congested_streets AS
SELECT
  metric_date,
  hour_of_day,
  street_name,
  avg_speed,
  congestion_score
FROM gold.hourly_street_metrics
WHERE congestion_score IS NOT NULL;

CREATE OR REPLACE VIEW serving.vw_weather_impact AS
SELECT
  metric_date,
  weather_label,
  avg_speed,
  avg_congestion_score
FROM gold.weather_traffic_impact
WHERE avg_congestion_score IS NOT NULL;

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
FROM gold.route_summary;

CREATE OR REPLACE VIEW serving.vw_routes_hourly AS
SELECT
  route_id,
  route_name,
  metric_date,
  hour_of_day,
  avg_speed,
  avg_congestion_score,
  estimated_duration_minutes
FROM gold.route_hourly_report;

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
FROM silver.events_observations;

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

CREATE OR REPLACE VIEW serving.vw_reports_summary AS
SELECT
  (SELECT COUNT(*) FROM gold.route_summary) AS route_count,
  (SELECT COUNT(*) FROM gold.top_congested_segments) AS congested_segment_count,
  (SELECT COUNT(*) FROM silver.events_observations) AS event_count,
  (SELECT COUNT(*) FROM silver.ride_history) AS ride_count,
  (SELECT ROUND(AVG(avg_congestion_score), 2) FROM gold.route_summary) AS avg_route_congestion_score,
  (SELECT ROUND(AVG(avg_speed), 2) FROM gold.route_summary) AS avg_route_speed,
  (SELECT COUNT(*) FROM gold.route_summary WHERE congestion_level = 'high') AS high_congestion_route_count;

CREATE OR REPLACE VIEW serving.vw_top_congested_segments AS
SELECT
  segment_rank,
  street_name,
  observation_count,
  avg_speed,
  avg_congestion_score
FROM gold.top_congested_segments;
