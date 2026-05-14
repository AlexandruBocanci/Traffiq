# Demo Flow

## Purpose

This document defines the exact demo flow for presenting Traffiq.

Use it when you want to show the project quickly without forgetting the important technical parts.

## Demo Goal

The demo should prove this:

```text
Traffiq is not just a UI and not just scripts.
It is an end-to-end data engineering system that moves data from sources to PostgreSQL analytics, through FastAPI, into a mobile app.
```

## Before The Demo

Use Docker for the cleanest demo.

From the repository root:

```powershell
cd C:\Users\alexa\Desktop\Traffiq
docker compose up --build -d
```

Wait until the API container finishes seeding demo data.

Validate backend health:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Validate mobile-shaped API data:

```powershell
Invoke-RestMethod http://localhost:8000/mobile/drive-overview
```

Start the mobile app:

```powershell
cd C:\Users\alexa\Desktop\Traffiq\mobile
npx.cmd expo start
```

Open Expo Go and scan the QR code.

## Demo Order

### 1. Show The Mobile Drive Screen

Start with the mobile app because it makes the project easy to understand.

Say:

```text
This is the product-facing layer. The screen is not hardcoded; it consumes backend data from FastAPI.
```

Show:

- route/traffic overview
- weather context
- traffic alerts
- recent ride panel
- pipeline/settings entry

### 2. Show The API Response

Open:

```text
http://localhost:8000/mobile/drive-overview
```

Say:

```text
This endpoint shapes the backend response specifically for the mobile app, so the client does not need to combine many separate API calls.
```

This demonstrates backend-for-frontend thinking.

### 3. Show The Database Layers

Show PostgreSQL schemas:

```text
bronze
silver
gold
serving
etl_meta
```

Say:

```text
The database is separated into warehouse-style layers. Bronze keeps raw ingested data, Silver stores cleaned records, Gold stores analytical outputs, Serving gives the API frontend-ready views, and etl_meta tracks pipeline runs and quality checks.
```

Useful SQL checks:

```powershell
psql -h localhost -p 5433 -U postgres -d traffiq -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('bronze', 'silver', 'gold', 'serving', 'etl_meta') ORDER BY table_schema, table_name;"
```

```powershell
psql -h localhost -p 5433 -U postgres -d traffiq -c "SELECT run_id, pipeline_name, status, records_extracted, records_loaded FROM etl_meta.pipeline_runs ORDER BY run_id DESC LIMIT 5;"
```

### 4. Show The Pipeline Entrypoints

Show:

- `src/pipeline/run_pipeline.py`
- `src/pipeline/seed_demo_data.py`

Say:

```text
The core pipeline processes traffic and weather data, logs metadata, and writes analytical outputs. The demo seed pipeline runs the core pipeline and then loads route, event, ride, and mobile demo data.
```

### 5. Show The API Structure

Show:

- `src/api/main.py`
- `src/api/routes/`

Say:

```text
The API is split into route modules instead of keeping all endpoints in one file. It serves analytics from PostgreSQL and exposes mobile-ready data.
```

### 6. Show The Architecture Document

Open:

- `docs/ARCHITECTURE_WALKTHROUGH.md`

Say:

```text
This document explains the full system architecture, including ETL, PostgreSQL layers, FastAPI, mobile app, Docker, and AWS direction.
```

### 7. Show The Deployment Direction

Open:

- `docs/CLOUD_WORKFLOW.md`
- `docs/SCHEDULER_STRATEGY.md`
- `docs/SECRETS_AND_CONFIG.md`

Say:

```text
The project runs locally through Docker today, and the documented AWS path is ECR, App Runner, RDS PostgreSQL, EventBridge Scheduler, and ECS Fargate for recurring ETL jobs.
```

## Short Demo Version

If you only have 2 minutes:

1. Show mobile Drive screen.
2. Show `/mobile/drive-overview`.
3. Show PostgreSQL schemas.
4. Show `run_pipeline.py`.
5. Show `ARCHITECTURE_WALKTHROUGH.md`.

## Longer Demo Version

If you have 5-10 minutes:

1. Show mobile Drive screen.
2. Show API response.
3. Show database layers.
4. Show pipeline files.
5. Show metadata tables.
6. Show API route modules.
7. Show Docker Compose.
8. Show AWS deployment docs.
9. Explain limitations honestly.

## What Not To Do

Do not start by showing random code files.

Do not describe it as a Waze clone.

Do not hide the fact that some data is controlled demo data.

Do not spend too much time on UI details unless the reviewer asks.

## Best Closing Line

```text
The main value of Traffiq is that it connects the full data engineering flow: ingestion, transformation, layered PostgreSQL modeling, analytical serving, API delivery, mobile consumption, observability, Docker runtime, and cloud deployment direction.
```
