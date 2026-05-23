# AWS RDS ETL Pipeline Execution

## Purpose

This document records Task 20 of Traffiq v3: running the ETL and controlled demo data load against Amazon RDS PostgreSQL.

The cloud execution target is:

```text
local Python execution -> ETL pipeline -> Amazon RDS PostgreSQL -> App Runner FastAPI reads Serving views
```

The pipeline does not call App Runner to write data. It connects directly to PostgreSQL through the shared database configuration in `src/config/settings.py`.

## Why The Existing Pipeline Can Use RDS

All load modules use:

```text
src/utils/db_utils.py -> src/config/settings.py -> DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
```

The Python ETL logic is therefore the same for:

- local PostgreSQL
- Docker PostgreSQL
- Amazon RDS PostgreSQL

Only the environment configuration changes.

## Cloud Target Configuration

Local `.env` remains Git-ignored and contains the RDS connection values:

```text
DB_HOST=traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com
DB_NAME=traffiq
DB_USER=traffiq_admin
DB_PASSWORD=<local-secret-rds-password>
DB_PORT=5432
```

The password must never be printed, pasted into documentation, or committed.

## Controlled Demo Load Safety

`src/pipeline/run_pipeline.py` resets traffic/weather analytical tables, and `src/pipeline/seed_demo_data.py` additionally resets the demo route/event/ride tables before inserting the mobile dataset.

This reset is useful for a reproducible portfolio demo, but it is destructive. For that reason:

- local PostgreSQL and Docker can still use the normal pipeline and seed commands
- an Amazon RDS target is detected from the RDS hostname
- any destructive RDS pipeline execution is blocked unless it includes explicit confirmation

Blocked cloud commands:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -m src.pipeline.run_pipeline
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -m src.pipeline.seed_demo_data
```

Intentional RDS commands:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -m src.pipeline.run_pipeline --confirm-cloud-reset
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -m src.pipeline.seed_demo_data --confirm-cloud-reset
```

This is not a production incremental-load pattern. It is a controlled cloud demo loading mechanism for v3.

## What The Command Loads

The full seed command runs:

1. traffic and Open-Meteo weather extraction
2. Bronze raw ingestion
3. Silver cleaning and enrichment
4. Gold hourly street metrics and weather impact
5. ETL metadata and data quality logging
6. Suceava route reference loading
7. Gold route summary and hourly route reporting
8. Suceava event loading
9. Suceava ride demo loading
10. top congested street reporting

The Serving views already created in RDS expose those results to FastAPI.

## API Relationship

The App Runner backend does not run the ETL job during startup.

App Runner starts FastAPI with:

```text
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

This separation is deliberate:

```text
pipeline writes RDS
API reads RDS
mobile app calls API
```

A backend container restart must not reset the analytical cloud data.

## Validation

Validate the selected database target without displaying the password:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -c "from src.config.settings import DB_CONFIG; print(DB_CONFIG['host'], DB_CONFIG['dbname'], DB_CONFIG['user'], DB_CONFIG['port'])"
```

Validate database connectivity:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -c "from src.utils.db_utils import get_db_connection; conn=get_db_connection(); print('RDS connection test passed.' if conn is not None else 'RDS connection test failed.'); conn.close() if conn is not None else None"
```

After the load, validate public API data:

```powershell
Invoke-RestMethod -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/mobile/drive-overview'
```

Expected result:

- routes contain Suceava corridors
- events contain Suceava street names
- congestion and weather arrays are populated
- `rides` remains empty on the public endpoint because it is personal data

## Validated Cloud Execution

Validated on `May 23, 2026`:

```text
RDS connection test -> passed
RDS pipeline/seed without --confirm-cloud-reset -> blocked as intended
RDS seed with --confirm-cloud-reset -> success
pipeline final run_id -> 2
pipeline status -> success
records extracted -> 196
records loaded -> 609
route summary rows -> 6
route hourly rows -> 22
top congested segment rows -> 9
events silver rows -> 5
rides silver rows -> 6
```

RDS validation returned Suceava routes including:

```text
Calea Unirii to Bulevardul George Enescu
Strada Universitatii to Strada Stefan cel Mare
Calea Burdujeni to Strada Traian Vuia
```

Public App Runner validation returned:

```text
GET /health -> 200, status=ok
GET /mobile/drive-overview -> routes=5, events=5, congested=5, weather=2, rides=0
GET /reports/overview -> no recent_rides field, no ride_count field
GET /rides/history without authentication -> 401
POST /routes/preview with Calea Unirii to Strada Marasesti -> 200
```

During this validation, the public reports endpoint was corrected so it no longer exposes personal ride data. The corrected FastAPI image was pushed to ECR and deployed through App Runner.

Final deployed image digest:

```text
sha256:e81b6e530deae41bd866ade7e1f5ab4c95ce94d753be51dbefb94a01b8f04f76
```

## Task 21 Weather Refresh Validation

Task 21 retained Open-Meteo as the free real-weather source and centralized
the Suceava request configuration:

```text
latitude=47.6514
longitude=26.2556
timezone=Europe/Bucharest
```

Only the traffic-weather pipeline was refreshed in RDS, using the controlled
cloud-reset confirmation. Routes, events, and ride history were not reset.

Validated on `May 23, 2026`:

```text
latest pipeline run_id -> 3
latest pipeline status -> success
records_extracted -> 196
records_loaded -> 609
bronze.weather_raw rows -> 168
silver.weather_observations rows -> 168
gold.weather_traffic_impact rows -> 2
GET /weather-impact -> count=2
GET /mobile/drive-overview -> weather=2, routes=5, events=5, rides=0
```

Detailed weather ingestion documentation:

- `docs/OPEN_METEO_WEATHER_INGESTION.md`

## Current Limitation

The cloud pipeline is currently executed manually from the developer machine.

The later production-style direction remains:

```text
EventBridge Scheduler -> ECS Fargate ETL task -> Amazon RDS PostgreSQL
```

That scheduling infrastructure is intentionally outside the current low-cost task scope.
