# Deployable Cloud Workflow

## Purpose

This document defines the practical cloud deployment workflow for Traffiq.

It does not mean the project is already deployed to AWS. It explains the exact sequence that turns the current Docker-based local backend into a deployable AWS setup.

The goal is to make the project understandable as a real data engineering system:

```text
containerized API
managed PostgreSQL database
scheduled ETL job
mobile client calling a public API URL
```

## Recommended First Cloud Version

For the first real AWS deployment, use:

- Amazon ECR for the Docker image
- AWS App Runner for the FastAPI backend
- Amazon RDS PostgreSQL for the database
- EventBridge Scheduler plus ECS Fargate for scheduled ETL later

This is the simplest professional path because App Runner can run the API container without managing servers, while RDS keeps PostgreSQL as a managed database.

Before creating any AWS resources, apply the project cost guardrails:

- `docs/AWS_COST_GUARDRAILS.md`

The budget alert and stop-resource checklist in that document are mandatory for the v3 cloud work.

The current RDS PostgreSQL database created for v3 is documented in:

- `docs/AWS_RDS_POSTGRESQL.md`

The RDS schema application is documented in:

- `docs/AWS_RDS_SCHEMA.md`

The backend image pushed to Amazon ECR is documented in:

- `docs/AWS_ECR_BACKEND_IMAGE.md`

The App Runner backend deployment is documented in:

- `docs/AWS_APP_RUNNER_BACKEND.md`

The mobile app cloud API configuration is documented in:

- `docs/MOBILE_CLOUD_API_CONFIG.md`

The Cognito user pool for authentication is documented in:

- `docs/AWS_COGNITO_USER_POOL.md`

The mobile Cognito authentication implementation is documented in:

- `docs/MOBILE_COGNITO_AUTH.md`

The backend Cognito JWT validation implementation is documented in:

- `docs/BACKEND_COGNITO_JWT_VALIDATION.md`

The personal feature protection rule is documented in:

- `docs/PERSONAL_FEATURE_PROTECTION.md`

## Deployment Flow

### 1. Validate Locally With Docker

Before cloud deployment, the Docker setup must work locally.

From the repository root:

```powershell
docker compose up --build -d
```

Validate the API:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/mobile/drive-overview
```

Expected result:

```text
API returns status ok.
Mobile drive overview returns route, event, ride, congestion, and weather data.
```

### 2. Build The Backend Image

Build the API Docker image locally:

```powershell
docker build -t traffiq-api .
```

This image contains the FastAPI backend and the Python pipeline code.

### 3. Create An ECR Repository

Create a container registry in AWS:

```powershell
aws ecr create-repository --repository-name traffiq-api
```

ECR stores the Docker image so AWS services can run it.

### 4. Push The Image To ECR

Authenticate Docker to ECR:

```powershell
aws ecr get-login-password --region <aws-region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com
```

Tag the image:

```powershell
docker tag traffiq-api:latest <aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com/traffiq-api:latest
```

Push the image:

```powershell
docker push <aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com/traffiq-api:latest
```

### 5. Create The RDS PostgreSQL Database

Create an Amazon RDS PostgreSQL database named:

```text
traffiq
```

Required database environment values:

```text
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=traffiq
DB_USER=<rds-user>
DB_PASSWORD=<rds-password>
```

In AWS, these values should come from App Runner environment variables or AWS Secrets Manager. They should not be written into Git.

The full secrets and config strategy is documented in:

- `docs/SECRETS_AND_CONFIG.md`

The final architecture walkthrough is documented in:

- `docs/ARCHITECTURE_WALKTHROUGH.md`

### 6. Initialize The Database Schema

Run the DDL against RDS:

```powershell
psql -h <rds-endpoint> -U <rds-user> -d traffiq -f sql/ddl/create_all.sql
```

This creates:

- Bronze tables
- Silver tables
- Gold tables
- Serving views
- ETL metadata tables
- endpoint-supporting indexes

### 7. Deploy The FastAPI Service

Deploy the pushed ECR image with AWS App Runner.

Recommended API command for a real cloud service:

```text
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

Important:

The local Docker demo currently uses:

```text
python -m src.api.start_server
```

That command seeds demo data before API startup. It is useful locally, but a real cloud API should not reload demo data every time the API container restarts.

For cloud, keep these separate:

```text
API startup
DDL / migration
pipeline execution
optional demo seed
```

### 8. Run The Pipeline Against RDS

After the API and RDS database are configured, run the pipeline once against the cloud database.

The pipeline command is:

```powershell
python -m src.pipeline.run_pipeline
```

For a demo environment that needs the full mobile dataset:

```powershell
python -m src.pipeline.seed_demo_data
```

The important part is that the runtime environment must point to the RDS database through:

```text
DB_HOST=<rds-endpoint>
```

### 9. Add Scheduled ETL Later

The production-style scheduler target is:

```text
EventBridge Scheduler -> ECS Fargate task -> python -m src.pipeline.run_pipeline -> RDS PostgreSQL
```

The scheduler should run the ETL job separately from the API service.

The scheduling strategy is documented in:

- `docs/SCHEDULER_STRATEGY.md`

### 10. Configure The Mobile App

For local development, the mobile app calls the PC backend IP.

For cloud deployment, the mobile app should call the public App Runner URL:

```text
https://<app-runner-service-url>
```

The future production improvement is to move the mobile API base URL into an environment-specific config instead of editing it manually.

### 11. Validate The Cloud Setup

After deployment, validate these endpoints:

```powershell
Invoke-RestMethod https://<public-api-url>/health
Invoke-RestMethod https://<public-api-url>/mobile/drive-overview
Invoke-RestMethod https://<public-api-url>/reports/overview
```

Expected result:

- `/health` returns `ok`
- `/mobile/drive-overview` returns backend-shaped mobile data
- `/reports/overview` returns analytical report data

Validate pipeline metadata directly in PostgreSQL:

```powershell
psql -h <rds-endpoint> -U <rds-user> -d traffiq -c "SELECT run_id, pipeline_name, status, records_extracted, records_loaded FROM etl_meta.pipeline_runs ORDER BY run_id DESC LIMIT 5;"
```

Expected result:

- recent pipeline runs are visible
- successful runs have `status = success`
- record counters are populated

### 12. Create Cognito Authentication

Create a Cognito User Pool for email/password authentication.

Traffiq v3 uses Cognito for:

- registration
- login
- logout
- email verification
- password reset
- JWT token issuing

Created user pool:

```text
eu-central-1_QLCNGVSM1
```

Created mobile app client:

```text
traffiq-mobile
6vp5r1edjn8phjhfm2jk1f4dcp
```

The Cognito setup does not protect API routes by itself. FastAPI JWT validation is added in a later task.

### 13. Add Mobile Auth Screens

The Expo mobile app connects to Cognito for:

- register
- confirm email
- login
- forgot password
- reset password
- logout

The mobile app stores Cognito tokens with Expo Secure Store.

This makes the mobile app aware of authentication state, but it does not protect backend endpoints yet.

### 14. Add Backend JWT Validation

FastAPI validates Cognito access tokens through:

```text
GET /auth/me
```

The backend verifies:

- token signature
- issuer
- token expiry
- token type `access`
- Cognito app client ID

Because App Runner uses a VPC Connector for RDS and Traffiq avoids NAT Gateway for cost control, the public Cognito JWKS keys are bundled in the backend image.

This keeps JWT validation working in AWS without adding expensive networking.

### 15. Protect Personal Features Only

Protect personal endpoints with Cognito while keeping public endpoints open.

Current protected endpoint:

```text
GET /rides/history
```

Current public endpoint behavior:

```text
GET /mobile/drive-overview -> public
GET /mobile/drive-overview rides -> []
```

The mobile app shows a login prompt for History when the user is a guest.

## Common Failure Points

- RDS security group does not allow access from the API service
- `DB_HOST` still points to `localhost` instead of the RDS endpoint
- database schema was not initialized before API validation
- App Runner environment variables are missing
- API startup uses local demo seeding when it should use normal FastAPI startup
- mobile app still points to a local LAN IP instead of the public API URL
- Cognito app client ID is missing from the mobile auth configuration
- protected endpoints are expected before backend JWT validation exists
- Expo deep link scheme does not match the Cognito callback URL
- App Runner cannot fetch Cognito JWKS at runtime without outbound internet
- public mobile overview accidentally exposing personal ride history

## Final Cloud Story

The professional explanation is:

```text
Traffiq is built locally with Docker, FastAPI, PostgreSQL, and Expo, and v3 moves the runtime toward AWS. The backend image is stored in ECR, served through App Runner, connected to RDS PostgreSQL, and integrated with Cognito for mobile authentication and backend JWT validation. Public traffic endpoints remain open, while ride history is protected as a personal feature. Scheduled ETL and full per-user data modeling remain later cloud steps.
```

This shows that the project is not only a local demo. It has a realistic path toward a deployable data product.
