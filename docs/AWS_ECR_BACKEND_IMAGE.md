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
sha256:1ce14840d4d88db81d5c953a1754f2638870f181634bce9ab1c1297e02a691e6
```

Image status:

```text
ACTIVE
```

Approximate pushed image size:

```text
110,531,199 bytes
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
imageDigest: sha256:1ce14840d4d88db81d5c953a1754f2638870f181634bce9ab1c1297e02a691e6
imageStatus: ACTIVE
```

Latest image update:

```text
May 23, 2026 - Task 23 saved routes API support
```

Previous Task 22 digest:

```text
sha256:879bea5b41c4cd8b2da5b895fce54d642060108089f27bafbc0d565381b63ecf
```

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
