CREATE TABLE IF NOT EXISTS gold.hourly_street_metrics (
  metric_date DATE,
  hour_of_day INTEGER,
  street_name VARCHAR(255),
  avg_speed NUMERIC(10, 2),
  congestion_score NUMERIC(5, 2)
);

CREATE TABLE IF NOT EXISTS gold.weather_traffic_impact (
  metric_date DATE,
  weather_label VARCHAR(100),
  avg_speed NUMERIC(10, 2),
  avg_congestion_score NUMERIC(5, 2)
);

CREATE TABLE IF NOT EXISTS gold.route_summary (
  route_id INTEGER,
  route_name VARCHAR(255),
  origin_name VARCHAR(255),
  destination_name VARCHAR(255),
  route_distance_km NUMERIC(10, 2),
  observation_count INTEGER,
  avg_speed NUMERIC(10, 2),
  min_speed NUMERIC(10, 2),
  max_speed NUMERIC(10, 2),
  avg_congestion_score NUMERIC(5, 2),
  estimated_duration_minutes NUMERIC(10, 2),
  congestion_level VARCHAR(50)
);

ALTER TABLE gold.route_summary
ADD COLUMN IF NOT EXISTS observation_count INTEGER,
ADD COLUMN IF NOT EXISTS min_speed NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS max_speed NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS congestion_level VARCHAR(50);

CREATE TABLE IF NOT EXISTS gold.route_hourly_report (
  route_id INTEGER,
  route_name VARCHAR(255),
  metric_date DATE,
  hour_of_day INTEGER,
  avg_speed NUMERIC(10, 2),
  avg_congestion_score NUMERIC(5, 2),
  estimated_duration_minutes NUMERIC(10, 2)
);

CREATE TABLE IF NOT EXISTS gold.top_congested_segments (
  segment_rank INTEGER,
  street_name VARCHAR(255),
  observation_count INTEGER,
  avg_speed NUMERIC(10, 2),
  avg_congestion_score NUMERIC(5, 2)
);

CREATE TABLE IF NOT EXISTS gold.current_corridor_traffic (
  corridor_key VARCHAR(100) PRIMARY KEY,
  corridor_name VARCHAR(255) NOT NULL,
  observed_at TIMESTAMP NOT NULL,
  current_speed_kmh NUMERIC(10, 2) NOT NULL,
  free_flow_speed_kmh NUMERIC(10, 2) NOT NULL,
  congestion_score NUMERIC(5, 2) NOT NULL,
  confidence NUMERIC(5, 4),
  road_closure BOOLEAN NOT NULL DEFAULT FALSE,
  source_provider VARCHAR(50) NOT NULL DEFAULT 'tomtom'
);

CREATE TABLE IF NOT EXISTS gold.corridor_hourly_traffic_profile (
  profile_id SERIAL PRIMARY KEY,
  weekday_index INTEGER NOT NULL CHECK (weekday_index BETWEEN 0 AND 6),
  weekday_label VARCHAR(20) NOT NULL,
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  baseline_congestion_score NUMERIC(5, 2) NOT NULL CHECK (
    baseline_congestion_score BETWEEN 0 AND 100
  ),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (weekday_index, hour_of_day)
);
