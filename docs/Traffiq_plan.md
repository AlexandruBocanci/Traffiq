# Traffiq Plan

## 1. Product Identity

- Product name: `Traffiq`
- Product type: traffic intelligence and routing analytics platform
- Primary positioning: end-to-end data engineering portfolio project with a product-oriented interface
- Core value proposition:
  - collect traffic and weather data
  - transform them into reliable analytics
  - expose route, congestion, and ride insights through an API and app interface

## 2. Final Product Vision

Traffiq is a traffic and mobility intelligence product that combines:

- route-level traffic visibility
- street and zone congestion analytics
- weather-aware traffic insights
- ride planning and ride history
- a map-first experience inspired by navigation products

The final product is not just a dashboard and not just an API. It is a full data-driven traffic application backed by a real ETL pipeline.

## 3. Primary User Goals

Users should be able to:

- open a live-style traffic map and understand current road conditions
- search a location, street, or route and inspect traffic conditions without starting a ride
- start a ride from point A to point B and receive a pre-ride report
- review previous rides and see summaries for them
- inspect route-level traffic patterns by hour
- understand how weather affects traffic on a route or area

## 4. Product Modules

The final product contains 5 major application areas:

1. Map
2. Ride
3. Reports
4. History
5. Account

## 5. UI / UX Structure

### 5.1. Tab: Map

Purpose:

- provide a map-first experience similar to modern navigation apps

Main UI elements:

- full-screen interactive map
- current location marker
- search bar
- bottom info panel or right-side details panel
- traffic layer overlay
- event markers

What the user sees:

- roads colored by congestion level
  - green = low congestion
  - yellow = medium congestion
  - red = high congestion
- traffic events on the map
  - accident
  - police
  - road work
  - hazard
  - closed road

User actions:

- search for a location or street
- zoom and pan
- tap a road segment to see traffic summary
- open route planning from selected point

Map details panel should display:

- street / segment name
- average speed
- congestion score
- traffic volume
- active events
- weather snapshot
- recommended alternative route if available

### 5.2. Tab: Ride

Purpose:

- help the user plan and start a ride from origin to destination

Main UI elements:

- origin input
- destination input
- route preview map
- route options panel
- primary CTA button: `Start Ride`

Pre-ride report must contain:

- recommended route
- estimated travel time
- estimated distance
- expected congestion level
- top congested streets along the route
- weather summary along the route
- event warnings on the route
- optional alternative route suggestion

Route options can include:

- fastest route
- lowest congestion route
- shortest distance route

During active ride, the UI may show:

- current route line
- next major turn
- remaining time
- remaining distance
- traffic warning cards

### 5.3. Tab: Reports

Purpose:

- let the user inspect traffic without starting a ride

Search modes:

- by locality
- by street
- by route from point X to point Y

Main UI elements:

- search bar
- route input form
- date selector
- hourly analysis chart
- street or segment summary cards
- route details panel

Report views:

- route congestion by hour
- average speed by hour
- traffic volume by hour
- peak hour detection
- weather impact summary
- congestion hotspots on the selected route

Use cases:

- "Show report for route A -> B"
- "Show traffic by hour for this route"
- "Show best travel time window"

### 5.4. Tab: History

Purpose:

- display previous rides and their summaries

Main UI elements:

- ride cards or ride table
- filter by date
- sort by latest / duration / distance

Each ride entry should contain:

- origin
- destination
- date and time
- duration
- distance
- average speed
- average congestion
- weather condition summary

Ride detail view should contain:

- route snapshot
- route metrics
- delays caused by congestion
- notable events encountered
- weather during ride

### 5.5. Tab: Account

Purpose:

- manage user profile and preferences

Main UI elements:

- profile info
- saved routes
- settings
- security section

Account features:

- sign up
- login
- forgot password
- email-based reset flow
- profile update
- preferences

Preferences can include:

- distance unit
- theme
- preferred route type
- notifications

## 6. Final Functional Scope

### 6.1. Traffic Features

- congestion map view
- route planning
- route recommendations
- hourly traffic reporting
- top congested streets
- event display
- weather-informed route context
- ride history

### 6.2. User Features

- account creation
- login/logout
- password reset by email
- profile settings
- saved rides or saved routes

### 6.3. Data Features

- CSV ingestion
- weather API ingestion
- route and street analytics
- historical trend reporting
- data quality validation
- pipeline run tracking

## 7. Technical Product Architecture

### 7.1. High-level Architecture

`Traffic CSV + Weather API + Route/Event Source -> ETL Pipeline -> PostgreSQL -> FastAPI -> App UI`

### 7.2. System Components

1. data sources
2. extract layer
3. bronze layer
4. silver layer
5. gold layer
6. serving API
7. app UI / frontend or mock app shell

## 8. Data Sources

### 8.1. Traffic source

Primary source for v1 and baseline analytics:

- historical traffic CSV dataset

Possible data fields:

- timestamp
- street_name
- segment_id
- avg_speed
- traffic_volume
- latitude
- longitude
- area / zone

### 8.2. Weather source

Recommended API:

- Open-Meteo

Useful fields:

- temperature
- precipitation
- wind speed
- weather code
- humidity if available

### 8.3. Events source

Final-product target:

- accident
- police
- roadwork
- closure
- hazard

Possible implementation paths:

- synthetic/mock event dataset in early phases
- real event API in later phases

### 8.4. Routing source

Final-product target:

- route generation from origin to destination
- estimated duration
- route geometry
- route segment metrics

Possible implementation paths:

- mock route logic in v1
- routing API integration in later phase

## 9. PostgreSQL Design

Recommended schemas:

- `bronze`
- `silver`
- `gold`
- `serving`
- `etl_meta`

### 9.1. Bronze tables

#### `bronze.traffic_raw`

- ingestion_id
- source_file
- ingested_at
- raw_timestamp
- raw_street_name
- raw_speed
- raw_vehicle_count
- raw_latitude
- raw_longitude
- raw_zone
- raw_payload

#### `bronze.weather_raw`

- ingestion_id
- requested_at
- location_key
- raw_timestamp
- temperature
- precipitation
- wind_speed
- weather_code
- raw_payload

#### `bronze.events_raw`

- ingestion_id
- event_timestamp
- raw_event_type
- raw_location_name
- raw_latitude
- raw_longitude
- raw_payload

### 9.2. Silver tables

#### `silver.traffic_observations`

- traffic_obs_id
- event_timestamp
- street_key
- street_name
- zone
- avg_speed
- traffic_volume
- latitude
- longitude
- source_system
- quality_status

#### `silver.weather_observations`

- weather_obs_id
- event_timestamp
- location_key
- temperature_c
- precipitation_mm
- wind_speed_kmh
- weather_code
- weather_label

#### `silver.events_observations`

- event_obs_id
- event_timestamp
- event_type
- street_name
- zone
- latitude
- longitude

#### `silver.route_reference`

- route_id
- origin_name
- destination_name
- route_name
- route_distance_km
- route_geometry_ref

#### `silver.traffic_weather_enriched`

- event_timestamp
- street_key
- street_name
- zone
- avg_speed
- traffic_volume
- weather_label
- precipitation_mm
- wind_speed_kmh
- temperature_c

### 9.3. Gold tables

#### `gold.hourly_street_metrics`

- metric_date
- hour_of_day
- street_key
- street_name
- zone
- avg_speed
- max_speed
- min_speed
- traffic_volume
- congestion_score

#### `gold.daily_street_summary`

- metric_date
- street_key
- street_name
- zone
- avg_daily_speed
- total_daily_volume
- peak_hour
- daily_congestion_score

#### `gold.route_hourly_report`

- route_id
- metric_date
- hour_of_day
- avg_speed
- traffic_volume
- congestion_score
- estimated_duration_minutes

#### `gold.route_summary`

- route_id
- origin_name
- destination_name
- best_hour_to_travel
- worst_hour_to_travel
- avg_duration_minutes
- avg_congestion_score

#### `gold.weather_traffic_impact`

- metric_date
- weather_label
- avg_speed
- traffic_volume
- avg_congestion_score

#### `gold.top_congested_segments`

- metric_date
- hour_of_day
- street_key
- street_name
- zone
- congestion_score
- rank_position

### 9.4. Serving tables or views

Serving objects can expose API-ready datasets:

- `serving.traffic_api_view`
- `serving.top_speed_view`
- `serving.route_report_view`
- `serving.hourly_route_view`

### 9.5. Metadata tables

#### `etl_meta.pipeline_runs`

- run_id
- pipeline_name
- started_at
- finished_at
- status
- records_extracted
- records_loaded
- error_message

#### `etl_meta.data_quality_checks`

- check_id
- run_id
- check_name
- check_status
- affected_records
- details

## 10. ETL Architecture

### 10.1. Extract jobs

- `extract_traffic_csv.py`
- `extract_weather_api.py`
- `extract_events_source.py`

### 10.2. Transform jobs

- `transform_traffic_to_silver.py`
- `transform_weather_to_silver.py`
- `transform_events_to_silver.py`
- `enrich_traffic_with_weather.py`

### 10.3. Gold jobs

- `build_hourly_street_metrics.py`
- `build_daily_street_summary.py`
- `build_route_reports.py`
- `build_weather_impact.py`
- `build_top_congested_segments.py`

### 10.4. Orchestration

- `run_pipeline.py`
- later: scheduler or orchestrator

## 11. Data Quality Rules

Traffic validation:

- speed must be numeric
- speed cannot be negative
- timestamp must be valid
- street name must be standardized
- duplicates must be removed

Weather validation:

- timestamp must be valid
- precipitation cannot be negative
- weather labels should be normalized

Events validation:

- known event type only
- valid location
- valid timestamp

## 12. Business Logic

### 12.1. Congestion Score

Initial formula for v1 and likely base for future versions:

`congestion_score = ((reference_speed - avg_speed) / reference_speed) * 100`

Rules:

- clamp minimum at 0
- clamp maximum at 100 if needed
- document the chosen reference speed

### 12.2. Ride Summary Metrics

Each ride summary should include:

- route distance
- estimated duration
- average speed
- average congestion
- top congested segment
- weather summary

### 12.3. Route Report Metrics

Each route report should be able to show:

- traffic by hour
- average route duration by hour
- average speed by hour
- top congestion window
- recommended travel window

## 13. Final API Design

### Core endpoints

- `GET /health`
- `GET /traffic`
- `GET /traffic/top-speed`
- `GET /streets/top-congested`
- `GET /routes/report`
- `GET /routes/hourly`
- `GET /weather-impact`
- `GET /rides/history`
- `GET /map/events`

### Account-related endpoints for final product

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /account/profile`
- `PUT /account/profile`

## 14. Repository Structure

```text
traffiq/
  README.md
  requirements.txt
  .env.example
  .gitignore

  data/
    raw/
    processed/
    exports/

  docs/
    product/
    architecture/
    api/

  sql/
    ddl/
    transformations/
    serving/

  src/
    config/
    extract/
    transform/
    load/
    pipeline/
    api/
    services/
    utils/

  tests/
    unit/
    integration/
```

## 15. Backend Code Structure

Suggested `src/api` structure:

```text
src/api/
  main.py
  db.py
  routes/
    health.py
    traffic.py
    routes.py
    reports.py
    rides.py
    account.py
```

## 16. Frontend / App Structure Vision

If later a web or mobile UI is built, recommended screen structure:

- `MapScreen`
- `RidePlannerScreen`
- `RouteReportScreen`
- `RideHistoryScreen`
- `AccountScreen`

## 17. Visual Direction

Style goals:

- modern map-first mobility product
- clean typography
- high information density but readable
- premium transport-tech feel
- dark or neutral map background with vivid traffic overlays

Suggested visual tokens:

- green for smooth traffic
- yellow for medium congestion
- red for severe congestion
- blue accents for route and weather context
- orange for warnings/events

## 18. Final Product Delivery Roadmap

### Phase A

- define product
- define data model
- define repo structure

### Phase B

- build Traffiq v1

### Phase C

- extend to Traffiq v2

### Phase D

- prepare cloud-ready version

## 19. Non-Goals For Initial Build

Do not build in the first implementation:

- full live navigation engine
- production-grade authentication stack
- real-time event ingestion at scale
- mobile native application
- enterprise-grade infra

## 20. Final Definition of Success

Traffiq is considered successful as a portfolio product if it demonstrates:

- serious product thinking
- clear end-to-end data pipeline design
- strong SQL + Python + pandas + PostgreSQL integration
- API-serving capability
- credible UI/UX concept
- a roadmap from v1 to a larger product
