# Scheduler Strategy

## Purpose

This document defines how Traffiq pipeline runs should be scheduled in local, Docker, and future AWS environments.

The goal is to move the project from manual ETL execution toward a realistic recurring data pipeline model.

## Why Scheduling Matters

Traffiq is a data engineering project. In a real system, the ETL pipeline should not depend on a developer manually running:

```powershell
python -m src.pipeline.run_pipeline
```

Instead, the pipeline should run on a schedule, write data into PostgreSQL, and record operational metadata.

The project already supports this because each pipeline run writes to:

```text
etl_meta.pipeline_runs
etl_meta.data_quality_checks
```

That means future scheduled runs can be monitored through database history.

## Current Pipeline Entrypoints

### Core traffic-weather pipeline

```powershell
python -m src.pipeline.run_pipeline
```

This runs the main ETL flow:

```text
traffic extract -> traffic transform -> Bronze/Silver/Gold
weather extract -> weather transform -> Bronze/Silver
traffic-weather enrichment -> Gold weather impact
pipeline run metadata
data quality checks
```

### Demo/mobile seed pipeline

```powershell
python -m src.pipeline.seed_demo_data
```

This runs the traffic-weather pipeline and then loads the extra demo data needed by the mobile app:

```text
route reference
route summary
route hourly report
top congested segments
events
ride history
```

This is useful for local demos, but it should not be treated as the production scheduler target.

## Recommended Scheduling Targets

## 1. Local Classic Scheduling

Use this for development only.

Recommended Windows option:

```text
Windows Task Scheduler
```

Suggested command:

```powershell
powershell.exe -ExecutionPolicy Bypass -Command "cd C:\Users\<USER>\Desktop\Traffiq; .\.venv\Scripts\python.exe -m src.pipeline.run_pipeline"
```

Recommended frequency for development:

```text
manual
hourly
daily
```

Do not use very frequent schedules locally unless needed, because the current weather API call is external and the local dataset is small.

## 2. Local Docker Scheduling

Use this for local demos or reproducible backend validation.

If Docker services are already running:

```powershell
docker compose exec api python -m src.pipeline.run_pipeline
```

For refreshing demo/mobile data:

```powershell
docker compose exec api python -m src.pipeline.seed_demo_data
```

Recommended usage:

```text
manual before demo
manual after resetting Docker volume
not as a constantly running local scheduler
```

The current Docker API startup already runs `seed_demo_data()` automatically before FastAPI starts, so manual Docker scheduling is not required for normal local demo use.

## 3. AWS Scheduling

This is the recommended deployable direction.

Target pattern:

```text
Amazon EventBridge Scheduler
        |
        v
ECS Fargate one-off task
        |
        v
python -m src.pipeline.run_pipeline
        |
        v
Amazon RDS PostgreSQL
```

This is the most realistic architecture for Traffiq because:

- the pipeline runs as a job, not inside the API request path
- the API can stay focused on serving data
- the database is managed by RDS
- every scheduled run can be tracked in `etl_meta.pipeline_runs`
- data quality checks stay queryable in `etl_meta.data_quality_checks`

## Recommended AWS Schedule

For the current portfolio stage:

```text
daily
```

For a more realistic traffic product later:

```text
every 15 minutes
every 30 minutes
hourly
```

Do not claim real-time ingestion until the project has real streaming or frequent external traffic API ingestion.

## Scheduler Responsibilities

The scheduler should only trigger the pipeline.

It should not:

- serve API requests
- run the mobile app
- reset production data blindly
- depend on Expo
- depend on a developer terminal

The scheduled job should:

- start a pipeline run
- extract data
- transform data
- load Bronze/Silver/Gold layers
- log metadata
- log data quality checks
- exit cleanly with success or failure

## Failure Handling

If a scheduled run fails, the project should record that failure in:

```text
etl_meta.pipeline_runs
```

The current pipeline already has run metadata logic, but future improvements should make failed external API calls more explicit.

Useful fields:

```text
pipeline_name
started_at
finished_at
status
records_extracted
records_loaded
error_message
```

The goal is to answer:

```text
When did the pipeline run?
Did it succeed?
How many records did it process?
If it failed, why?
```

## Production Rule

In production, API startup and pipeline scheduling should be separated.

Correct production model:

```text
FastAPI container starts and serves API
Scheduled ETL container runs separately
Both connect to the same RDS database
```

Current local Docker behavior:

```text
API container seeds demo data before startup
```

That local behavior is acceptable for demos, but it should not become the long-term cloud production behavior.

## Future Implementation Backlog

Recommended future tasks:

- create a separate Docker command/profile for pipeline jobs
- create an ECS task definition for the ETL job
- configure EventBridge Scheduler
- add stronger failure handling around external API calls
- add a pipeline status endpoint based on `etl_meta.pipeline_runs`
- add dashboard/admin view for recent pipeline runs

## Recruiter Explanation

The concise explanation is:

```text
Traffiq is designed so the ETL pipeline can run on a schedule rather than manually. Locally it can be triggered through Python or Docker, while the intended AWS model is EventBridge Scheduler triggering an ECS Fargate task that writes to RDS PostgreSQL and records run metadata in etl_meta tables.
```

This shows that the project is built around operational data pipeline thinking, not just one-off scripts.
