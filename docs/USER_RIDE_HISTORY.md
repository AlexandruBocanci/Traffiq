# User Ride History

## Purpose

This document records Task 24 from Traffiq v3.

The goal is to make ride history personal, not just protected.

## Product Rule

Ride history is personal data.

```text
Guest users see a login prompt.
Authenticated users see only their own ride history.
```

## Why This Task Was Needed

Before Task 24, `GET /rides/history` required login, but it still read from the shared demo table:

```text
silver.ride_history
```

That was authentication without true user-level data ownership.

Task 24 adds user-level ownership through:

```text
cognito_user_sub
```

## Database Model

The existing demo table remains:

```text
silver.ride_history
```

It is kept for controlled seed/demo data and ETL continuity.

The new personal table is:

```text
silver.user_ride_history
```

Main columns:

- `ride_id`
- `cognito_user_sub`
- `started_at`
- `ended_at`
- `origin_name`
- `destination_name`
- `route_name`
- `distance_km`
- `avg_speed`
- `congestion_score`
- `estimated_duration_minutes`
- `ride_status`
- `source`
- `created_at`

Serving view:

```text
serving.vw_user_ride_history
```

Index:

```text
idx_user_ride_history_user_started_at
```

## Backend API

Protected endpoints:

```text
GET /rides/history
POST /rides/history
```

Both endpoints use:

```python
Depends(require_current_user)
```

`GET /rides/history` filters by:

```sql
WHERE cognito_user_sub = %s
```

`POST /rides/history` creates a ride for the authenticated user.

## Mobile Behavior

History screen:

- guest users see the existing login prompt
- authenticated users call `GET /rides/history`
- only personal rides are displayed

Drive screen:

- route preview remains public
- authenticated users can add the current route preview to personal ride history
- guest users are sent to Account if they try to add a ride

## RDS Deployment

The idempotent schema entry point was applied to RDS:

```text
sql/ddl/create_all.sql
```

No pipeline reset or seed reload was run.

## Validation

Technical validation:

```text
python -m compileall src/api -> passed
python tests/integration/test_rides_history_endpoint.py with PYTHONPATH=. -> passed
python tests/integration/test_saved_routes_endpoint.py with PYTHONPATH=. -> passed
npx.cmd tsc --noEmit -> passed
```

Cloud validation:

```text
RDS DDL application -> passed
GET /health -> status=ok
GET /rides/history without token -> 401
GET /rides/history with real Cognito access token before insert -> count=0
POST /rides/history with real Cognito access token -> created=True
GET /rides/history with real Cognito access token after insert -> count=1
temporary ride history cleanup rows remaining -> 0
temporary Cognito user cleanup -> attempted
GET /mobile/drive-overview -> rides=0
silver.user_ride_history rows after cleanup -> 0
App Runner status -> RUNNING
ECR latest digest -> sha256:33b830a5ba20e3f8582875d30a06ecb9982c5c69b652471cf90e711f62528fd7
```

## What This Enables

Traffiq now has two persisted personal feature categories:

- saved routes
- user ride history

From a Data Engineering and backend perspective, this demonstrates:

- user-owned fact records
- Cognito identity as a stable owner key
- protected write and read endpoints
- SQL-level tenant isolation
- mobile-to-cloud personal data flow

## What Is Not Done Yet

This task does not:

- infer real completed trips from GPS tracking
- build turn-by-turn navigation
- add saved destinations separately
- add user preferences

Those belong to later product tasks or future work.
