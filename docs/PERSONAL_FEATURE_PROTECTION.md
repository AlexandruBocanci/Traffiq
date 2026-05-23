# Personal Feature Protection

## Purpose

This document records Task 13 from Traffiq v3.

The goal is to protect personal features only, while keeping public Suceava traffic features available to guest users.

## Access Rule

Traffiq v3 uses this rule:

```text
Public traffic intelligence works without login.
Personal user data requires login.
```

## What Was Protected

Protected backend endpoint:

```text
GET /rides/history
```

Guest behavior:

```text
GET /rides/history without token -> 401
```

Authenticated behavior:

```text
GET /rides/history with valid Cognito access token -> 200
```

## What Stayed Public

These public endpoints still work without login:

- `GET /health`
- `GET /mobile/drive-overview`
- `GET /routes/report`
- `GET /routes/hourly`
- `GET /map/events`
- `GET /weather-impact`
- `GET /streets/top-congested`
- `GET /reports/overview`

The public mobile drive overview no longer exposes ride history:

```json
{
  "rides": []
}
```

This prevents global demo ride data from being shown as if it were personal data.

The public reports overview also excludes ride history and ride totals:

```text
GET /reports/overview -> no recent_rides field and no ride_count field
```

This correction was validated during the cloud ETL load task, when populated RDS data made the earlier public exposure visible.

## Mobile Changes

Added mobile screen:

```text
History
```

Guest History behavior:

- shows login prompt
- offers sign in
- allows continue as guest

Authenticated History behavior:

- calls `GET /rides/history`
- attaches the Cognito access token in the `Authorization` header
- shows personal ride history response

Protected request shape:

```text
Authorization: Bearer <cognito_access_token>
```

## Backend Changes

`src/api/routes/rides.py` now uses:

```python
Depends(require_current_user)
```

That dependency comes from:

```text
src/api/auth.py
```

The dependency validates the Cognito access token before the endpoint returns ride history.

## What Is Not Done Yet

This task does not:

- create user-specific ride history database tables
- filter ride history by Cognito user ID
- add saved routes endpoints
- add preferences endpoints
- implement account settings persistence

Those belong to later product feature tasks.

Current limitation:

```text
/rides/history is protected by Cognito, but the underlying ride history dataset is still the existing demo dataset.
```

That is acceptable for this task because the goal is endpoint protection, not full per-user data modeling.

## Local Validation

Validated locally:

```text
npx.cmd tsc --noEmit -> passed
compileall src/api -> passed
/health without token -> 200
/auth/me without token -> 401
/auth/me invalid token -> 401
/rides/history without token -> 401
/rides/history with dependency override in test -> 200
/rides/history with real Cognito access token -> 200
/mobile/drive-overview without token -> 200
/mobile/drive-overview rides -> []
```

## Cloud Validation

The backend image was rebuilt and pushed to ECR:

```text
896080425393.dkr.ecr.eu-central-1.amazonaws.com/traffiq-api:latest
```

Current image digest:

```text
sha256:e81b6e530deae41bd866ade7e1f5ab4c95ce94d753be51dbefb94a01b8f04f76
```

App Runner was redeployed and returned to:

```text
RUNNING
```

Validated on public App Runner:

```text
GET /mobile/drive-overview without token -> 200
GET /mobile/drive-overview rides -> []
GET /reports/overview -> no recent_rides and no ride_count
GET /rides/history without token -> 401
GET /rides/history with real Cognito access token -> 200
Cognito users after temporary test cleanup -> 0
```

The public reports correction was deployed during Task 20 after populated RDS data exposed the previous contract violation.

## Product Explanation

Traffiq now follows the intended v3 access model.

Users can open the app and use public city traffic features without an account. Login is required only when the app accesses personal data. This is closer to a real mobility product because public traffic context is available immediately, while user-specific data is protected by authentication.
