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