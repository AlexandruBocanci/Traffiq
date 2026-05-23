# Secrets And Config Strategy

## Purpose

This document defines how Traffiq handles configuration and secrets across local development, Docker, and future AWS deployment.

The goal is simple:

```text
code stays portable
secrets stay out of Git
each environment injects its own values
```

## What Counts As Configuration

Configuration is any value that changes by environment but is not necessarily secret.

Examples:

- database host
- database name
- database port
- public API base URL for the mobile app
- Cognito user pool ID
- Cognito app client ID
- runtime mode

## What Counts As A Secret

Secrets are values that must not be committed to Git.

Examples:

- database passwords
- AWS access keys
- API keys
- service tokens
- production connection strings
- private certificates

## Current Backend Configuration

The backend database configuration is centralized in:

- `src/config/settings.py`

The required variables are:

```text
DB_HOST
DB_NAME
DB_USER
DB_PASSWORD
DB_PORT
```

`settings.py` loads local values through:

```python
load_dotenv()
```

Then it builds:

```python
DB_CONFIG
```

If a required variable is missing, the backend now fails early with a clear error instead of failing later during database connection.

## Weather Source Configuration

The Open-Meteo weather source uses non-secret Suceava configuration:

```text
WEATHER_LOCATION_NAME=Suceava
WEATHER_LATITUDE=47.6514
WEATHER_LONGITUDE=26.2556
WEATHER_TIMEZONE=Europe/Bucharest
```

These values are configuration, not secrets. They are centralized in
`src/config/settings.py` and committed as safe defaults in `.env.example`.

The explicit timezone is required because the current traffic-weather
enrichment matches observations using local hour-of-day buckets. v3 must keep
the weather location set to Suceava.

Task 21 implementation and RDS/API validation are documented in:

- `docs/OPEN_METEO_WEATHER_INGESTION.md`

## Local Classic Strategy

Local Windows development uses:

- `.env` for real local values
- `.env.example` as the committed template
- `python-dotenv` to load values into Python

`.env` must contain real local values:

```text
DB_HOST=localhost
DB_NAME=traffiq
DB_USER=postgres
DB_PASSWORD=<local-postgres-password>
DB_PORT=5432
```

`.env` is ignored by Git.

`.env.example` is committed because it contains only placeholder values.

## Local Docker Strategy

Docker uses service-level environment variables in:

- `docker-compose.yml`

Current local Docker values:

```text
DB_HOST=db
DB_NAME=traffiq
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
```

These values are acceptable for local Docker only because the database exists inside the local Docker network.

Do not reuse the Docker demo password for AWS.

## AWS Strategy

AWS should not use `.env`.

AWS should inject values through one of:

- App Runner environment variables for a simple first deployment
- AWS Secrets Manager for stronger production-style secret handling

Recommended first portfolio deployment:

```text
App Runner environment variables for non-secret config
AWS Secrets Manager or App Runner secret references for DB_PASSWORD
```

Expected AWS values:

```text
DB_HOST=traffiq-db.cni4ck0o40p5.eu-central-1.rds.amazonaws.com
DB_NAME=traffiq
DB_USER=traffiq_admin
DB_PASSWORD=<managed-secret>
DB_PORT=5432
```

Current non-secret RDS details are documented in:

- `docs/AWS_RDS_POSTGRESQL.md`

## Mobile API URL Strategy

The mobile app API base URL is configuration, not a secret.

Current file:

- `mobile/src/config/api.ts`

Current behavior:

- default API URL uses the AWS App Runner backend
- local development can override the API URL with `EXPO_PUBLIC_TRAFFIQ_API_BASE_URL`

Future cloud behavior:

```text
local mobile build -> local PC or Docker API URL
cloud/demo mobile build -> public App Runner API URL
```

The public API URL can be committed if it is truly public. API keys, private tokens, and database credentials must not be committed.

Current mobile cloud API configuration is documented in:

- `docs/MOBILE_CLOUD_API_CONFIG.md`

## Cognito Configuration Strategy

Cognito identifiers are configuration, not secrets.

Current values:

```text
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_QLCNGVSM1
COGNITO_APP_CLIENT_ID=6vp5r1edjn8phjhfm2jk1f4dcp
COGNITO_CALLBACK_URL=traffiq://auth
```

These values can be used by the mobile app in Task 11 and by the backend JWT validation logic in Task 12.

Do not commit:

- AWS access keys
- database passwords
- Cognito client secrets

The Traffiq mobile app should use a public Cognito app client without a client secret.

The current Cognito setup is documented in:

- `docs/AWS_COGNITO_USER_POOL.md`

The mobile Cognito authentication implementation is documented in:

- `docs/MOBILE_COGNITO_AUTH.md`

The backend Cognito JWT validation implementation is documented in:

- `docs/BACKEND_COGNITO_JWT_VALIDATION.md`

The personal feature protection rule is documented in:

- `docs/PERSONAL_FEATURE_PROTECTION.md`

Mobile token storage uses:

```text
expo-secure-store
```

Cognito tokens must not be logged or committed. They are runtime credentials for the signed-in user.

Cognito JWKS keys are public verification keys and are not secrets.

## Git Rules

These files must never be committed:

```text
.env
.env.*
```

Exception:

```text
.env.example
```

The current `.gitignore` enforces this rule.

Do not commit:

- real database passwords
- AWS access keys
- RDS connection strings containing passwords
- third-party API keys
- generated private keys
- local machine-specific secrets

## Rotation Rule

If a secret is accidentally committed:

1. consider it leaked
2. rotate the secret immediately
3. remove it from the repository history if necessary
4. update `.env.example` only with placeholders

Deleting the value from the latest commit is not enough if the secret exists in Git history.

## Validation Commands

Validate that required backend config can be loaded:

```powershell
$env:PYTHONPATH='.'; .\.venv\Scripts\python.exe -c "from src.config.settings import DB_CONFIG; print(DB_CONFIG['host'], DB_CONFIG['dbname'], DB_CONFIG['port'])"
```

Validate Docker runtime config:

```powershell
docker compose config
```

Validate ignored local secrets:

```powershell
git status --short
```

Expected result:

```text
.env does not appear in git status.
```

## Recruiter Explanation

The concise explanation is:

```text
Traffiq does not hardcode database credentials in Python code. Local development uses a Git-ignored .env file, Docker injects local service variables through docker-compose.yml, and the AWS deployment direction uses App Runner environment variables or AWS Secrets Manager for RDS credentials.
```

This shows the project follows the same configuration pattern used in real backend and data engineering systems.
