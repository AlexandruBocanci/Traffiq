# AWS RDS Schema Application

## Purpose

This document records the schema application for Traffiq v3 on Amazon RDS PostgreSQL.

The goal of this task is to create the same warehouse-style database structure in RDS that already exists locally and in Docker.

## Target Database

RDS database:

```text
Host: traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com
Port: 5432
Database: traffiq
User: traffiq_admin
```

The password is stored only in the local Git-ignored `.env` file and must not be committed.

## Applied SQL Entry Point

Schema creation was applied through:

```text
sql/ddl/create_all.sql
```

That file runs:

```text
sql/ddl/create_schemas.sql
sql/ddl/create_bronze_tables.sql
sql/ddl/create_silver_tables.sql
sql/ddl/create_gold_tables.sql
sql/ddl/create_metadata_tables.sql
sql/ddl/create_indexes.sql
sql/ddl/create_serving_views.sql
```

## Execution Command

The schema was applied from the project root with the password loaded from local `.env`:

```powershell
$env:PGPASSWORD=(Select-String -Path '.env' -Pattern '^DB_PASSWORD=').Line.Split('=',2)[1]; psql -h traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com -p 5432 -U traffiq_admin -d traffiq -f sql/ddl/create_all.sql
```

No password was printed or committed.

## Execution Result

The DDL completed successfully.

Observed output included:

```text
CREATE SCHEMA
CREATE TABLE
CREATE INDEX
CREATE VIEW
```

PostgreSQL also returned expected notices for idempotent column additions:

```text
NOTICE: column "observation_count" of relation "route_summary" already exists, skipping
NOTICE: column "min_speed" of relation "route_summary" already exists, skipping
NOTICE: column "max_speed" of relation "route_summary" already exists, skipping
NOTICE: column "congestion_level" of relation "route_summary" already exists, skipping
```

These notices are acceptable because the SQL uses `ADD COLUMN IF NOT EXISTS`.

## Created Schemas

Validation query:

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('bronze','silver','gold','serving','etl_meta')
ORDER BY schema_name;
```

Validated result:

```text
bronze
etl_meta
gold
serving
silver
```

## Created Object Counts

Validation query:

```sql
SELECT table_schema, COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema IN ('bronze','silver','gold','serving','etl_meta')
GROUP BY table_schema
ORDER BY table_schema;
```

Validated result:

```text
bronze   | 4
etl_meta | 2
gold     | 5
serving  | 9
silver   | 6
```

Task 23 adds `silver.saved_routes`, so the current RDS schema with saved routes contains:

```text
serving  | 10
silver   | 7
```

Task 24 adds `silver.user_ride_history`, so the current RDS schema with user ride history contains:

```text
serving  | 11
silver   | 8
```

## Created Indexes

Validation confirmed endpoint-supporting indexes in `silver` and `gold`, including:

```text
idx_traffic_observations_timestamp
idx_traffic_observations_avg_speed
idx_hourly_street_metrics_congestion
idx_weather_traffic_impact_metric
idx_route_summary_congestion
idx_route_hourly_report_route_time
idx_events_observations_timestamp
idx_ride_history_started_at
idx_user_ride_history_user_started_at
idx_saved_routes_user_created_at
idx_saved_routes_user_origin_destination
idx_top_congested_segments_rank
```

## What This Enables

RDS now has the required Traffiq database structure:

- Bronze raw ingestion tables
- Silver cleaned analytical tables
- Gold business-level analytical tables
- Serving API-ready views
- ETL metadata tables
- endpoint-supporting indexes

This prepares Task 20, where the ETL pipeline will load data into the cloud database.

## Task 22 Event Geolocation Extension

Task 22 extended the existing schema for Suceava map alert markers.

Applied additions:

```text
bronze.events_raw.raw_latitude
bronze.events_raw.raw_longitude
silver.events_observations.latitude
silver.events_observations.longitude
serving.vw_map_events exposes latitude and longitude
```

The idempotent DDL was reapplied to RDS on `May 23, 2026`. It added columns
and recreated Serving views without deleting existing table data. Event rows
were subsequently refreshed through the dedicated guarded events pipeline.

Detailed event documentation:

- `docs/SUCEAVA_EVENT_ALERTS.md`

## Task 23 Saved Routes Extension

Task 23 added user-specific route persistence.

Applied additions:

```text
silver.saved_routes
serving.vw_saved_routes
idx_saved_routes_user_created_at
idx_saved_routes_user_origin_destination
```

The schema was applied to RDS through the idempotent `sql/ddl/create_all.sql` entry point on `May 23, 2026`.

No ETL reset or seed reload was required because saved routes are application-owned user data, not analytical seed data.

Detailed saved routes documentation:

- `docs/SAVED_ROUTES.md`

## Task 24 User Ride History Extension

Task 24 added user-specific ride history persistence.

Applied additions:

```text
silver.user_ride_history
serving.vw_user_ride_history
idx_user_ride_history_user_started_at
```

The schema was applied to RDS through the idempotent `sql/ddl/create_all.sql` entry point on `May 25, 2026`.

No ETL reset or seed reload was required because user ride history is application-owned personal data, not analytical seed data.

Detailed user ride history documentation:

- `docs/USER_RIDE_HISTORY.md`

## What Is Not Done Yet

This task only applies the schema.

It does not:

- load demo data into RDS
- run the ETL pipeline against RDS
- deploy FastAPI to AWS
- connect App Runner to RDS
- connect the mobile app to a public API URL

Those belong to later v3 tasks.
