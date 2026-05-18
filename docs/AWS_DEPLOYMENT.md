# AWS Deployment Direction

## Purpose

This document defines the intended AWS deployment direction for Traffiq.

It is not a production runbook yet. Its goal is to show how the current local and Docker-based project can evolve into a realistic cloud deployment.

The practical deployment sequence is documented separately in:

- `docs/CLOUD_WORKFLOW.md`

AWS cost guardrails are documented separately in:

- `docs/AWS_COST_GUARDRAILS.md`

Configure the AWS Budget alert from that document before creating RDS, App Runner, ECR, or Cognito resources.

The current v3 Amazon RDS PostgreSQL instance is documented in:

- `docs/AWS_RDS_POSTGRESQL.md`

The applied RDS schema is documented in:

- `docs/AWS_RDS_SCHEMA.md`

The backend Docker image pushed to Amazon ECR is documented in:

- `docs/AWS_ECR_BACKEND_IMAGE.md`

The deployed AWS App Runner backend service is documented in:

- `docs/AWS_APP_RUNNER_BACKEND.md`

The mobile app cloud API configuration is documented in:

- `docs/MOBILE_CLOUD_API_CONFIG.md`

Secrets and environment configuration strategy is documented in:

- `docs/SECRETS_AND_CONFIG.md`

## Current Local Architecture

```text
Traffic CSV + Weather API
        |
        v
Python ETL pipeline
        |
        v
PostgreSQL local or Docker PostgreSQL
        |
        v
FastAPI backend
        |
        v
Expo / React Native mobile app
```

The current Docker setup runs:

- PostgreSQL container
- FastAPI container
- automatic demo data seeding before API startup

This is useful for local development and demo reliability, but it is not the final cloud layout.

## Target AWS Architecture

```text
Traffic CSV / future traffic API
Weather API
Mock or future events API
        |
        v
Scheduled ETL job
        |
        v
Amazon RDS PostgreSQL
        |
        v
Containerized FastAPI backend
        |
        v
Public API URL
        |
        v
Mobile app
```

## Recommended AWS Services

### Backend API

Use a containerized FastAPI service.

Recommended service options:

- AWS App Runner for the simplest container deployment path
- Amazon ECS Fargate if more control is needed later

For this project stage, App Runner is the simpler and more portfolio-friendly option because it can run a Dockerized web API without managing servers.

### Database

Use Amazon RDS for PostgreSQL.

RDS replaces:

```text
local PostgreSQL
Docker PostgreSQL
```

with a managed PostgreSQL instance.

The application should connect through environment variables:

```text
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=traffiq
DB_USER=<database-user>
DB_PASSWORD=<database-password>
```

### Container Registry

Use Amazon ECR to store the backend Docker image.

Flow:

```text
local Docker image
        |
        v
Amazon ECR repository
        |
        v
App Runner or ECS service
```

### Scheduled Pipeline

The ETL pipeline should eventually run as a scheduled job instead of running manually.

Detailed scheduling strategy is documented in:

- `docs/SCHEDULER_STRATEGY.md`

Recommended future options:

- EventBridge Scheduler triggering an ECS Fargate task
- EventBridge Scheduler triggering a Lambda function, only if the pipeline stays small enough
- GitHub Actions or manual job trigger for early portfolio demos

For Traffiq, the most realistic data-engineering direction is:

```text
EventBridge Scheduler -> ECS Fargate task -> RDS PostgreSQL
```

### Secrets

Do not store real secrets in Git.

Local development uses:

```text
.env
```

Cloud deployment should use one of:

- AWS App Runner environment variables for simple deployment
- AWS Secrets Manager for stronger secret handling

The project already supports environment-based configuration through `src/config/settings.py`.

Detailed rules for local `.env`, Docker environment variables, AWS environment variables, and AWS Secrets Manager are documented in:

- `docs/SECRETS_AND_CONFIG.md`

## Environment Separation

Detailed environment separation is documented in:

- `docs/ENVIRONMENTS.md`

### Local classic mode

Used for normal development without Docker.

```text
FastAPI runs on Windows through .venv
PostgreSQL runs locally on Windows
DB_HOST=localhost
DB_PORT=5432
```

### Local Docker mode

Used for reproducible backend demos.

```text
FastAPI runs in Docker
PostgreSQL runs in Docker
API container connects to DB_HOST=db
Windows accesses API through localhost:8000
Windows accesses Docker PostgreSQL through localhost:5433
```

### AWS mode

Used for deployable cloud direction.

```text
FastAPI runs as a container service
PostgreSQL runs in RDS
Pipeline runs as a scheduled job
Mobile app calls a public API URL
Secrets are stored as environment variables or managed secrets
```

## Deployment Phases

### Phase 1 - Current state

Completed:

- Dockerized FastAPI backend
- Dockerized PostgreSQL for local demo
- automatic schema initialization in Docker
- automatic demo data seeding before API startup

### Phase 2 - Cloud-ready documentation

Current phase:

- define AWS target architecture
- define service mapping
- define environment variable strategy
- define scheduled pipeline direction

### Phase 3 - Minimal AWS deployment

Future implementation:

- create an RDS PostgreSQL database
- create an ECR repository
- push the backend Docker image to ECR
- deploy FastAPI through App Runner or ECS
- configure production environment variables
- run DDL against RDS
- run the pipeline against RDS

The detailed workflow for this phase is documented in:

- `docs/CLOUD_WORKFLOW.md`

### Phase 4 - Scheduled ETL

Future implementation:

- package the ETL pipeline as a scheduled container job
- trigger it through EventBridge Scheduler
- write run metadata to `etl_meta.pipeline_runs`
- write data quality results to `etl_meta.data_quality_checks`

## Production Adjustments Needed Later

Before real deployment, the project should still add:

- production-safe database credentials
- public API base URL configuration for the mobile app
- CORS policy if a web client is added later
- proper logging strategy
- deployment-specific environment documentation
- a seed strategy that is separate from normal API startup

The current automatic Docker seeding is useful for local demos, but a production API should not reseed demo data every time it starts.

## Recruiter Explanation

The concise explanation for this project is:

```text
Traffiq runs locally through Docker with FastAPI and PostgreSQL, and it is structured so the same backend can later be deployed as a containerized AWS service. The intended cloud architecture uses RDS PostgreSQL for the warehouse database, a containerized FastAPI API for serving, and a scheduled ETL job for recurring pipeline execution.
```

This shows the project is not only a local script. It has a realistic path toward cloud deployment and operational data pipelines.
