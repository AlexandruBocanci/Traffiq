# Recruiter And Demo Narrative

## Purpose

This document explains how to present Traffiq to a recruiter, interviewer, or technical reviewer.

The goal is not to oversell the project as a production navigation app. The goal is to explain it correctly as a serious data engineering portfolio project with a product-oriented mobile interface.

## 30-Second Pitch

```text
Traffiq is an end-to-end traffic intelligence data engineering project. It ingests traffic, weather, route, event, and ride data, processes them through Python ETL pipelines, stores them in PostgreSQL using Bronze, Silver, Gold, and Serving layers, exposes analytics through FastAPI, and displays the results in a React Native mobile app. The project also includes data quality checks, pipeline run metadata, Docker support, and a documented path toward AWS deployment.
```

## 2-Minute Technical Pitch

```text
I built Traffiq as a portfolio project focused on practical data engineering. The core of the project is the data pipeline, not just the UI.

The pipeline extracts traffic data from CSV and weather data from an API, then cleans and standardizes the data with pandas. Raw or near-raw data is stored in Bronze tables, cleaned records go into Silver, and analytical outputs are built in Gold. I also added a Serving layer so the API can read frontend-ready views instead of querying raw analytical tables directly.

On top of the database, I built a FastAPI backend with endpoints for traffic, weather impact, route reports, route hourly analytics, events, ride history, and a mobile drive overview response. The mobile app consumes the backend through a shared API layer and presents the data as a traffic intelligence product.

For operational realism, I added pipeline run tracking and data quality logging in etl_meta tables. I also Dockerized the backend and PostgreSQL setup, documented environment separation, and defined a realistic AWS deployment path using ECR, App Runner, RDS, EventBridge, and ECS Fargate.
```

## What To Show First In A Demo

Start with the product, then move to the technical depth.

Recommended order:

1. Show the mobile Drive screen.
2. Show that the data comes from FastAPI, not hardcoded mobile UI.
3. Show one API response, especially `/mobile/drive-overview`.
4. Show the PostgreSQL schemas: Bronze, Silver, Gold, Serving, and ETL metadata.
5. Show `src/pipeline/seed_demo_data.py` or `src/pipeline/run_pipeline.py`.
6. Show `docs/ARCHITECTURE_WALKTHROUGH.md`.
7. Show Docker running the backend stack if needed.

## Demo Commands

Start backend through Docker:

```powershell
cd C:\Users\alexa\Desktop\Traffiq
docker compose up --build -d
```

Validate API:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/mobile/drive-overview
```

Start mobile:

```powershell
cd C:\Users\alexa\Desktop\Traffiq\mobile
npx.cmd expo start
```

Optional database check:

```powershell
psql -U postgres -d traffiq -c "SELECT run_id, pipeline_name, status, records_extracted, records_loaded FROM etl_meta.pipeline_runs ORDER BY run_id DESC LIMIT 5;"
```

If using Docker PostgreSQL from the host:

```powershell
psql -h localhost -p 5433 -U postgres -d traffiq -c "SELECT run_id, pipeline_name, status, records_extracted, records_loaded FROM etl_meta.pipeline_runs ORDER BY run_id DESC LIMIT 5;"
```

## What To Say About The Mobile App

Use this explanation:

```text
The mobile app is not the core engineering challenge. It exists to prove that the backend serves usable product data. The important part is that the mobile screen is powered by the FastAPI layer, which reads PostgreSQL analytics produced by the ETL pipeline.
```

If asked why the UI looks like a traffic product:

```text
I wanted the project to be more than a backend-only demo, so I built a product-like interface around the data. The UI helps make the pipeline outputs easier to understand, but the core portfolio value is still the ETL, SQL model, API, and deployment readiness.
```

## What To Say About CSV And Mock Data

Use this answer:

```text
For v2, I intentionally use controlled CSV sources for traffic, route reference, events, and ride history because reliable real-time traffic APIs are often paid or restricted. The architecture is designed so those extract modules can later be replaced with real APIs without rewriting the database model, pipeline layers, API, or mobile app.
```

Important distinction:

```text
The data source is currently simplified.
The architecture is not simplified.
```

That is the correct positioning.

## What To Say About Weather Data

Use this answer:

```text
Weather data comes from an API, then it is transformed and stored in PostgreSQL like the other pipeline data. The project also creates a traffic-weather enrichment layer and a Gold weather impact output so the API can expose how traffic speed changes under different weather conditions.
```

## What To Say About Bronze, Silver, Gold, And Serving

Use this answer:

```text
I use Bronze for raw ingested data, Silver for cleaned and standardized records, Gold for business-level analytical outputs, and Serving views for API-ready datasets. This separation keeps ingestion, cleaning, analytics, and frontend consumption from being mixed together.
```

This is one of the strongest data engineering points in the project.

## What To Say About Pipeline Observability

Use this answer:

```text
Each pipeline run writes metadata into etl_meta.pipeline_runs, including status, extracted records, loaded records, and errors. Data quality checks are written into etl_meta.data_quality_checks. This makes the pipeline observable, which is important because real data systems need to show when jobs ran, whether they succeeded, and what quality checks were applied.
```

## What To Say About Docker

Use this answer:

```text
Docker gives the project a reproducible backend runtime. Instead of requiring every machine to manually configure PostgreSQL and backend dependencies, Docker Compose starts PostgreSQL and FastAPI together, initializes the schema, and seeds demo data for the mobile app.
```

Also mention the production distinction:

```text
The automatic demo seeding is useful locally, but in production the API startup and ETL jobs should be separated.
```

## What To Say About AWS

Use this answer:

```text
The project is not deployed to AWS yet, but the deployment path is documented. The intended model is ECR for the Docker image, App Runner for the FastAPI service, RDS PostgreSQL for the database, and EventBridge Scheduler triggering an ECS Fargate task for recurring ETL runs.
```

This is enough for a Junior Data Engineer portfolio stage because it shows deployable architecture thinking without pretending the system is already production-grade.

## Strong Points To Emphasize

- end-to-end pipeline from source data to mobile UI
- PostgreSQL schemas separated into Bronze, Silver, Gold, Serving, and ETL metadata
- Python and pandas transformations
- FastAPI serving layer backed by database queries
- mobile client consuming real backend data
- pipeline run tracking and data quality logging
- Dockerized backend stack
- environment-based config and secrets strategy
- documented AWS deployment path

## Limitations To State Honestly

- traffic data is not real-time yet
- route and event data are controlled demo datasets
- the mobile app is not a full navigation engine
- AWS deployment is documented but not executed yet
- authentication and user accounts are future scope

These are acceptable limitations if explained correctly.

## Best Interview Framing

Do not say:

```text
I built a Waze clone.
```

Say:

```text
I built a data engineering project that powers a traffic intelligence mobile interface.
```

That is more accurate and stronger.

## Final Demo Story

Use this structure:

```text
First, I show the mobile app so the project feels like a real product.
Then I show the API response powering the screen.
Then I show the PostgreSQL layers that produce the analytics.
Then I show the Python pipeline that loads those layers.
Then I show the metadata tables for observability.
Finally, I show Docker and the AWS deployment plan to explain how the project can move beyond local development.
```

## Final One-Sentence Summary

```text
Traffiq is a data engineering portfolio project that turns traffic, weather, route, event, and ride data into PostgreSQL analytics, serves them through FastAPI, and presents them in a mobile traffic intelligence app, with Docker and AWS deployment readiness documented.
```
