# Open-Meteo Weather Ingestion For Suceava

## Purpose

This document records Task 21 of Traffiq v3: retaining real, free weather
ingestion for the Suceava-only product scope and validating that refreshed
weather data reaches Amazon RDS and the public API.

## Source And Scope

Traffiq uses the Open-Meteo forecast API as its external weather source.

The configured v3 weather target is:

| Setting | Value |
| --- | --- |
| Location | `Suceava` |
| Latitude | `47.6514` |
| Longitude | `26.2556` |
| Timezone | `Europe/Bucharest` |

These values describe the Suceava city-center context already used by the app
map/routing foundation. The integration remains free and does not require an
API key or a new AWS service.

## Why Timezone Is Explicit

The existing traffic-weather enrichment matches records by hour of day. The
controlled traffic observations represent local Suceava clock time.

Open-Meteo is now requested with:

```text
timezone=Europe/Bucharest
```

This ensures that weather hourly timestamps are aligned to the same local
clock interpretation before the simplified hourly join is applied.

## Configuration

Weather configuration is centralized in:

- `src/config/settings.py`

Committed template values in `.env.example`:

```text
WEATHER_LOCATION_NAME=Suceava
WEATHER_LATITUDE=47.6514
WEATHER_LONGITUDE=26.2556
WEATHER_TIMEZONE=Europe/Bucharest
```

The code provides the same Suceava defaults when the optional weather
variables are absent. A deployment or local pipeline run must keep these
values unchanged while v3 remains Suceava-only.

## Data Flow

```text
Open-Meteo API for Suceava
-> src/extract/extract_weather_api.py
-> bronze.weather_raw
-> silver.weather_observations
-> silver.traffic_weather_enriched
-> gold.weather_traffic_impact
-> serving.vw_weather_impact
-> FastAPI /weather-impact and /mobile/drive-overview
```

The current cloud execution path is:

```text
local controlled ETL run -> Amazon RDS PostgreSQL -> App Runner FastAPI reads data
```

App Runner does not execute or reset the pipeline on API startup.

## Controlled RDS Refresh

The Task 21 validation refreshed only the traffic-weather analytical tables:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -m src.pipeline.run_pipeline --confirm-cloud-reset
```

The explicit flag is mandatory because this pipeline truncates and reloads
its Bronze/Silver/Gold traffic-weather target tables when the configured
database is Amazon RDS.

The full demo seed command was deliberately not run because Task 21 does not
require resetting routes, events, or ride history.

## Validation

Validated on `May 23, 2026`:

```text
Suceava request config -> latitude=47.6514, longitude=26.2556, timezone=Europe/Bucharest
Open-Meteo extraction test -> passed
Weather transform test -> passed
RDS pipeline run_id -> 3
RDS pipeline status -> success
records_extracted -> 196
records_loaded -> 609
bronze.weather_raw rows -> 168
bronze weather forecast timestamp range -> 2026-05-23T00:00 to 2026-05-29T23:00
silver.weather_observations rows -> 168
gold.weather_traffic_impact rows -> 2
GET /health -> status=ok
GET /weather-impact -> count=2
GET /mobile/drive-overview -> weather=2, routes=5, events=5, rides=0
```

The API result confirms that App Runner serves the newly loaded RDS weather
analytics without exposing personal ride data through the public mobile
overview.

## Known Limitation

The current enrichment remains a portfolio-stage model:

- weather is real Open-Meteo data for Suceava;
- traffic observations remain controlled seed data;
- weather and traffic are joined by local hour of day, not by a real-time
  route-segment observation key;
- Gold `metric_date` is based on the traffic observation date used in the
  enrichment, not a claim of live traffic on the forecast date.

This is appropriate for v3 positioning as a Suceava traffic intelligence
proof-of-concept, not a real-time navigation service.
