# User Preferences

## Purpose

This document records Task 25 from Traffiq v3.

The goal is to let authenticated users view and update basic personal preferences.

## Product Rule

Preferences are personal user data.

```text
Guest users can use public traffic features.
Authenticated users can manage their own preferences.
```

## Database Model

User preferences are stored in:

```text
silver.user_preferences
```

Main columns:

- `preference_id`
- `cognito_user_sub`
- `distance_unit`
- `preferred_route_type`
- `theme_mode`
- `created_at`
- `updated_at`

Serving view:

```text
serving.vw_user_preferences
```

Index:

```text
idx_user_preferences_user
```

The table has one row per Cognito user:

```sql
UNIQUE (cognito_user_sub)
```

Allowed values are enforced by SQL `CHECK` constraints:

```text
distance_unit: km, mi
preferred_route_type: fastest, balanced, less_congested
theme_mode: system, dark, light
```

## Backend API

Protected endpoints:

```text
GET /preferences
PUT /preferences
```

Both endpoints use:

```python
Depends(require_current_user)
```

`GET /preferences` creates a default row if the authenticated user does not have one yet.

`PUT /preferences` uses an upsert:

```sql
ON CONFLICT (cognito_user_sub)
DO UPDATE
```

That pattern is common for profile/settings tables because each user owns exactly one current settings row.

## Mobile Behavior

Account screen:

- guest users see the login/register flow
- authenticated users see the Preferences card
- preferences are loaded through `GET /preferences`
- tapping a preference option saves it through `PUT /preferences`

Current options:

- distance unit: kilometers or miles
- route type: balanced, fastest, less congested
- theme mode: system, dark, light

After Task 36F, `theme_mode` is applied by the mobile runtime theme provider.
`system` follows the phone appearance, while `dark` and `light` override it.
Guest users can also set a local-only appearance mode on the device.

Detailed appearance documentation:

- `docs/MOBILE_APPEARANCE_MODES.md`

## RDS Deployment

The idempotent schema entry point was applied to RDS:

```text
sql/ddl/create_all.sql
```

No pipeline reset or seed reload was run.

This is application-owned personal data, not ETL seed data.

## Validation

Technical validation:

```text
python -m compileall src/api -> passed
npx.cmd tsc --noEmit -> passed
python tests/integration/test_preferences_endpoint.py with PYTHONPATH=. -> passed
python tests/integration/test_saved_routes_endpoint.py with PYTHONPATH=. -> passed
python tests/integration/test_rides_history_endpoint.py with PYTHONPATH=. -> passed
git diff --check -> passed, with only expected Windows CRLF/LF warnings
```

Cloud validation:

```text
RDS DDL application -> passed
GET /health -> status=ok
GET /preferences without token -> 401
GET /preferences with real Cognito access token -> km, balanced, system
PUT /preferences with real Cognito access token -> updated=True, mi, less_congested, dark
GET /preferences after update -> mi, less_congested, dark
temporary preferences cleanup -> deleted
temporary Cognito user cleanup -> deleted
App Runner status -> RUNNING
ECR latest digest -> sha256:9aecf3fb15529ee4654f266936569d43599471c4b4453d4cc6b6d3f5bd5beb91
```

RDS object counts after Task 25:

```text
bronze   | 4
etl_meta | 2
gold     | 5
serving  | 12
silver   | 9
```

## What This Enables

Traffiq now has three persisted personal feature categories:

- saved routes
- user ride history
- user preferences

From a Data Engineering and backend perspective, this demonstrates:

- user-owned dimension-style settings
- one-row-per-user modeling
- SQL constraints for valid categorical values
- upsert behavior for profile/settings data
- Cognito identity as the stable owner key
- mobile-to-cloud personal data persistence

## What Is Not Done Yet

This task does not:

- convert all displayed route units to miles
- build advanced personalization
- add account deletion

Those belong to later product polish or future work.
