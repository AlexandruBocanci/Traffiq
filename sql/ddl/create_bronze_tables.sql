CREATE TABLE IF NOT EXISTS bronze.traffic_raw (
    ingestion_id SERIAL PRIMARY KEY,
    source_file VARCHAR(255),
    ingested_at TIMESTAMP,
    raw_timestamp VARCHAR(100),
    raw_street_name VARCHAR(255),
    raw_speed VARCHAR(50),
    raw_weather VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS bronze.weather_raw (
    ingestion_id SERIAL PRIMARY KEY,
    requested_at TIMESTAMP,
    raw_timestamp VARCHAR(100),
    temperature NUMERIC(5,2),
    precipitation NUMERIC(5,2),
    wind_speed NUMERIC(5,2),
    weather_code INTEGER
);

CREATE TABLE IF NOT EXISTS bronze.events_raw (
    ingestion_id SERIAL PRIMARY KEY,
    source_file VARCHAR(255),
    ingested_at TIMESTAMP,
    raw_event_timestamp VARCHAR(100),
    raw_event_type VARCHAR(100),
    raw_street_name VARCHAR(255),
    raw_description TEXT,
    raw_severity VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS bronze.rides_raw (
    ingestion_id SERIAL PRIMARY KEY,
    source_file VARCHAR(255),
    ingested_at TIMESTAMP,
    raw_ride_id VARCHAR(50),
    raw_started_at VARCHAR(100),
    raw_ended_at VARCHAR(100),
    raw_origin_name VARCHAR(255),
    raw_destination_name VARCHAR(255),
    raw_route_name VARCHAR(255),
    raw_distance_km VARCHAR(50),
    raw_avg_speed VARCHAR(50),
    raw_congestion_score VARCHAR(50),
    raw_status VARCHAR(50)
);
