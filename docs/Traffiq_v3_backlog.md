# Traffiq v3 Backlog

## Purpose

This document defines the recommended Traffiq v3 backlog.

v3 should not randomly add features. It should focus on making the project more realistic as a data product, while keeping the scope manageable for a portfolio project.

## Recommended v3 Direction

The strongest v3 direction is:

```text
move from controlled demo data toward more realistic data ingestion, real deployment, and stronger product behavior
```

## Priority 1 - Real Data Source Improvements

### 1. Replace Or Extend Traffic CSV With API-Based Ingestion

Goal:

- reduce dependency on local static CSV data
- add a real or semi-real external data source

Possible sources:

- open city traffic datasets
- public transport or road event feeds
- OpenStreetMap-derived data
- free-tier routing or traffic-adjacent APIs

Expected output:

- new extract module
- Bronze raw table if needed
- Silver normalized table
- updated pipeline runner
- integration test
- docs update

### 2. Replace Mock Events With A Real Event Feed If Available

Goal:

- make map alerts more realistic

Expected output:

- `extract_events_api.py`
- source-specific Bronze payload
- normalized Silver event records
- existing `/map/events` endpoint preserved

## Priority 2 - Real Routing And Map Improvements

### 3. Add Real Route Geometry

Goal:

- move beyond route reference strings toward real route lines

Possible options:

- OSRM
- OpenRouteService
- GraphHopper
- local OpenStreetMap-based routing later

Expected output:

- route geometry stored in database
- mobile map can draw more realistic route lines
- route analytics can be linked to actual route segments later

### 4. Improve Mobile Map Experience

Goal:

- make the app feel closer to a real traffic product

Expected output:

- real map component
- route line rendering
- event markers
- traffic alert overlays
- selected route bottom sheet

## Priority 3 - Cloud Execution

### 5. Deploy Backend To AWS

Recommended first deployment:

```text
ECR -> App Runner -> RDS PostgreSQL
```

Expected output:

- public FastAPI URL
- RDS PostgreSQL database
- environment variables configured in AWS
- mobile app can call public backend URL

### 6. Implement Scheduled ETL

Recommended architecture:

```text
EventBridge Scheduler -> ECS Fargate task -> RDS PostgreSQL
```

Expected output:

- scheduled pipeline runs
- metadata written to `etl_meta.pipeline_runs`
- failed runs logged with error messages
- clear scheduler documentation

## Priority 4 - Better Operational Maturity

### 7. Add Pipeline Status Endpoint

Goal:

- expose recent pipeline runs through the API

Expected endpoint:

```text
GET /pipeline/status
```

Expected output:

- latest pipeline run status
- extracted records
- loaded records
- error message if failed
- recent data quality checks

### 8. Add Structured Logging

Goal:

- replace loose print statements with more production-style logs

Expected output:

- Python logging setup
- consistent log levels
- cleaner Docker logs
- easier debugging

### 9. Add CI Checks

Goal:

- validate code before merge

Expected output:

- GitHub Actions workflow
- backend tests
- TypeScript check
- lint or formatting check if introduced

## Priority 5 - Product Maturity

### 10. Add User Preferences Or Account Basics

Goal:

- prepare the product for user-specific behavior

Possible features:

- saved routes
- preferred route type
- distance unit
- theme preference

Do not start with full authentication unless it becomes necessary.

### 11. Add Offline Demo Cache

Goal:

- allow the mobile app to show the last successful backend response during demos

Expected output:

- cache latest `/mobile/drive-overview` response
- show cached data if backend is unavailable
- label cached data clearly

## Priority 6 - Data Model Improvements

### 12. Move From Full Refresh To Incremental Loads

Goal:

- stop truncating all analytical tables on each run
- make the pipeline closer to real production behavior

Expected output:

- ingestion timestamp tracking
- deduplication keys
- upsert logic where appropriate
- historical runs preserved

### 13. Improve Traffic-Weather Join Logic

Goal:

- improve beyond the v1/v2 simplified hour-level weather join

Possible improvements:

- nearest timestamp join
- location-aware join
- weather station/location key
- better weather code mapping

## Recommended v3 Order

Best order:

1. Add pipeline status endpoint.
2. Add offline demo cache.
3. Add real map component and route rendering.
4. Add real route geometry source.
5. Add API-based traffic or events ingestion.
6. Deploy backend to AWS.
7. Implement scheduled ETL.
8. Move toward incremental loads.

Reason:

```text
This order improves demo reliability first, then product realism, then cloud execution, then deeper data engineering maturity.
```

## What Not To Do First In v3

Avoid starting v3 with:

- full authentication
- complex account system
- paid traffic APIs
- real-time streaming
- overcomplicated AWS infrastructure
- rebuilding the UI from scratch

Those can come later, but they are not the highest-value next steps for a Junior Data Engineer portfolio.

## v3 Success Criteria

v3 is successful if:

- at least one more data source becomes real or API-based
- the mobile app becomes more demo-resilient
- the map experience becomes more realistic
- the backend can be reached through a deployed public URL
- scheduled pipeline execution is implemented or partially implemented
- pipeline status is visible through an endpoint or app screen

## v3 Positioning

Use this positioning:

```text
Traffiq v3 moves the project from a local cloud-ready portfolio system toward a more realistic deployed traffic intelligence platform.
```
