# Local Setup

## Purpose

This file explains everything required to run Traffiq on a new device.

It must be updated whenever the project gains:

- a new dependency
- a new environment variable
- a new database object
- a new startup command
- a new required local tool

## 1. Required Software

Install these on every device:

- Git
- Python
- Node.js
- PostgreSQL
- Visual Studio Code
- Expo Go on your Android phone

Optional later:

- Android Studio

## 2. Clone the Repository

```powershell
git clone https://github.com/AlexandruBocanci/Traffiq.git
cd Traffiq
```

## 3. Bootstrap Local Dependencies

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_local.ps1
```

This script will:

- create `.venv` if missing
- install backend Python dependencies from `requirements.txt`
- install mobile dependencies inside `mobile/`
- check whether core local tools are available

## 4. Python Backend Dependencies

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

Install project packages:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Current core packages expected by the project:

- pandas
- psycopg
- fastapi
- uvicorn
- requests
- python-dotenv
- httpx

## 5. PostgreSQL Setup

PostgreSQL must be installed locally.

Create the project database:

```sql
CREATE DATABASE traffiq;
```

Run DDL from the repository root:

```powershell
psql -U postgres -d traffiq -f sql/ddl/create_all.sql
```

## 6. Environment Configuration

The project loads database configuration from a local `.env` file.

Create `.env` from the example file:

```powershell
Copy-Item .env.example .env
```

Expected variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Recommended values for local setup:

- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_NAME=traffiq`

The full secrets and config strategy is documented in:

- `docs/SECRETS_AND_CONFIG.md`

## 7. Running the Backend API

From the repository root:

```powershell
uvicorn src.api.main:app --reload --host 0.0.0.0
```

## 8. Running With Docker

Docker is the recommended deployable-style local runtime for the backend services.

It starts:

- PostgreSQL in a container
- FastAPI in a container
- the database schema automatically on first database initialization

Requirements:

- Docker Desktop

From the repository root, start the services:

```powershell
docker compose up --build
```

When the API container starts, it automatically seeds the full demo dataset required by the mobile app before starting FastAPI.

Docker service URLs:

- FastAPI: `http://localhost:8000`
- PostgreSQL from the host PC: `localhost:5433`
- PostgreSQL from inside Docker: `db:5432`

Docker database credentials:

- `DB_HOST=db`
- `DB_PORT=5432`
- `DB_NAME=traffiq`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`

The containerized PostgreSQL uses port `5433` on the host to avoid conflicts with a local PostgreSQL server already using `5432`.

To manually rerun only the core traffic-weather pipeline inside the API container:

```powershell
docker compose exec api python -m src.pipeline.run_pipeline
```

To manually reseed the full demo dataset required by the mobile app:

```powershell
docker compose exec api python -m src.pipeline.seed_demo_data
```

This command is normally not required after startup because the API container runs it automatically. It runs the traffic-weather pipeline and then loads the route, event, ride history, route summary, route hourly, and top congested segment demo data used by the mobile app.

To test the API:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/routes/report
Invoke-RestMethod http://localhost:8000/map/events
Invoke-RestMethod http://localhost:8000/rides/history
```

To stop the services:

```powershell
docker compose down
```

To stop the services and delete the Docker database volume:

```powershell
docker compose down -v
```

Use `docker compose down -v` only when you intentionally want to reset the containerized database.

## 9. Running the Mobile App

Go into the mobile workspace:

```powershell
cd mobile
npm.cmd start
```

Then:

- open Expo Go on your Android phone
- scan the QR code
- make sure the phone and the PC are on the same Wi-Fi network

## 10. Current Database Notes

- tutorial database `traffic_learning` is not the project database
- the real project database is `traffiq`
- all new project work must target `traffiq`

## 11. What Will Not Sync Through Git

Git does not sync:

- installed Node.js
- installed Expo Go
- installed PostgreSQL server
- local PostgreSQL databases
- Python packages installed globally
- environment variables
- passwords
- local secrets

That means a second device must always:

1. install the tools
2. clone the repo
3. run the bootstrap script or install backend/mobile dependencies manually
4. create the PostgreSQL database
5. run the SQL DDL scripts
6. create `.env` from `.env.example` and fill in local database credentials

## 12. Recommended Setup Workflow On a New Device

1. Clone the repo
2. Run `setup_local.ps1`
3. Create database `traffiq`
4. Run `sql/ddl/create_all.sql`
5. Create `.env` from `.env.example` and configure local database credentials
6. Start the API
7. Start the mobile app

## 13. Recommended Docker Workflow On a New Device

1. Install Docker Desktop
2. Clone the repo
3. Run:

```powershell
docker compose up --build
```

4. Test:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/reports/overview
```

## 14. Maintenance Rule

Whenever the project changes in a way that affects setup, update this file in the same branch before merging to `main`.

## 15. AWS Deployment Direction

The AWS-oriented deployment plan is documented in:

- `docs/AWS_DEPLOYMENT.md`

AWS cost guardrails are documented in:

- `docs/AWS_COST_GUARDRAILS.md`

Before creating cloud resources for Traffiq v3, configure the AWS Budget alert described in that file.

The current Traffiq v3 RDS PostgreSQL instance is documented in:

- `docs/AWS_RDS_POSTGRESQL.md`

The RDS schema application is documented in:

- `docs/AWS_RDS_SCHEMA.md`

The backend image pushed to Amazon ECR is documented in:

- `docs/AWS_ECR_BACKEND_IMAGE.md`

The FastAPI backend deployed to AWS App Runner is documented in:

- `docs/AWS_APP_RUNNER_BACKEND.md`

The mobile cloud API configuration is documented in:

- `docs/MOBILE_CLOUD_API_CONFIG.md`

The Cognito user pool for v3 authentication is documented in:

- `docs/AWS_COGNITO_USER_POOL.md`

That file explains how the current Docker backend can evolve toward:

- containerized FastAPI on AWS
- PostgreSQL on Amazon RDS
- authentication through Amazon Cognito
- scheduled ETL execution
- environment-based secrets and configuration

## 16. Environment Separation

The difference between local classic, local Docker, and future AWS deployment environments is documented in:

- `docs/ENVIRONMENTS.md`

Use that file when deciding which startup commands, database host, database port, and secrets strategy apply to the current runtime mode.

## 17. Scheduler Strategy

The recommended local, Docker, and AWS scheduling strategy is documented in:

- `docs/SCHEDULER_STRATEGY.md`

That file explains how pipeline runs can move from manual execution toward Windows Task Scheduler locally and EventBridge Scheduler plus ECS Fargate in AWS.

## 18. Deployable Cloud Workflow

The practical cloud workflow is documented in:

- `docs/CLOUD_WORKFLOW.md`

That file explains how the current Docker backend can move toward ECR, App Runner, RDS PostgreSQL, and scheduled ETL execution.

## 19. Secrets And Config Strategy

The local, Docker, and AWS secrets strategy is documented in:

- `docs/SECRETS_AND_CONFIG.md`

That file explains what belongs in `.env`, what belongs in Docker environment variables, what belongs in AWS environment variables or Secrets Manager, and what must never be committed to Git.

## 20. Architecture Walkthrough

The final v2 architecture walkthrough is documented in:

- `docs/ARCHITECTURE_WALKTHROUGH.md`

That file explains the full data flow from sources to ETL, PostgreSQL layers, FastAPI, mobile app, Docker, and AWS direction.

## 21. Recruiter And Demo Narrative

The final project presentation narrative is documented in:

- `docs/DEMO_NARRATIVE.md`

That file explains how to present the project, what to show first, which commands to run in a demo, and how to explain the project's limitations honestly.

## 22. Demo Flow

The exact demo flow is documented in:

- `docs/DEMO_FLOW.md`

That file explains what to start, what to validate, what screens to show, what API responses to open, and how to sequence the technical explanation.

## 23. v2 Recap And v3 Backlog

The final v2 recap is documented in:

- `docs/Traffiq_v2_recap.md`

The recommended v3 backlog is documented in:

- `docs/Traffiq_v3_backlog.md`
