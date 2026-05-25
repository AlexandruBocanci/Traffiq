# Pipeline Status Endpoint

## Purpose

This document records Task 26 from Traffiq v3.

The goal is to expose ETL operational status through the FastAPI backend.

## Endpoint

```text
GET /pipeline/status
```

The endpoint is read-only.

It does not run the pipeline, reset tables, seed data, or modify RDS.

## Data Source

The endpoint reads from the existing ETL metadata tables:

```text
etl_meta.pipeline_runs
etl_meta.data_quality_checks
```

These tables are written by the Python ETL pipeline when it runs.

## Response Shape

Example response:

```json
{
  "latest_run": {
    "run_id": 4,
    "pipeline_name": "events_pipeline",
    "started_at": "2026-05-23T20:55:43",
    "finished_at": "2026-05-23T20:55:46",
    "status": "success",
    "records_extracted": 5,
    "records_loaded": 10,
    "error_message": null
  },
  "data_quality_checks": [
    {
      "check_id": 17,
      "run_id": 4,
      "check_name": "events_suceava_coordinates_valid",
      "check_status": "passed",
      "affected_records": 0,
      "details": "Events must have allowed type/severity and coordinates inside Suceava bounds."
    }
  ]
}
```

If no pipeline run exists, the endpoint returns:

```json
{
  "latest_run": null,
  "data_quality_checks": []
}
```

## Access Model

The endpoint is public for the current portfolio/demo version.

Reason:

- it contains operational metadata, not personal user data
- it does not expose database passwords, AWS credentials, or host configuration
- it supports the Data Engineering demo story

If this became a real production application, this endpoint should be restricted to admin/demo users.

## Backend Implementation

Added route module:

```text
src/api/routes/pipeline.py
```

Registered in:

```text
src/api/main.py
```

The latest run query uses:

```sql
ORDER BY started_at DESC, run_id DESC
LIMIT 1
```

The data quality query filters by the selected `run_id`.

## Validation

Local validation:

```text
python -m compileall src/api -> passed
python tests/integration/test_pipeline_status_endpoint.py with PYTHONPATH=. -> passed
GET /pipeline/status through TestClient on RDS data -> 200
```

Cloud validation:

```text
App Runner status -> RUNNING
GET /health -> status=ok
GET /pipeline/status -> run_id=4, pipeline_name=events_pipeline, status=success, records_extracted=5, records_loaded=10, checks=1
ECR latest digest -> sha256:d3ae9c92395cfeb4dab1e57494a6558f8df8002fda85ab98aa00295610071865
```

## What This Enables

Task 27 can now build an Admin / Pipeline mobile screen using one backend call.

From a Data Engineering perspective, this demonstrates:

- pipeline observability
- metadata-driven monitoring
- data quality visibility
- API serving over ETL metadata
- separation between pipeline execution and API reading

## What Is Not Done Yet

This task does not:

- schedule the pipeline
- trigger ETL from the API
- create AWS EventBridge or ECS jobs
- add a mobile Admin / Pipeline screen
- add admin authorization

Those belong to later work.
