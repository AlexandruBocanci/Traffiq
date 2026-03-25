# Traffiq v1

## 1. Goal

Traffiq v1 is the first buildable and realistic version of the final product.

Its purpose is to prove:

- end-to-end ETL capability
- clean PostgreSQL design
- traffic + weather integration
- FastAPI serving layer
- a product-oriented analytics experience

## 2. v1 Scope

Included in v1:

- traffic CSV ingestion
- weather API ingestion
- Bronze -> Silver -> Gold pipeline
- PostgreSQL local database
- FastAPI backend
- route and street reports in simplified form
- simplified history data model
- product documentation

Not included in v1:

- real-time live map like Waze
- full login system
- forgot password flow
- real event ingestion from police / accidents provider
- true routing engine
- mobile app
- cloud deployment in first implementation

## 3. v1 Product Experience

v1 is centered on analytics and route reporting rather than full navigation.

### v1 tabs

1. `Reports`
2. `History`
3. `Map Preview`
4. `Pipeline`

### v1 tab details

#### Reports

- search a route or street
- inspect hourly traffic report
- inspect congestion profile
- inspect weather impact summary

#### History

- view previous analyzed rides or route checks
- show origin, destination, distance, duration, average speed

#### Map Preview

- simplified traffic map or route summary card
- route line and congestion highlights
- no full Waze-like experience yet

#### Pipeline

- show pipeline steps
- last run
- extracted and loaded records
- basic data quality results

## 4. v1 Data Sources

- traffic CSV dataset
- Open-Meteo weather API
- optional mock route definitions
- optional mock event dataset if needed for UX demo only

## 5. v1 Database Scope

Schemas:

- `bronze`
- `silver`
- `gold`
- `etl_meta`

Minimum tables:

- `bronze.traffic_raw`
- `bronze.weather_raw`
- `silver.traffic_observations`
- `silver.weather_observations`
- `silver.traffic_weather_enriched`
- `gold.hourly_street_metrics`
- `gold.route_hourly_report`
- `gold.weather_traffic_impact`
- `etl_meta.pipeline_runs`

## 6. v1 API Scope

Minimum endpoints:

- `GET /health`
- `GET /traffic`
- `GET /traffic/top-speed`
- `GET /streets/top-congested`
- `GET /routes/report`
- `GET /routes/hourly`
- `GET /weather-impact`

## 7. v1 Technical Stack

- Python
- pandas
- PostgreSQL
- psycopg
- FastAPI
- uvicorn
- requests
- python-dotenv

## 8. v1 Repository Direction

```text
traffiq/
  README.md
  requirements.txt
  .env.example
  data/
  docs/
  sql/
  src/
  tests/
```

## 9. v1 Success Criteria

v1 is successful if:

- pipeline runs end-to-end locally
- weather data is integrated into traffic analytics
- Gold tables answer useful traffic questions
- FastAPI serves real data from PostgreSQL
- project is strong enough to present to recruiters
