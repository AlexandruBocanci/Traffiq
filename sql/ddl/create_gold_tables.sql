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
  avg_speed NUMERIC(10, 2),
  avg_congestion_score NUMERIC(5, 2),
  estimated_duration_minutes NUMERIC(10, 2)
);
