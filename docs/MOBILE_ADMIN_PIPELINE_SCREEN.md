# Mobile Admin Pipeline Screen

## Purpose

This document records Task 27 from Traffiq v3.

The goal is to show pipeline health in the mobile app for demo and license discussion.

## Screen

Mobile screen:

```text
Pipeline
```

The screen is reached from the existing Drive admin/settings entry point.

After the final Task 27 UI correction, the entry point is an explicit Drive card:

```text
Admin -> Pipeline status
```

It is not a normal user feature. It exists to support the Data Engineering portfolio story.

## Backend Source

The screen calls:

```text
GET /pipeline/status
```

The endpoint was added in Task 26 and reads:

```text
etl_meta.pipeline_runs
etl_meta.data_quality_checks
```

## Displayed Information

The screen now displays:

- API health status
- latest pipeline status
- `records_extracted`
- `records_loaded`
- latest `run_id`
- pipeline name
- started timestamp
- finished timestamp
- error message, if present
- data quality checks for the latest run
- pipeline architecture explanation

## Mobile Implementation

Updated files:

```text
mobile/src/types/api.ts
mobile/src/services/traffiqApi.ts
mobile/src/screens/PipelineScreen.tsx
mobile/src/screens/DriveScreen.tsx
```

Added TypeScript response models:

```text
PipelineRunRecord
DataQualityCheckRecord
PipelineStatusResponse
```

Added API helper:

```text
getPipelineStatus()
```

## Validation

Mobile validation:

```text
npx.cmd tsc --noEmit -> passed
npx.cmd expo export --platform android --output-dir .expo-export-task27 -> passed
```

Cloud endpoint validation:

```text
GET /pipeline/status -> run_id=4
pipeline_name -> events_pipeline
status -> success
records_extracted -> 5
records_loaded -> 10
data_quality_checks -> 1
```

No backend redeploy was required because Task 27 only connects the already deployed endpoint to the mobile app.

## What This Enables

The app can now demonstrate operational visibility:

```text
ETL metadata in RDS -> FastAPI /pipeline/status -> mobile Admin/Pipeline screen
```

This closes the final planned Traffiq v3 implementation task.

## What Is Not Done Yet

This task does not:

- restrict the screen to a real admin role
- schedule ETL execution
- trigger ETL from the mobile app
- replace the planned final bugfix and polish pass

Those belong to post-v3 hardening before merge to `main`.
