# Environment Separation

## Purpose

This document defines how Traffiq separates local development, Docker-based local demos, and the deployed AWS environment.

The goal is to avoid mixing:

- local machine configuration
- Docker service configuration
- AWS deployment configuration

## Environment Modes

Traffiq currently has three environment modes:

```text
local-classic
local-docker
aws-deployable
```

## 1. Local Classic Environment

Use this mode when developing directly on Windows with a local Python virtual environment and a local PostgreSQL installation.

### Runtime

```text
FastAPI runs on Windows
PostgreSQL runs on Windows
Python dependencies come from .venv
Mobile runs through Expo Go
```

### Backend startup

```powershell
uvicorn src.api.main:app --reload --host 0.0.0.0
```

### Database connection

Expected `.env` values:

```text
DB_HOST=localhost
DB_NAME=traffiq
DB_USER=postgres
DB_PASSWORD=<local-postgres-password>
DB_PORT=5432
```

### Best use case

Use this when:

- editing Python code frequently
- debugging pipeline modules
- running individual integration tests
- working with the local PostgreSQL database directly

## 2. Local Docker Environment

Use this mode when running the backend stack in a reproducible way through Docker.

### Runtime

```text
FastAPI runs in the api container
PostgreSQL runs in the db container
Docker Compose creates the internal service network
Mobile still runs through Expo Go on the host machine
```

### Backend startup

```powershell
docker compose up --build -d
```

### Database connection inside Docker

The API container connects to PostgreSQL through Docker DNS:

```text
DB_HOST=db
DB_NAME=traffiq
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
```

### Database connection from Windows

The host machine can access the Docker PostgreSQL database through:

```text
host=localhost
port=5433
database=traffiq
user=postgres
password=postgres
```

Port `5433` is used on the host to avoid conflict with a local PostgreSQL server already using `5432`.

### Demo data behavior

The API container runs:

```powershell
python -m src.api.start_server
```

That startup module:

1. runs `seed_demo_data()`
2. populates the Docker database for the mobile demo
3. starts FastAPI only after seeding succeeds

### Best use case

Use this when:

- demoing the project locally
- validating the backend as services
- testing a setup closer to deployment
- avoiding manual PostgreSQL setup on another machine

## 3. AWS Deployable Environment

Use this mode for the deployed cloud-backed v3 application.

The current implementation uses App Runner for FastAPI, Amazon RDS PostgreSQL for storage, Amazon ECR for the container image, and Amazon Cognito for authentication.

### Runtime

```text
FastAPI runs as a containerized AWS service
PostgreSQL runs on Amazon RDS
Pipeline runs as a scheduled job
Mobile app calls a public backend URL
Secrets come from AWS environment variables or managed secrets
```

The practical deployment workflow for this environment is documented in:

- `docs/CLOUD_WORKFLOW.md`

Secrets and config handling is documented in:

- `docs/SECRETS_AND_CONFIG.md`

### Backend service options

Recommended first option:

```text
AWS App Runner
```

More advanced later option:

```text
Amazon ECS Fargate
```

### Database

Recommended service:

```text
Amazon RDS PostgreSQL
```

Expected cloud environment variables:

```text
DB_HOST=traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com
DB_NAME=traffiq
DB_USER=traffiq_admin
DB_PASSWORD=<aws-managed-secret-or-env-value>
DB_PORT=5432
```

Current RDS details are documented in:

- `docs/AWS_RDS_POSTGRESQL.md`

### Pipeline execution

Current Task 20 behavior:

```text
local Python ETL execution -> Amazon RDS PostgreSQL
```

The full controlled Suceava demo load requires:

```powershell
python -m src.pipeline.seed_demo_data --confirm-cloud-reset
```

Recommended later scheduled direction:

```text
EventBridge Scheduler -> ECS Fargate task -> Amazon RDS PostgreSQL
```

Detailed scheduling strategy is documented in:

- `docs/SCHEDULER_STRATEGY.md`

The pipeline should not depend on a developer manually running local commands.

### Demo data behavior

The current Docker startup seeds demo data automatically for local demo convenience.

In a real AWS deployment, API startup should not permanently depend on demo seeding. The deployable setup should separate:

```text
API startup
database migration / DDL
pipeline execution
demo seeding if needed
```

## Environment Comparison

| Area | Local Classic | Local Docker | AWS Deployable |
| --- | --- | --- | --- |
| API runtime | Windows `.venv` | Docker `api` container | App Runner or ECS |
| Database | Local PostgreSQL | Docker `db` container | Amazon RDS PostgreSQL |
| API DB host | `localhost` | `db` | RDS endpoint |
| Host DB port | `5432` | `5433` | not local |
| Secrets | `.env` | `docker-compose.yml` env values | AWS env vars or Secrets Manager |
| Pipeline run | manual Python command | automatic seed or manual container command | scheduled job |
| Mobile app | Expo Go | Expo Go | installed app or Expo pointing to public API |

## Rules

1. Do not commit `.env`.
2. Do not hardcode real secrets in Python code.
3. Use `src/config/settings.py` as the single backend DB configuration source.
4. Use Docker environment variables for local Docker runtime.
5. Use AWS environment variables or Secrets Manager for deployable runtime.
6. Keep local demo seeding separate from future production API behavior.

## Practical Commands

### Local classic backend

```powershell
uvicorn src.api.main:app --reload --host 0.0.0.0
```

### Local Docker backend

```powershell
docker compose up --build -d
```

### Mobile app

```powershell
cd mobile
npx.cmd expo start
```

## Relationship To Other Docs

- `docs/LOCAL_SETUP.md` explains how to run the project locally.
- `docs/AWS_DEPLOYMENT.md` explains the AWS target architecture.
- `docs/CLOUD_WORKFLOW.md` explains the deployable cloud workflow step by step.
- `docs/SECRETS_AND_CONFIG.md` explains how local, Docker, and AWS config values should be handled.
- this file explains how the environments differ and why they should stay separated.
