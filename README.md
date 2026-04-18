# Traffiq

Traffiq is a backend-focused traffic intelligence portfolio project built to demonstrate a realistic Junior Data Engineer skill set.

It combines:

- ETL pipelines
- PostgreSQL Bronze / Silver / Gold layers
- FastAPI serving
- a React Native mobile client connected to the backend

The project is intentionally designed as a serious portfolio piece rather than a toy CRUD app.

## What v1 Delivers

Traffiq v1 proves the following:

- traffic CSV ingestion
- weather API ingestion
- layered data modeling in PostgreSQL
- transformation and enrichment logic
- analytics-ready Gold tables
- FastAPI endpoints backed by PostgreSQL
- a mobile app that consumes the live local backend

## v1 Product Areas

The mobile app currently includes:

1. Reports
2. Weather Impact
3. Map Preview
4. Pipeline

These screens are intentionally simplified for v1, but they are connected to the real backend and designed to reinforce the project story.

## Architecture

```text
Traffic CSV + Weather API
        |
        v
Extract / Transform
        |
        v
PostgreSQL Bronze
        |
        v
PostgreSQL Silver
        |
        v
PostgreSQL Gold
        |
        v
FastAPI
        |
        v
React Native Mobile App
```

## Core Data Layers

Schemas:

- `bronze`
- `silver`
- `gold`
- `etl_meta`

Key tables:

- `bronze.traffic_raw`
- `bronze.weather_raw`
- `silver.traffic_observations`
- `silver.weather_observations`
- `silver.traffic_weather_enriched`
- `gold.hourly_street_metrics`
- `gold.weather_traffic_impact`

## API Endpoints

Current v1 endpoints:

- `GET /health`
- `GET /traffic`
- `GET /traffic/top-speed`
- `GET /streets/top-congested`
- `GET /weather-impact`

## Tech Stack

- Python
- pandas
- PostgreSQL
- psycopg
- FastAPI
- uvicorn
- requests
- React Native
- Expo
- TypeScript

## Local Run Flow

### 1. Bootstrap dependencies

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_local.ps1
```

### 2. Start the API

From the repository root:

```powershell
uvicorn src.api.main:app --reload --host 0.0.0.0
```

### 3. Start the mobile app

```powershell
cd mobile
npm.cmd start
```

Then:

- open Expo Go on your Android phone
- scan the QR code
- keep the phone and the PC on the same Wi-Fi network

## Why This Project Is Strong For A Data Engineering Portfolio

Traffiq is not positioned as a frontend-first app. The core value is in:

- ingestion
- transformation
- SQL modeling
- layered warehouse thinking
- API serving of analytics-ready data

That makes it relevant for Junior Data Engineer roles where recruiters want to see:

- real SQL usage
- practical ETL thinking
- backend data delivery
- project structure and discipline

## Important v1 Notes

- weather enrichment in v1 uses a simplified join approach by `hour_of_day`
- this was an intentional v1 tradeoff because the traffic CSV history and live weather API data are not from the same real-world time window
- this simplification is accepted in v1 and documented explicitly

## Documentation

Project documentation lives in:

- `docs/Traffiq_plan.md`
- `docs/Traffiq_v1.md`
- `docs/Traffiq_v2.md`
- `docs/LOCAL_SETUP.md`
- `docs/chat.md`

## Current Status

Traffiq v1 is functionally complete in local development:

- pipeline validated locally
- PostgreSQL validated locally
- FastAPI validated locally
- mobile app validated locally

The next phase is Traffiq v2.
