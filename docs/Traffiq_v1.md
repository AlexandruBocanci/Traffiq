# Traffiq v1

## 1. Goal

Traffiq v1 is the first buildable and realistic version of the project.

Its purpose is to prove:

- end-to-end ETL capability
- clean PostgreSQL layered design
- traffic and weather integration
- FastAPI serving layer
- mobile app connectivity to the backend
- a product-oriented analytics experience

## 2. v1 Scope

Included in v1:

- traffic CSV ingestion
- weather API ingestion
- Bronze -> Silver -> Gold pipeline
- PostgreSQL local database
- FastAPI backend
- mobile app connected to the backend
- route and street reports in simplified form
- simplified map preview
- pipeline visibility in simplified form
- product documentation

Not included in v1:

- real-time live map like Waze
- full login system
- forgot password flow
- real event ingestion from police / accidents provider
- true routing engine
- advanced production-grade mobile UX
- cloud deployment in first implementation

## 3. v1 Product Experience

v1 is centered on analytics and route reporting rather than full navigation.

### v1 mobile app areas

1. `Reports`
2. `Weather Impact`
3. `Map Preview`
4. `Pipeline`

### v1 area details

#### Reports

- inspect traffic data by street or route
- inspect hourly traffic summary
- inspect congestion profile

#### Weather Impact

- inspect traffic behavior by weather condition
- inspect average speed impact by weather label

#### Map Preview

- simplified traffic map or route summary card
- congestion highlights
- analytical preview only, not real navigation

#### Pipeline

- show pipeline stages in simplified form
- show last successful run in demo form
- show extracted and loaded data visibility for portfolio demo

## 4. v1 Data Sources

- traffic CSV dataset
- Open-Meteo weather API
- optional mock route definitions if needed for analytical preview only

## 5. v1 Database Scope

Schemas:

- `bronze`
- `silver`
- `gold`
- `etl_meta`

Core tables for v1:

- `bronze.traffic_raw`
- `bronze.weather_raw`
- `silver.traffic_observations`
- `silver.weather_observations`
- `silver.traffic_weather_enriched`
- `gold.hourly_street_metrics`
- `gold.weather_traffic_impact`

## 6. v1 API Scope

Minimum endpoints:

- `GET /health`
- `GET /traffic`
- `GET /traffic/top-speed`
- `GET /streets/top-congested`
- `GET /weather-impact`

## 7. v1 Technical Stack

- Python
- pandas
- PostgreSQL
- psycopg
- FastAPI
- uvicorn
- requests
- React Native
- python-dotenv later, when config is moved out of hardcoded settings

## 8. v1 Repository Direction

```text
traffiq/
  data/
  docs/
  sql/
  src/
  tests/
```

## 9. v1 Success Criteria

v1 is successful if:

- traffic and weather data flow through the local pipeline
- Bronze, Silver, and Gold layers are populated correctly
- FastAPI serves real data from PostgreSQL
- the mobile app consumes backend endpoints successfully
- the project is strong enough to present to recruiters as a serious backend-focused portfolio project

## 10. v1 Commit Plan

### Foundation

- [x] Create core project documentation and repository structure
- [x] Create PostgreSQL DDL for Bronze, Silver, and Gold layers
- [x] Create Python database configuration and connection utilities

### Traffic Pipeline

- [x] Create traffic CSV extract module and validation test
- [x] Create traffic transform module and validation test
- [x] Create Bronze traffic load module and validation test
- [x] Create Silver traffic load module and validation test
- [x] Create Gold hourly street metrics module and validation
- [x] Create congestion score logic for Gold traffic metrics

### Weather Pipeline

- [x] Create weather API extract module and validation test
- [x] Create Bronze weather load module and validation test
- [x] Create Silver weather load module and validation test
- [x] Create traffic-weather enrichment module for Silver layer and validation
- [x] Create Gold weather impact module and validation

### Backend API

- [x] Create FastAPI application foundation and local run flow
- [x] Create health endpoint
- [x] Create traffic endpoint backed by PostgreSQL
- [x] Create top-speed traffic endpoint backed by PostgreSQL
- [x] Create top-congested streets endpoint backed by PostgreSQL
- [x] Create weather-impact endpoint backed by PostgreSQL

### Mobile App

- [x] Initialize React Native mobile app for Traffiq v1
- [x] Create base app navigation structure
- [x] Create shared app layout and visual theme
- [x] Configure app-to-backend API connection layer
- [x] Create Reports screen connected to traffic endpoints
- [x] Create Weather Impact screen connected to weather endpoint
- [x] Create Map Preview screen with analytical traffic summary
- [x] Create Pipeline Status screen for demo visibility

### Integration and Polish

- [x] Connect backend endpoints cleanly to mobile app screens
- [x] Add loading, empty-state, and error-state handling in app
- [x] Validate end-to-end local flow: pipeline -> PostgreSQL -> FastAPI -> mobile app
- [x] Finalize v1 documentation and recruiter-ready project presentation

## 11. Current v1 Status

Traffiq v1 is complete for the intended local portfolio scope.

Delivered v1 outcome:

- ETL pipeline running locally
- PostgreSQL Bronze / Silver / Gold layers populated
- FastAPI endpoints serving project data
- React Native mobile app consuming live local backend data
- local end-to-end flow validated

Remaining work belongs to:

- v2 scope
- cloud / deployment scope
- more advanced product features outside the first portfolio build
