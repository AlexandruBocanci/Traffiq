# AWS ECR Backend Image

## Purpose

This document records the Traffiq v3 backend Docker image push to Amazon ECR.

The goal of this task is to make the FastAPI backend image available to AWS services, especially AWS App Runner.

## ECR Repository

Repository details:

| Setting | Value |
| --- | --- |
| AWS account | `896080425393` |
| AWS region | `eu-central-1` |
| Repository name | `traffiq-api` |
| Repository URI | `896080425393.dkr.ecr.eu-central-1.amazonaws.com/traffiq-api` |
| Image tag | `latest` |
| Encryption | `AES256` |
| Scan on push | `enabled` |

## Image Details

Pushed image:

```text
896080425393.dkr.ecr.eu-central-1.amazonaws.com/traffiq-api:latest
```

Digest:

```text
sha256:018af3a16c840f273ddbe12c2a459a3b7959b0aa5cb2c28fb643b96cbd62e1b9
```

Image status:

```text
ACTIVE
```

Approximate pushed image size:

```text
110,576,169 bytes
```

## Commands Used

Repository creation:

```powershell
aws ecr create-repository --repository-name traffiq-api --region eu-central-1 --image-scanning-configuration scanOnPush=true --encryption-configuration encryptionType=AES256
```

Docker login to ECR:

```powershell
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 896080425393.dkr.ecr.eu-central-1.amazonaws.com
```

Local image build:

```powershell
docker build -t traffiq-api .
```

Image tag:

```powershell
docker tag traffiq-api:latest 896080425393.dkr.ecr.eu-central-1.amazonaws.com/traffiq-api:latest
```

Image push:

```powershell
docker push 896080425393.dkr.ecr.eu-central-1.amazonaws.com/traffiq-api:latest
```

Image verification:

```powershell
aws ecr describe-images --repository-name traffiq-api --region eu-central-1 --image-ids imageTag=latest --output json
```

## Validation Result

The image was pushed successfully.

Validated result:

```text
repositoryName: traffiq-api
imageTag: latest
imageDigest: sha256:018af3a16c840f273ddbe12c2a459a3b7959b0aa5cb2c28fb643b96cbd62e1b9
imageStatus: ACTIVE
```

Latest image update:

```text
May 27, 2026 - Task 36C TomTom real mobility serving backend
```

Current Task 36C digest:

```text
sha256:5f8426c9bd906f9597f87fb53d200eda7a889a9f04e0c709e981eaef819a39d0
```

Before the Task 36C image was built, `.dockerignore` was verified to exclude
`.env` and `.env.*`. The image therefore does not package the local TomTom
key or RDS password.

Latest Task 36D secure callback image:

```text
May 27, 2026 - refresh-on-use protected ingestion callback backend
sha256:a61e2a17fd0c1225a0730bf042cc9804ebb0c882d959978585fdbf1aaed45565
```

This image adds the token-verified internal mobility snapshot endpoint. App
Runner uses an SSM `SecureString` reference for `DB_PASSWORD`; no secret was
packaged in the container image.

Latest Task 36E traffic profile image:

```text
May 28, 2026 - mobile hourly traffic profile backend
sha256:c356d877279ebc05acbc1eb9c3a76a726c408724d23c5e9a0d90d98784f6a23a
```

This image adds `GET /mobile/traffic-profile`. The Docker context still
excludes `.env` and `.env.*`, so no RDS password, TomTom key, or AWS
credential is packaged in the image.

## What This Enables

This prepares Task 8:

```text
Deploy FastAPI backend to AWS App Runner
```

App Runner can now use the ECR image as the backend container source.

## Important Production Note

The current Dockerfile starts:

```text
python -m src.api.start_server
```

That local command seeds demo data before starting FastAPI.

For the AWS App Runner service, the preferred cloud startup command should be:

```text
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

This keeps API startup separate from database seeding and ETL execution.

The cloud runtime command choice is handled in Task 8.

## Cost Guardrails

ECR cost rules:

- keep only required image tags
- delete old unused tags after successful deployments
- do not store mobile artifacts in ECR
- keep only the backend image repository for v3

Cost guardrails are documented in:

- `docs/AWS_COST_GUARDRAILS.md`
