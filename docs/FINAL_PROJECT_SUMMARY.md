# Final Project Summary For License Presentation

## 1. Project Overview

Traffiq is an end-to-end traffic intelligence data engineering project focused on the city of Suceava.

The project demonstrates how raw and semi-structured mobility-related data can be ingested, cleaned, modeled, served through an API, deployed in the cloud, and consumed by a mobile application.

Traffiq is not positioned as a real-time navigation platform or a Waze clone. It is a portfolio and license project designed to demonstrate practical Data Engineering skills through a complete system:

```text
data sources -> ETL pipeline -> PostgreSQL analytical layers -> FastAPI -> mobile app -> AWS deployment
```

## 2. Problem Statement

Urban traffic data is often fragmented across multiple sources:

- traffic observations
- weather data
- route definitions
- city events and alerts
- user-specific ride history

Without a structured data pipeline, this information remains difficult to analyze, validate, and present in a useful product interface.

The problem addressed by Traffiq is:

```text
How can traffic, weather, route, and event data be processed into reliable analytical layers and exposed through a usable mobile traffic intelligence interface?
```

The project solves this at portfolio scale by building a controlled, low-cost, Suceava-focused traffic intelligence system.

## 3. Project Objectives

The main objectives are:

- ingest mobility-related data from files and APIs
- clean and standardize data with Python and pandas
- model data in PostgreSQL using Bronze, Silver, Gold, and Serving layers
- expose analytical outputs through FastAPI endpoints
- provide mobile-ready API responses for a React Native / Expo app
- protect personal features through Amazon Cognito authentication
- deploy the backend to AWS using a low-cost architecture
- document operational behavior, limitations, and demo procedures

## 4. Architecture Summary

The system is organized into five main layers.

### Data Sources

Traffiq uses controlled data sources suitable for a stable academic and portfolio demo:

- CSV traffic observations
- Open-Meteo weather API data
- route reference data
- Suceava event and alert data
- personal route and ride records

The weather source is real API data from Open-Meteo. Traffic and event inputs are controlled demo datasets because reliable real-time traffic APIs are often paid, restricted, or outside the scope of this project.

### ETL Pipeline

The ETL pipeline is implemented in Python.

Pipeline responsibilities:

- extract raw data from CSV/API sources
- transform data into validated and standardized DataFrames
- load raw data into Bronze tables
- load clean data into Silver tables
- build analytical outputs in Gold tables
- expose API-ready views through the Serving layer
- write pipeline run metadata and data quality checks

The main pipeline files are:

- `src/pipeline/run_pipeline.py`
- `src/pipeline/seed_demo_data.py`
- `src/extract/`
- `src/transform/`
- `src/load/`

### PostgreSQL Analytical Database

PostgreSQL is used as the analytical storage layer.

Schemas:

- `bronze`
- `silver`
- `gold`
- `serving`
- `etl_meta`

This structure follows a common Data Engineering pattern:

```text
Bronze -> Silver -> Gold -> Serving
```

### FastAPI Backend

FastAPI exposes the analytical outputs to clients.

Important endpoint groups:

- health check
- traffic analytics
- weather impact
- route reports
- route preview
- map events
- mobile drive overview
- pipeline status
- personal ride history
- saved routes
- preferences
- authentication validation

The `/mobile/drive-overview` endpoint is important because it acts like a backend-for-frontend response. It groups routes, events, congestion, weather, and public mobile context into one response optimized for the mobile Drive screen.

### Mobile Application

The mobile app is built with React Native / Expo.

Main screens:

- Drive
- History
- Account
- Pipeline

The Drive screen demonstrates the product value of the pipeline:

- route planning
- route preview
- route polyline on the map
- destination marker
- Suceava alert markers
- weather impact context
- route condition summary
- saved route action
- drive action that saves personal ride history for authenticated users

## 5. Cloud Architecture Summary

The current cloud demo uses AWS services with a low-cost architecture:

- Amazon ECR stores the backend Docker image
- AWS App Runner runs the public FastAPI backend
- Amazon RDS PostgreSQL stores the Traffiq database
- Amazon Cognito handles user authentication
- the mobile app calls the public App Runner API by default

Cloud flow:

```text
React Native / Expo Mobile App
        |
        v
AWS App Runner FastAPI Backend
        |
        v
Amazon RDS PostgreSQL
```

Authentication flow:

```text
Mobile App -> Amazon Cognito -> JWT access token -> FastAPI protected endpoint -> RDS personal rows
```

The project intentionally avoids expensive cloud services such as NAT Gateway, Kubernetes, Multi-AZ RDS, and always-on EC2.

Scheduled ETL with EventBridge Scheduler and ECS Fargate is documented as a future production-style improvement. The current demo keeps cloud cost low by running controlled RDS data loads only when needed.

## 6. Data Model Summary

The database is divided by responsibility.

### Bronze

Bronze stores raw or near-raw ingested data.

Purpose:

- preserve source-level traceability
- keep data before heavy cleaning
- support debugging and reprocessing

Examples:

- traffic raw records
- weather raw records
- event raw records
- ride raw records

### Silver

Silver stores cleaned and standardized records.

Purpose:

- normalize data types
- remove invalid records
- standardize business fields
- prepare data for analytics

Examples:

- cleaned traffic observations
- weather observations
- traffic-weather enriched records
- route reference data
- event observations
- personal user ride history
- saved routes
- user preferences

### Gold

Gold stores analytical outputs.

Purpose:

- answer product and reporting questions
- aggregate traffic and route metrics
- calculate congestion and weather impact signals

Examples:

- hourly street metrics
- weather traffic impact
- route summary
- route hourly report
- top congested segments

### Serving

Serving views expose stable, API-ready datasets.

Purpose:

- decouple API queries from raw analytical tables
- provide frontend-friendly shapes
- keep the API contract stable

### ETL Metadata

The `etl_meta` schema stores operational metadata.

Purpose:

- track pipeline runs
- record success/failure status
- store extracted and loaded record counts
- record data quality checks

This is important because real data pipelines need observability, not only transformations.

## 7. Implementation Summary

### Backend And ETL

Implementation highlights:

- Python ETL modules are separated into extract, transform, and load responsibilities
- pandas is used for cleaning, typing, deduplication, and aggregation
- PostgreSQL DDL is versioned under `sql/ddl/`
- FastAPI route modules are separated by domain
- database configuration is environment-based
- cloud destructive pipeline commands require explicit confirmation flags
- App Runner startup runs only FastAPI, not automatic seed or ETL reload

### Mobile

Implementation highlights:

- React Native / Expo mobile app
- shared API service layer
- Cognito authentication context
- public guest access for traffic intelligence features
- protected personal flows for ride history, saved routes, and preferences
- Suceava map with route polyline and alert markers
- route confirmation flow with save, change, end, and drive actions
- Pipeline screen for demo/admin observability

### Security And Privacy

Security decisions:

- `.env` and secrets are not committed
- database passwords and AWS credentials are not stored in Git
- personal endpoints require Cognito JWT validation
- public `/mobile/drive-overview` intentionally returns `rides=[]`
- ride history, saved routes, and preferences are personal features
- App Runner does not automatically reload demo data at startup

## 8. Limitations

Traffiq has deliberate scope limits:

- it is limited to Suceava
- it does not provide real-time Waze-like traffic
- it does not support multi-city routing
- it does not include user-generated reports
- it does not include push notifications
- it does not implement turn-by-turn navigation
- traffic data is controlled demo data, not live traffic sensor data
- scheduled cloud ETL is documented but not implemented as always-on infrastructure
- AWS resources are intended for test/demo use, not 24/7 production operation

These limitations are intentional because the project prioritizes Data Engineering architecture, low cost, and presentation stability.

## 9. Future Work

Future improvements could include:

- scheduled ETL through EventBridge Scheduler and ECS Fargate
- larger real-world traffic datasets
- additional Suceava route coverage
- historical trend dashboards
- more detailed weather-to-traffic analysis
- route alternatives based on congestion score
- standalone Android build for easier phone installation
- automated backend integration tests against the cloud API
- infrastructure-as-code for repeatable AWS provisioning
- stricter API rate limiting and production monitoring

The most realistic next production-style step is scheduled ETL:

```text
EventBridge Scheduler -> ECS Fargate task -> Python ETL -> Amazon RDS PostgreSQL
```

## 10. Academic Positioning

Traffiq can be described academically as:

```text
An end-to-end data engineering system for urban traffic intelligence, using ETL pipelines, layered PostgreSQL analytical modeling, API-based serving, mobile consumption, cloud deployment, and authentication-protected personal features.
```

The project demonstrates practical knowledge of:

- data ingestion
- data cleaning
- analytical modeling
- SQL database design
- pipeline observability
- API design
- mobile integration
- AWS deployment basics
- authentication and personal data protection
- cost-aware cloud architecture

## 11. Final Presentation Summary

Use this summary in slides or oral presentation:

```text
Traffiq is a Suceava-focused traffic intelligence project built as an end-to-end Data Engineering system. It ingests traffic, weather, route, and event data, processes it through Python ETL pipelines, stores it in PostgreSQL Bronze, Silver, Gold, and Serving layers, exposes the results through FastAPI, and presents them in a React Native mobile app. The backend is deployed through AWS App Runner, data is stored in Amazon RDS PostgreSQL, and personal features are protected with Amazon Cognito. The project is intentionally scoped as a low-cost portfolio and license demo, not as a real-time navigation platform.
```

