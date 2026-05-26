# Traffiq

Traffiq is an end-to-end traffic intelligence data engineering portfolio project.

It ingests traffic, weather, route, event, and ride data, processes them through Python ETL pipelines, stores them in PostgreSQL analytical layers, exposes the results through FastAPI, and presents them in a React Native / Expo mobile app.

The project is built to demonstrate practical Junior Data Engineer skills, not to pretend to be a production Waze clone.
The final demo dataset is localized to Suceava streets, corridors, route examples, traffic events, weather impact, and personal route flows.

## What The Project Demonstrates

- Python ETL pipeline structure
- pandas-based data cleaning and transformation
- PostgreSQL Bronze / Silver / Gold / Serving layers
- ETL metadata and data quality logging
- FastAPI backend serving database-backed analytics
- React Native mobile client consuming backend data
- Dockerized local backend runtime
- environment-based configuration and secrets handling
- AWS deployment with App Runner, ECR, RDS PostgreSQL, and Cognito

## Current v4 Scope

Traffiq v4 is the final portfolio/licence version currently being polished.

Traffiq v4 includes:

- traffic CSV ingestion
- weather API ingestion through Open-Meteo
- route reference ingestion
- traffic event ingestion
- traffic-weather enrichment
- route-level analytics
- hourly route reporting
- top congested segment analytics
- serving-layer views optimized for API usage
- backend-shaped mobile response through `/mobile/drive-overview`
- public FastAPI deployment on AWS App Runner
- Amazon RDS PostgreSQL database with the Suceava dataset loaded
- Amazon Cognito authentication for personal mobile features
- protected personal ride history, saved routes, and preferences
- real Suceava route previews with route geometry and fallback routing
- React Native / Expo mobile app using the public cloud API by default
- Docker support for local PostgreSQL and FastAPI demos

## Architecture

```text
Traffic CSV + Weather API + Route/Event/Ride CSVs
        |
        v
Python Extract / Transform / Load
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
PostgreSQL Serving Views
        |
        v
FastAPI
        |
        v
React Native / Expo Mobile App
```

Cloud runtime:

```text
React Native / Expo Mobile App
        |
        v
AWS App Runner FastAPI Service
        |
        v
Amazon RDS PostgreSQL
```

Authentication:

```text
Mobile App -> Amazon Cognito -> Cognito JWT -> FastAPI protected personal endpoints
```

Detailed architecture is documented in:

- `docs/ARCHITECTURE_WALKTHROUGH.md`

## Database Layers

Schemas:

- `bronze`
- `silver`
- `gold`
- `serving`
- `etl_meta`

Main purpose:

- Bronze keeps raw or near-raw ingested data.
- Silver keeps cleaned and standardized records.
- Gold keeps business-level analytical outputs.
- Serving exposes API-ready views.
- ETL metadata tracks pipeline runs and data quality checks.

## API Endpoints

Current backend endpoints:

- `GET /health`
- `GET /traffic`
- `GET /traffic/top-speed`
- `GET /streets/top-congested`
- `GET /weather-impact`
- `GET /routes/report`
- `GET /routes/hourly`
- `POST /routes/preview`
- `GET /map/events`
- `GET /rides/history`
- `POST /rides/history`
- `GET /saved-routes`
- `POST /saved-routes`
- `DELETE /saved-routes/{saved_route_id}`
- `GET /preferences`
- `PUT /preferences`
- `GET /auth/me`
- `GET /pipeline/status`
- `GET /reports/overview`
- `GET /mobile/drive-overview`

Personal endpoints require Cognito authentication. Public analytical endpoints remain available for guest users.

## Mobile App

The current mobile app is a product-style demo focused on a traffic intelligence experience.

Current screens:

- Drive
- History
- Account
- Pipeline

The Drive screen is powered by the backend-shaped `/mobile/drive-overview` response.
It uses a real Suceava-centered mobile map component with optional current-location support.
It includes a route input flow for choosing a Suceava origin and destination.
Route previews calculate distance, duration, and geometry through the routing integration.
Calculated routes are rendered on the map with a polyline and destination marker.
Route previews also include a Suceava condition summary that combines ETA, weather context, congestion score, and active city alerts.
Controlled Suceava traffic alerts now include coordinates and render as severity-coded map markers.
Authenticated users can save route previews and view their personal saved routes from Account.
Authenticated users can start a drive from a route preview, which saves the trip to personal ride history.
Authenticated users can manage personal preferences from Account.
The Pipeline screen now shows backend/API health, the latest ETL run, record counts, and data quality checks for demo observability.

## Tech Stack

- Python
- pandas
- PostgreSQL
- psycopg
- FastAPI
- uvicorn
- requests
- python-dotenv
- Docker
- React Native
- Expo
- TypeScript
- react-native-maps
- expo-location

## Quick Start With Docker

From the repository root:

```powershell
docker compose up --build
```

Validate the backend:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/mobile/drive-overview
```

Start the mobile app:

```powershell
cd mobile
npx.cmd expo start
```

Then open Expo Go on the phone and scan the QR code.

By default, the mobile app calls the public AWS App Runner API. For local backend testing, override `EXPO_PUBLIC_TRAFFIQ_API_BASE_URL` before starting Expo.

## Local Classic Setup

For local development without Docker:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_local.ps1
Copy-Item .env.example .env
psql -U postgres -d traffiq -f sql/ddl/create_all.sql
uvicorn src.api.main:app --reload --host 0.0.0.0
```

Full setup instructions are documented in:

- `docs/LOCAL_SETUP.md`

## Demo Flow

The recommended demo flow is documented in:

- `docs/DEMO_FLOW.md`

The recruiter-facing explanation is documented in:

- `docs/DEMO_NARRATIVE.md`

## Documentation Index

Start here:

- `docs/ARCHITECTURE_WALKTHROUGH.md`
- `docs/DEMO_FLOW.md`
- `docs/DEMO_NARRATIVE.md`
- `docs/LOCAL_SETUP.md`

Project planning:

- `docs/Traffiq_plan.md`
- `docs/Traffiq_v1.md`
- `docs/Traffiq_v2.md`
- `docs/Traffiq_v2_recap.md`
- `docs/Traffiq_v3_backlog.md`

Deployment and operations:

- `docs/AWS_DEPLOYMENT.md`
- `docs/AWS_COST_GUARDRAILS.md`
- `docs/AWS_RDS_POSTGRESQL.md`
- `docs/AWS_RDS_SCHEMA.md`
- `docs/AWS_ECR_BACKEND_IMAGE.md`
- `docs/AWS_APP_RUNNER_BACKEND.md`
- `docs/MOBILE_CLOUD_API_CONFIG.md`
- `docs/AWS_COGNITO_USER_POOL.md`
- `docs/MOBILE_COGNITO_AUTH.md`
- `docs/BACKEND_COGNITO_JWT_VALIDATION.md`
- `docs/PERSONAL_FEATURE_PROTECTION.md`
- `docs/MOBILE_REAL_MAP.md`
- `docs/MOBILE_ROUTE_INPUT_FLOW.md`
- `docs/ROUTING_API_INTEGRATION.md`
- `docs/MOBILE_ROUTE_POLYLINE.md`
- `docs/MOBILE_ROUTE_CONDITION_SUMMARY.md`
- `docs/SUCEAVA_SEED_DATASET.md`
- `docs/AWS_RDS_ETL_PIPELINE.md`
- `docs/OPEN_METEO_WEATHER_INGESTION.md`
- `docs/SUCEAVA_EVENT_ALERTS.md`
- `docs/SAVED_ROUTES.md`
- `docs/USER_RIDE_HISTORY.md`
- `docs/CLOUD_WORKFLOW.md`
- `docs/ENVIRONMENTS.md`
- `docs/SCHEDULER_STRATEGY.md`
- `docs/SECRETS_AND_CONFIG.md`

Continuity:

- `docs/chat.md`
- `docs/chat_v1_archive.md`

## Portfolio Positioning

Correct positioning:

```text
Traffiq is a data engineering project that powers a traffic intelligence mobile interface.
```

Do not position it as:

```text
A production real-time navigation app.
```

Current limitations are intentional and documented:

- traffic data is not real-time yet
- route and event sources are controlled demo datasets
- the app is not a full navigation engine
- AWS deployment is partial and intentionally low-cost

The strength of the project is the end-to-end data system: ingestion, transformation, SQL modeling, API serving, mobile consumption, observability, Docker, and cloud readiness.
