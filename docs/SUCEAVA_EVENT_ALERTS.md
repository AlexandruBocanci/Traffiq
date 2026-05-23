# Geolocated Suceava Event Alerts

## Purpose

This document records Task 22 of Traffiq v3: improving controlled Suceava
traffic alerts so they can be stored, served, and rendered as real map
markers.

The project does not claim live incident coverage. It uses realistic,
controlled Suceava alert examples to demonstrate an end-to-end spatial event
data path.

## Why Controlled Event Data

Traffiq v3 is a low-cost portfolio proof-of-concept. The selected event
approach is:

```text
controlled Suceava event seed data with representative coordinates
```

This approach keeps the product honest:

- no paid incident provider is required;
- no new AWS service is required;
- no claim of Waze-like or official live incident reporting is made;
- the data engineering path remains fully demonstrable.

## Source Dataset

Source file:

- `data/raw/events_raw.csv`

Each event now contains:

| Field | Purpose |
| --- | --- |
| `event_timestamp` | Controlled example reporting time |
| `event_type` | Alert category |
| `street_name` | Suceava street/corridor |
| `description` | User-facing event description |
| `severity` | `low`, `medium`, or `high` |
| `latitude` | Representative marker position |
| `longitude` | Representative marker position |

Seeded map alerts:

| Street | Event type | Severity | Latitude | Longitude |
| --- | --- | --- | ---: | ---: |
| `Bulevardul George Enescu` | `accident` | `medium` | `47.642800` | `26.238800` |
| `Calea Unirii` | `roadwork` | `low` | `47.665900` | `26.258800` |
| `Strada Stefan cel Mare` | `hazard` | `medium` | `47.651400` | `26.254700` |
| `Calea Burdujeni` | `police` | `low` | `47.670200` | `26.277600` |
| `Strada Marasesti` | `accident` | `high` | `47.644500` | `26.249500` |

Coordinates are representative demo positions on the configured Suceava
corridors, aligned with the Suceava-only routing catalog.

## Data Model

Data flow:

```text
events_raw.csv
-> bronze.events_raw
-> silver.events_observations
-> serving.vw_map_events
-> FastAPI endpoints
-> React Native map markers
```

Bronze additions:

```text
raw_latitude
raw_longitude
```

Silver additions:

```text
latitude NUMERIC(9, 6)
longitude NUMERIC(9, 6)
```

`src/transform/transform_events_data.py` validates:

- allowed event types and severity values;
- non-null numeric coordinates;
- marker points inside configured Suceava bounding limits.

This prevents an out-of-scope event, such as a Bucharest coordinate, from
appearing on the Suceava map.

## API And Mobile Map

Public endpoints preserve their existing purpose and now add event
coordinates:

- `GET /map/events`
- `GET /mobile/drive-overview`
- `GET /reports/overview`

The mobile `SuceavaMap` component renders an event marker for each event with
valid coordinates:

- high severity: red marker;
- medium severity: amber marker;
- low severity: accent marker.

The public overview still returns:

```text
rides=[]
```

because ride history remains personal data.

## Controlled Cloud Refresh

A dedicated events pipeline was added:

- `src/pipeline/run_events_pipeline.py`

For an RDS target it requires explicit confirmation:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -m src.pipeline.run_events_pipeline --confirm-cloud-reset
```

This command resets only:

- `bronze.events_raw`
- `silver.events_observations`

It does not reset weather, traffic, route analytics, or ride history.

## Data Loss Protection Correction

During Task 22, existing integration test scripts were found to contain direct
`TRUNCATE` operations while local configuration can point to Amazon RDS.

All identified destructive integration tests now call the existing RDS safety
guard before any database mutation. When `.env` targets RDS, they stop with a
clear blocked-reset error. Intentional cloud loads must use controlled
pipeline commands instead of integration tests.

## Validation

Validated on `May 23, 2026`:

```text
Schema columns -> bronze raw coordinates and silver numeric coordinates present in RDS
events_pipeline without --confirm-cloud-reset -> blocked on RDS
events_pipeline with --confirm-cloud-reset -> success
events pipeline run_id -> 4
records_extracted -> 5
records_loaded -> 10
invalid_rows_removed -> 0
silver events rows with latitude/longitude -> 5 / 5
App Runner status -> RUNNING
ECR latest digest -> sha256:879bea5b41c4cd8b2da5b895fce54d642060108089f27bafbc0d565381b63ecf
GET /health -> status=ok
GET /map/events -> count=5, coordinates populated
GET /mobile/drive-overview -> events=5 with coordinates, rides=0
GET /reports/overview -> event_count=5, no recent_rides exposure
GET /rides/history without token -> 401
```

## Interview Explanation

The practical explanation is:

```text
I modeled controlled incident coordinates in Bronze and Silver, validated
their Suceava scope during transformation, exposed API-ready map records
through the Serving view, and rendered severity-coded markers in React
Native. In cloud validation I used a domain-specific guarded refresh job so
only event tables were reloaded in RDS.
```
