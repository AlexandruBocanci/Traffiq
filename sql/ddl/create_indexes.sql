CREATE INDEX IF NOT EXISTS idx_traffic_observations_timestamp
ON silver.traffic_observations (event_timestamp DESC, traffic_obs_id DESC);

CREATE INDEX IF NOT EXISTS idx_traffic_observations_avg_speed
ON silver.traffic_observations (avg_speed DESC, event_timestamp DESC, traffic_obs_id DESC)
WHERE avg_speed IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hourly_street_metrics_congestion
ON gold.hourly_street_metrics (congestion_score DESC, metric_date DESC, hour_of_day DESC, street_name ASC)
WHERE congestion_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_weather_traffic_impact_metric
ON gold.weather_traffic_impact (metric_date DESC, avg_congestion_score DESC, weather_label ASC)
WHERE avg_congestion_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_route_summary_congestion
ON gold.route_summary (avg_congestion_score DESC, route_id ASC);

CREATE INDEX IF NOT EXISTS idx_route_hourly_report_route_time
ON gold.route_hourly_report (route_id ASC, metric_date DESC, hour_of_day ASC);

CREATE INDEX IF NOT EXISTS idx_events_observations_timestamp
ON silver.events_observations (event_timestamp DESC, event_obs_id ASC);

CREATE INDEX IF NOT EXISTS idx_ride_history_started_at
ON silver.ride_history (started_at DESC, ride_id ASC);

CREATE INDEX IF NOT EXISTS idx_user_ride_history_user_started_at
ON silver.user_ride_history (cognito_user_sub ASC, started_at DESC, ride_id ASC);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user
ON silver.user_preferences (cognito_user_sub ASC);

CREATE INDEX IF NOT EXISTS idx_saved_routes_user_created_at
ON silver.saved_routes (cognito_user_sub ASC, created_at DESC, saved_route_id ASC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_routes_user_origin_destination
ON silver.saved_routes (cognito_user_sub ASC, origin_name ASC, destination_name ASC);

CREATE INDEX IF NOT EXISTS idx_top_congested_segments_rank
ON gold.top_congested_segments (segment_rank ASC);
