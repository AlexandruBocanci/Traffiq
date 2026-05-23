# Saved Routes

## Purpose

This document records Task 23 from Traffiq v3.

The goal is to let authenticated users save route previews and view their own saved routes.

## Product Rule

Saved routes are personal data.

```text
Guest users can preview routes.
Only authenticated users can save and view saved routes.
```

## Database Model

Saved routes are stored in:

```text
silver.saved_routes
```

Serving view:

```text
serving.vw_saved_routes
```

Indexes:

```text
idx_saved_routes_user_created_at
idx_saved_routes_user_origin_destination
```

The unique index on user, origin, and destination prevents duplicate saved routes for the same user and updates the existing row when the same route is saved again.

## Backend API

Protected endpoints:

```text
GET /saved-routes
POST /saved-routes
DELETE /saved-routes/{saved_route_id}
```

All endpoints validate the Cognito access token through:

```python
Depends(require_current_user)
```

The backend extracts the Cognito `sub` and stores it as:

```text
cognito_user_sub
```

This is the stable user identifier used for SQL filtering.

## Security Behavior

Guest behavior:

```text
GET /saved-routes without token -> 401
POST /saved-routes without token -> 401
```

Authenticated behavior:

```text
POST /saved-routes with valid Cognito access token -> 200
GET /saved-routes with valid Cognito access token -> only that user's routes
DELETE /saved-routes/{id} with valid Cognito access token -> deletes only that user's route
```

Cross-user access is blocked by SQL filtering:

```sql
WHERE cognito_user_sub = %s
```

## Mobile Behavior

Drive screen:

- users can still preview routes as guests
- route preview card now includes a save action
- guest users are sent to Account when they try to save
- authenticated users save the current route preview through `POST /saved-routes`

Account screen:

- authenticated users see a saved routes list
- guests see the existing login/register flow

## RDS Deployment

The idempotent schema entry point was applied to RDS:

```text
sql/ddl/create_all.sql
```

No pipeline reset or data seed was run for this task.

## Validation

Technical validation:

```text
python -m compileall src/api -> passed
python tests/integration/test_saved_routes_endpoint.py with PYTHONPATH=. -> passed
python tests/integration/test_auth_endpoint.py with PYTHONPATH=. -> passed
npx.cmd tsc --noEmit -> passed
```

Cloud validation:

```text
RDS DDL application -> passed
GET /health -> status=ok
GET /saved-routes without token -> 401
POST /saved-routes with real Cognito access token -> saved=True
GET /saved-routes with real Cognito access token -> count=1
DELETE /saved-routes/{id} with real Cognito access token -> deleted=True
GET /saved-routes after delete -> count=0
temporary Cognito user cleanup -> attempted
silver.saved_routes cloud validation leftovers -> 0
App Runner status -> RUNNING
ECR latest digest -> sha256:1ce14840d4d88db81d5c953a1754f2638870f181634bce9ab1c1297e02a691e6
```

## What This Enables

Traffiq now has the first user-specific persisted product feature.

From a Data Engineering and backend perspective, this demonstrates:

- identity-aware data modeling
- protected API serving
- user-scoped SQL access
- cloud database persistence
- mobile-to-API personal feature flow

## What Is Not Done Yet

This task does not:

- make ride history per-user
- add saved destinations separately from saved routes
- add user preferences
- add route sharing

Those belong to later v3 tasks.
