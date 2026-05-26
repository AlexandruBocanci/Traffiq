# Backend Validation Results

## Purpose

This document records the final backend validation for Traffiq v4.

Validation date:

```text
2026-05-26
```

Scope:

- local backend route validation through FastAPI `TestClient`
- public AWS App Runner endpoint validation
- authentication protection checks without exposing tokens
- routing validation
- reports and pipeline status validation

No passwords, AWS credentials, Cognito tokens, or database secrets were used or written in this document.

## 1. Cloud Backend Validation

Base URL:

```text
https://eguwdq6puz.eu-central-1.awsapprunner.com
```

### Health

Endpoint:

```text
GET /health
```

Result:

```text
status: ok
```

Status:

```text
passed
```

### Mobile Overview

Endpoint:

```text
GET /mobile/drive-overview
```

Result:

```text
routes: 5
events: 5
rides: 0
congested: 5
weather: 2
first_route: Strada Marasesti to Strada Universitatii
first_event_has_coordinates: true
```

Status:

```text
passed
```

Important:

```text
rides: 0
```

This is correct for the public overview because personal ride history must not be exposed to guest users.

### Reports Overview

Endpoint:

```text
GET /reports/overview
```

Result:

```text
route_count: 6
event_count: 5
route_highlights: 3
top_congested_segments: 5
recent_events: 5
has_recent_rides: false
has_ride_count: false
```

Status:

```text
passed
```

This confirms that public reports do not expose personal ride history fields.

### Pipeline Status

Endpoint:

```text
GET /pipeline/status
```

Result:

```text
latest_run_id: 4
pipeline_name: events_pipeline
status: success
records_extracted: 5
records_loaded: 10
data_quality_checks: 1
```

Status:

```text
passed
```

### Route Preview

Endpoint:

```text
POST /routes/preview
```

Request:

```json
{
  "origin_name": "City Center",
  "destination_name": "Iulius Mall Suceava"
}
```

Result:

```text
provider: local_suceava_fallback
distance_km: 1.85
duration_minutes: 3.5
geometry_type: LineString
coordinate_count: 2
```

Status:

```text
passed
```

The cloud fallback provider is expected because App Runner uses a VPC Connector for RDS and the project avoids NAT Gateway for cost control.

## 2. Cloud Personal Endpoint Protection

Validated without Cognito token:

```text
GET /auth/me -> 401
GET /rides/history -> 401
GET /saved-routes -> 401
GET /preferences -> 401
```

Status:

```text
passed
```

This confirms that personal endpoints reject guest access.

Authenticated endpoint validation with a real Cognito token was not run in this task because tokens must not be pasted, printed, or stored in documentation. Authenticated mobile flow is covered in the mobile validation task.

## 3. Local Backend Validation

### Python Compilation

Command:

```powershell
.\.venv\Scripts\python.exe -m compileall src\api tests\unit\test_routing_service.py tests\integration\test_auth_endpoint.py tests\integration\test_pipeline_status_endpoint.py tests\integration\test_mobile_drive_overview_endpoint.py tests\integration\test_reports_overview_endpoint.py tests\integration\test_rides_history_endpoint.py tests\integration\test_saved_routes_endpoint.py tests\integration\test_preferences_endpoint.py
```

Result:

```text
passed
```

### Routing Unit Test

Command:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe tests\unit\test_routing_service.py
```

Result:

```text
passed
```

### Local FastAPI TestClient Validation

Validation used FastAPI `TestClient` against the configured database without running seed/reset commands.

Result:

```text
GET /health -> 200, status ok
GET /mobile/drive-overview -> 200, routes=5, events=5, rides=0, congested=5, weather=2
GET /reports/overview -> 200, route_count=6, no recent_rides, no ride_count
GET /pipeline/status -> 200, run_id=4, pipeline_name=events_pipeline, status=success, checks=1
POST /routes/preview -> 200, provider=OSRM, distance_km=2.03, duration_minutes=4.3, geometry=LineString, coordinates=119
GET /auth/me without token -> 401
GET /rides/history without token -> 401
GET /saved-routes without token -> 401
GET /preferences without token -> 401
```

Status:

```text
passed
```

The local route preview used OSRM successfully. The cloud route preview used the local Suceava fallback. This difference is expected and documented in the routing integration notes.

## 4. Integration Tests

Executed tests:

```text
test_auth_endpoint.py -> passed
test_pipeline_status_endpoint.py -> passed
test_rides_history_endpoint.py -> passed
test_saved_routes_endpoint.py -> passed
test_preferences_endpoint.py -> passed
```

Safety result:

```text
test_mobile_drive_overview_endpoint.py -> blocked by RDS reset guard
test_reports_overview_endpoint.py -> blocked by RDS reset guard
```

Reason:

These two tests attempt to run demo seeding/reset logic. The current environment points to Amazon RDS, so the safety guard correctly blocked destructive pipeline reset without `--confirm-cloud-reset`.

No `--confirm-cloud-reset` command was run during this validation task.

## 5. Test Data Cleanup

After personal feature tests, a targeted cleanup was run for test Cognito subjects only.

Result:

```text
ride_rows_deleted: 0
saved_route_rows_deleted: 0
preference_rows_deleted: 0
```

This confirms that the test cleanup had already removed temporary personal rows.

## 6. Final Backend Validation Status

Overall status:

```text
passed with expected safety blocks
```

Critical flows validated:

- health endpoint
- mobile overview
- reports overview
- route preview
- pipeline status
- guest/public access
- personal endpoint protection without token
- local backend route handling
- cloud backend route handling

Expected limitations:

- authenticated cloud validation with a real Cognito token was not run in this task to avoid handling secrets/tokens in the validation log
- two seed-dependent integration tests were intentionally not forced because the environment points to RDS and reset protection worked correctly

