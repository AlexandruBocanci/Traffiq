CREATE TABLE IF NOT EXISTS silver.traffic_observations (
  traffic_obs_id SERIAL PRIMARY KEY,
  event_timestamp TIMESTAMP,
  street_name VARCHAR(255),
  avg_speed NUMERIC(10,2),
  weather_label VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS silver.weather_observations (
  weather_obs_id SERIAL PRIMARY KEY,
  event_timestamp TIMESTAMP,
  temperature_c NUMERIC(5,2),
  precipitation_mm NUMERIC(5,2),
  wind_speed_kmh NUMERIC(5,2),
  weather_code INTEGER
);

CREATE TABLE IF NOT EXISTS silver.traffic_weather_enriched (
  event_timestamp TIMESTAMP,
  street_name VARCHAR(255),
  avg_speed NUMERIC(10,2),
  weather_label VARCHAR(100),
  temperature_c NUMERIC(5,2),
  precipitation_mm NUMERIC(5,2),
  wind_speed_kmh NUMERIC(5,2)
);

CREATE TABLE IF NOT EXISTS silver.route_reference (
  route_id INTEGER PRIMARY KEY,
  origin_name VARCHAR(255) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  route_distance_km NUMERIC(10, 2) NOT NULL,
  route_geometry_ref VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS silver.events_observations (
  event_obs_id SERIAL PRIMARY KEY,
  event_timestamp TIMESTAMP NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  street_name VARCHAR(255) NOT NULL,
  event_description TEXT,
  severity VARCHAR(50) NOT NULL,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6)
);

ALTER TABLE silver.events_observations
ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);

CREATE TABLE IF NOT EXISTS silver.ride_history (
  ride_id INTEGER PRIMARY KEY,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  origin_name VARCHAR(255) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  avg_speed NUMERIC(10, 2) NOT NULL,
  congestion_score NUMERIC(10, 2) NOT NULL,
  estimated_duration_minutes NUMERIC(10, 2) NOT NULL,
  ride_status VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS silver.user_ride_history (
  ride_id SERIAL PRIMARY KEY,
  cognito_user_sub VARCHAR(255) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  origin_name VARCHAR(255) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  avg_speed NUMERIC(10, 2) NOT NULL,
  congestion_score NUMERIC(10, 2) NOT NULL,
  estimated_duration_minutes NUMERIC(10, 2) NOT NULL,
  ride_status VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL DEFAULT 'mobile_route_preview',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS silver.user_preferences (
  preference_id SERIAL PRIMARY KEY,
  cognito_user_sub VARCHAR(255) NOT NULL UNIQUE,
  distance_unit VARCHAR(10) NOT NULL DEFAULT 'km',
  preferred_route_type VARCHAR(50) NOT NULL DEFAULT 'balanced',
  theme_mode VARCHAR(20) NOT NULL DEFAULT 'system',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_preferences_distance_unit
    CHECK (distance_unit IN ('km', 'mi')),
  CONSTRAINT chk_user_preferences_route_type
    CHECK (preferred_route_type IN ('fastest', 'balanced', 'less_congested')),
  CONSTRAINT chk_user_preferences_theme_mode
    CHECK (theme_mode IN ('system', 'dark', 'light'))
);

CREATE TABLE IF NOT EXISTS silver.saved_routes (
  saved_route_id SERIAL PRIMARY KEY,
  cognito_user_sub VARCHAR(255) NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  origin_name VARCHAR(255) NOT NULL,
  origin_latitude NUMERIC(9, 6) NOT NULL,
  origin_longitude NUMERIC(9, 6) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  destination_latitude NUMERIC(9, 6) NOT NULL,
  destination_longitude NUMERIC(9, 6) NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  duration_minutes NUMERIC(10, 2) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
