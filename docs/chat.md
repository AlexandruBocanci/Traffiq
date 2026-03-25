# Traffiq Shared Chat Log

## Purpose

This file is the shared handoff document between devices and Codex chats.

It has 3 roles:

1. preserve the full project vision and implementation direction
2. preserve the exact implementation history already completed
3. define the next concrete task that must be completed before the next push

Rules for use:

- before doing any new work, the active Codex/chat must read this file
- after reading this file, the active Codex/chat must inspect the repo and confirm the current implementation state
- after a task is completed and validated, this file must be updated before commit/push
- the `Next Task` section must always describe the single most important current task
- after that task is finished, it must be moved into `Updates`, and a new `Next Task` must be written

---

## 1. Project Identity

- Project name: `Traffiq`
- Project type: end-to-end traffic intelligence platform
- Main purpose: serious Junior Data Engineer portfolio project
- Main stack direction:
  - Python
  - pandas
  - PostgreSQL
  - psycopg
  - FastAPI
  - requests
  - later cloud deployment

---

## 2. Final Product Vision

Traffiq is planned as a traffic and mobility intelligence product that combines:

- map-based traffic visibility
- route planning and route reports
- ride history
- weather-aware traffic analytics
- backend API services
- data engineering pipeline and layered data model

The final product vision contains 5 major product areas:

1. `Map`
2. `Ride`
3. `Reports`
4. `History`
5. `Account`

### 2.1. Map

The final product should provide:

- a map-like traffic view inspired by products like Waze
- current location
- route visibility
- traffic density by road segment
- traffic events
  - accidents
  - police
  - road work
  - hazards
- congestion coloring

### 2.2. Ride

The final product should allow a user to:

- set origin and destination
- see recommended route
- see estimated time and distance
- see a pre-ride traffic report
- see weather conditions
- see the most congested segments before starting the ride

### 2.3. Reports

The final product should allow a user to:

- search by street
- search by locality
- search by route from point X to point Y
- inspect traffic by hour for the selected route
- inspect congestion level by route and time window
- inspect weather impact for that route

### 2.4. History

The final product should allow a user to:

- see previous rides
- see origin and destination
- see summary metrics like:
  - distance
  - duration
  - average speed
  - congestion summary
  - weather summary

### 2.5. Account

The final product should eventually contain:

- profile
- settings
- login
- forgot password
- saved preferences

This is part of the final product vision, not the initial implementation scope.

---

## 3. Traffiq v1 Scope

Traffiq v1 is the first realistic implementation.

### Included in v1

- traffic CSV ingestion
- weather API ingestion
- Bronze -> Silver -> Gold modeling
- PostgreSQL database named `traffiq`
- SQL DDL versioned in repo
- ETL pipeline
- FastAPI serving layer
- route/street traffic reporting in simplified form
- local development workflow

### Not included in v1

- real-time Waze-like map engine
- full live route guidance
- full account/auth implementation
- forgot password flow
- full event ingestion from real providers
- cloud deployment in first implementation

### v1 intended product areas

The practical v1 focus is:

1. `Reports`
2. `History` simplified
3. `Map Preview` simplified or analytical view
4. `Pipeline`

---

## 4. Data Architecture

The project uses these database schemas:

- `bronze`
- `silver`
- `gold`
- `etl_meta`

### 4.1. Bronze

Purpose:

- store raw or near-raw source data

Current planned tables:

#### `bronze.traffic_raw`

- `ingestion_id` - `SERIAL PRIMARY KEY`
- `source_file` - `VARCHAR(255)`
- `ingested_at` - `TIMESTAMP`
- `raw_timestamp` - `VARCHAR(100)`
- `raw_street_name` - `VARCHAR(255)`
- `raw_speed` - `VARCHAR(50)`
- `raw_weather` - `VARCHAR(100)`

#### `bronze.weather_raw`

- `ingestion_id` - `SERIAL PRIMARY KEY`
- `requested_at` - `TIMESTAMP`
- `raw_timestamp` - `VARCHAR(100)`
- `temperature` - `NUMERIC(5,2)`
- `precipitation` - `NUMERIC(5,2)`
- `wind_speed` - `NUMERIC(5,2)`
- `weather_code` - `INTEGER`

### 4.2. Silver

Purpose:

- cleaned
- standardized
- validated
- enriched data

Current planned tables:

#### `silver.traffic_observations`

- `traffic_obs_id` - `SERIAL PRIMARY KEY`
- `event_timestamp` - `TIMESTAMP`
- `street_name` - `VARCHAR(255)`
- `avg_speed` - `NUMERIC(10,2)`
- `weather_label` - `VARCHAR(100)`

#### `silver.weather_observations`

- `weather_obs_id` - `SERIAL PRIMARY KEY`
- `event_timestamp` - `TIMESTAMP`
- `temperature_c` - `NUMERIC(5,2)`
- `precipitation_mm` - `NUMERIC(5,2)`
- `wind_speed_kmh` - `NUMERIC(5,2)`
- `weather_code` - `INTEGER`

#### `silver.traffic_weather_enriched`

- `event_timestamp` - `TIMESTAMP`
- `street_name` - `VARCHAR(255)`
- `avg_speed` - `NUMERIC(10,2)`
- `weather_label` - `VARCHAR(100)`
- `temperature_c` - `NUMERIC(5,2)`
- `precipitation_mm` - `NUMERIC(5,2)`
- `wind_speed_kmh` - `NUMERIC(5,2)`

### 4.3. Gold

Purpose:

- analytics-ready and API-facing data

Current planned tables:

#### `gold.hourly_street_metrics`

- `metric_date` - `DATE`
- `hour_of_day` - `INTEGER`
- `street_name` - `VARCHAR(255)`
- `avg_speed` - `NUMERIC(10,2)`
- `congestion_score` - `NUMERIC(5,2)`

#### `gold.weather_traffic_impact`

- `metric_date` - `DATE`
- `weather_label` - `VARCHAR(100)`
- `avg_speed` - `NUMERIC(10,2)`
- `avg_congestion_score` - `NUMERIC(5,2)`

### 4.4. Metadata

Current schema exists:

- `etl_meta`

Metadata tables are planned later.

---

## 5. API Direction

Current API direction for v1:

- `GET /health`
- `GET /traffic`
- `GET /traffic/top-speed`
- later:
  - `GET /streets/top-congested`
  - `GET /routes/report`
  - `GET /weather-impact`

---

## 6. Repository Structure

Current intended structure:

```text
Traffiq/
  docs/
    Traffiq_plan.md
    Traffiq_v1.md
    Traffiq_v2.md
    LOCAL_SETUP.md
    chat.md

  data/
    raw/
    processed/

  sql/
    ddl/
    transformations/

  src/
    api/
    config/
    extract/
    transform/
    load/
    pipeline/
    utils/

  tests/
```

---

## 7. Working Rules

### 7.1. Git workflow

- main branch remains stable
- active implementation branch: `feature/traffiq-v1`
- work happens on the feature branch
- after validated milestones, work is committed and pushed
- later the branch will be merged into `main`

### 7.2. Cross-device workflow

On a new device:

1. clone once
2. run local setup
3. read this file
4. inspect repo state
5. continue from `Next Task`

On an already configured device:

1. pull latest changes
2. read this file
3. inspect repo state
4. continue from `Next Task`

### 7.3. Setup rule

When setup requirements change, update:

- `docs/LOCAL_SETUP.md`

When implementation state changes, update:

- `docs/chat.md`

---

## 8. Completed Work Summary

This section is the exact high-level history that must be preserved.

### 8.1. Learning and preparation already completed before project start

Completed preparation:

- Bronze / Silver / Gold concepts studied and corrected
- Python basics refreshed
- pandas basics completed
- pandas joins and ETL-style transforms completed
- API basics completed
- API to DataFrame practice completed
- PostgreSQL local installation completed
- Python + PostgreSQL integration completed
- ETL practice completed
- FastAPI basic endpoints completed
- readiness check completed

### 8.2. Product planning completed

Completed planning work:

- project renamed to `Traffiq`
- full project vision documented
- v1 and v2 scoped separately
- local setup guide created
- repo structure chosen

### 8.3. Current repo and environment setup completed

Completed implementation and setup work:

- GitHub repository created
- project pushed to GitHub
- project branch `feature/traffiq-v1` created
- local repo structure created
- docs folder populated
- placeholder folders tracked in Git
- PostgreSQL database `traffiq` created

### 8.4. DDL completed and executed

Completed database foundation:

- `sql/ddl/create_schemas.sql` created
- `sql/ddl/create_bronze_tables.sql` created
- `sql/ddl/create_silver_tables.sql` created
- `sql/ddl/create_gold_tables.sql` created
- `sql/ddl/create_all.sql` created
- DDL executed successfully against database `traffiq`

Created schemas:

- `bronze`
- `silver`
- `gold`
- `etl_meta`

Created tables:

- `bronze.traffic_raw`
- `bronze.weather_raw`
- `silver.traffic_observations`
- `silver.weather_observations`
- `silver.traffic_weather_enriched`
- `gold.hourly_street_metrics`
- `gold.weather_traffic_impact`

### 8.5. Local setup documentation completed

Completed documentation:

- `docs/LOCAL_SETUP.md` created to explain:
  - required software
  - clone/setup process on a new device
  - PostgreSQL database creation
  - running DDL
  - what Git does and does not sync

---

## 9. Detailed Update Log

This section must be appended over time. Most recent update should be added at the top.

### Update 001 - Initial project foundation completed

Completed:

- project documentation created:
  - `Traffiq_plan.md`
  - `Traffiq_v1.md`
  - `Traffiq_v2.md`
- local setup guide created:
  - `LOCAL_SETUP.md`
- shared handoff document created:
  - `chat.md`
- initial repo structure created and pushed
- feature branch created:
  - `feature/traffiq-v1`
- PostgreSQL project database created:
  - `traffiq`
- DDL files created for schemas and core Bronze/Silver/Gold tables
- `create_all.sql` created and executed successfully

Notes:

- tutorial database `traffic_learning` exists from training but is not the project database
- project database is `traffiq`
- `traffic_records` table from tutorials may still exist in another database but is not part of Traffiq

---

## 10. Next Task

### Current active mission

Build the Python project foundation for real Traffiq development.

### Exact goal

Create the first real Python project layer for Traffiq v1, focused on configuration and database connection.

### Deliverables

1. Create a configuration module in `src/config/`
2. Create a database utility module in `src/utils/`
3. Move database connection settings out of hardcoded training-style scripts and into project structure
4. Prepare the codebase so later ETL jobs can import the same DB connection logic

### Expected concrete files

- `src/config/settings.py`
- `src/utils/db_utils.py`

### What `settings.py` should eventually do

- hold database configuration for:
  - host
  - port
  - db name
  - user
  - password
- for now it can be simple and local
- later it should be adapted to `.env`

### What `db_utils.py` should eventually do

- expose a function that returns a PostgreSQL connection to `traffiq`
- avoid repeating `psycopg.connect(...)` in every script
- be reusable by:
  - extract jobs
  - load jobs
  - API code
  - validation scripts

### Why this is the next task

Because DDL is done, and before writing real ETL code we need:

- reusable config
- reusable DB connection layer
- cleaner project structure

### Success condition for this task

The task is complete when:

- `settings.py` exists
- `db_utils.py` exists
- there is a simple test script or usage path that confirms a successful connection to database `traffiq`
- the code is reviewed and validated before commit

---

## 11. Instructions For Any New Codex Chat

If you are a new Codex chat reading this file, you must do the following before suggesting any implementation:

1. Read:
   - `docs/Traffiq_plan.md`
   - `docs/Traffiq_v1.md`
   - `docs/Traffiq_v2.md`
   - `docs/LOCAL_SETUP.md`
   - `docs/chat.md`
2. Inspect the current repo structure
3. Confirm the current Git branch
4. Confirm what has already been implemented
5. Continue from the `Next Task` section unless the user explicitly changes priorities

Do not assume hidden context. Treat this file and the repo as the source of truth.
