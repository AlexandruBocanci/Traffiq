# AWS App Runner Backend

## Purpose

This document records the Traffiq v3 FastAPI deployment to AWS App Runner.

The goal of this task is to expose the backend through a public AWS URL while connecting it to the RDS PostgreSQL database.

## What App Runner Is

AWS App Runner is a managed container application service.

For Traffiq, it does this:

```text
Amazon ECR Docker image -> AWS App Runner -> public FastAPI URL
```

It removes the need to manage EC2 servers, load balancers, or Kubernetes for the first portfolio deployment.

## Service Details

| Setting | Value |
| --- | --- |
| Service name | `traffiq-api` |
| Region | `eu-central-1` |
| Service ARN | `arn:aws:apprunner:eu-central-1:896080425393:service/traffiq-api/208a5eb8eef841db96e48f2f40bf39af` |
| Public URL | `https://eguwdq6puz.eu-central-1.awsapprunner.com` |
| Source image | `896080425393.dkr.ecr.eu-central-1.amazonaws.com/traffiq-api:latest` |
| Container port | `8000` |
| CPU | `0.25 vCPU` |
| Memory | `0.5 GB` |
| Auto deployments | `disabled` |
| Health check path | `/health` |
| Status | `RUNNING` |

## Runtime Command

The App Runner service uses this startup command:

```text
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

This is intentional.

The Dockerfile local command is:

```text
python -m src.api.start_server
```

That local command runs demo seeding before API startup. It is useful for Docker demos, but it is not appropriate for App Runner because cloud API startup should be separate from ETL and data seeding.

## Environment Variables

The App Runner service receives these environment variables:

```text
DB_HOST
DB_NAME
DB_USER
DB_PASSWORD
DB_PORT
```

The password is not committed to Git.

Security note:

During the first service creation, the AWS CLI response printed runtime environment variables. Because the DB password appeared in local command output, the RDS password was rotated immediately and App Runner was updated with the new value.

Validated after rotation:

```text
Local RDS connection test passed after password rotation.
App Runner update submitted without printing secrets.
```

## ECR Access Role

App Runner needs permission to pull the private image from ECR.

Created IAM role:

```text
AppRunnerECRAccessRole
```

Role ARN:

```text
arn:aws:iam::896080425393:role/AppRunnerECRAccessRole
```

Attached AWS managed policy:

```text
arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

Trust principal:

```text
build.apprunner.amazonaws.com
```

## RDS Network Access

App Runner connects to RDS through a VPC Connector.

Created App Runner security group:

```text
traffiq-apprunner-sg
sg-0f5baa593b75f27fa
```

Existing RDS security group:

```text
traffiq-rds-sg
sg-0150f4d273103ecb7
```

RDS inbound access now allows:

```text
PostgreSQL TCP 5432 from sg-0f5baa593b75f27fa
PostgreSQL TCP 5432 from project owner IP /32
```

This avoids opening PostgreSQL to:

```text
0.0.0.0/0
```

## VPC Connector

Created VPC Connector:

```text
traffiq-apprunner-vpc-connector
```

ARN:

```text
arn:aws:apprunner:eu-central-1:896080425393:vpcconnector/traffiq-apprunner-vpc-connector/1/9ab51be6c8ab4a448ac95515e6909463
```

Subnets:

```text
subnet-0a70847277925af1c
subnet-082fcd2990ae754da
subnet-029bfb75b84ac58cd
```

Security group:

```text
sg-0f5baa593b75f27fa
```

## Validation

Public health endpoint:

```powershell
Invoke-RestMethod -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/health'
```

Validated result:

```text
status: ok
```

Mobile overview endpoint:

```powershell
Invoke-RestMethod -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/mobile/drive-overview'
```

Validated result:

```text
routes: 5
events: 5
rides: 0
congested: 5
weather: 2
first route: Strada Marasesti to Strada Universitatii
```

The populated public result is expected after Task 20 because the Suceava ETL dataset is now loaded in RDS.

`rides: 0` is intentional because public endpoints do not expose personal ride data.

Protected auth validation endpoint:

```powershell
Invoke-RestMethod -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/auth/me'
```

Validated result without token:

```text
401
```

Validated result with a real Cognito access token:

```text
authenticated: True
token_use: access
```

Protected ride history endpoint:

```powershell
Invoke-RestMethod -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/rides/history'
```

Validated result without token:

```text
401
```

Validated result with a real Cognito access token:

```text
200
```

Public mobile overview remains accessible without token and does not expose ride history:

```text
GET /mobile/drive-overview -> 200
rides: []
```

Route preview endpoint after Task 16:

```powershell
Invoke-RestMethod -Method Post -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/routes/preview' -ContentType 'application/json' -Body '{"origin_name":"City Center","destination_name":"Iulius Mall Suceava"}'
```

Validated result:

```text
status: 200
provider: local_suceava_fallback
geometry.type: LineString
```

The fallback provider is expected in App Runner because the service uses a VPC Connector for RDS and the project intentionally avoids NAT Gateway cost. The mobile app attempts direct OSRM routing when the backend returns this fallback.

Current-location route preview validation after correction:

```text
POST /routes/preview with origin_name=Current location, origin_latitude, origin_longitude -> 200
origin.name: Current location
origin.latitude: request latitude
origin.longitude: request longitude
POST /routes/preview with origin_name=Current location and no coordinates -> 400
```

Cloud ETL and Suceava street validation after Task 20:

```text
RDS pipeline final run_id=2 -> success
POST /routes/preview with Calea Unirii to Strada Marasesti -> 200
GET /reports/overview -> Suceava analytics populated
GET /reports/overview -> no recent_rides and no ride_count
GET /rides/history without token -> 401
```

Backend image deployed for this validation:

```text
sha256:e81b6e530deae41bd866ade7e1f5ab4c95ce94d753be51dbefb94a01b8f04f76
```

Geolocated Suceava event alert validation after Task 22:

```text
App Runner status -> RUNNING
Backend ECR digest -> sha256:879bea5b41c4cd8b2da5b895fce54d642060108089f27bafbc0d565381b63ecf
GET /health -> status=ok
GET /map/events -> count=5, latitude/longitude populated
GET /mobile/drive-overview -> events=5 with coordinates, rides=0
GET /reports/overview -> event_count=5, no recent_rides field
GET /rides/history without token -> 401
```

These geolocated events are controlled Suceava alert examples, not live
incident reports.

Saved routes validation after Task 23:

```text
App Runner status -> RUNNING
Backend ECR digest -> sha256:1ce14840d4d88db81d5c953a1754f2638870f181634bce9ab1c1297e02a691e6
GET /health -> status=ok
GET /saved-routes without token -> 401
POST /saved-routes with real Cognito access token -> saved=True
GET /saved-routes with real Cognito access token -> count=1
DELETE /saved-routes/{id} with real Cognito access token -> deleted=True
GET /saved-routes after delete -> count=0
silver.saved_routes cloud validation leftovers -> 0
```

The validation used a temporary Cognito user and cleaned it up after the test.

## What This Enables

The Traffiq backend is now reachable through a public AWS URL.

This enables:

- mobile app cloud API configuration
- public demo without local FastAPI
- App Runner to RDS integration
- ETL-loaded Suceava data served from the cloud database

## What Is Not Done Yet

Remaining later work:

- scheduled ETL execution
- user-specific persisted personal feature modeling
- App Runner scaling or cost optimization beyond the current demo setup

## Cost Guardrails

App Runner can generate cost while running.

Rules:

- keep only one App Runner service for Traffiq
- use the smallest viable CPU/memory settings
- disable automatic deployments for now
- pause/delete the service when not needed for demo or testing
- monitor Billing and Cost Explorer

Cost guardrails are documented in:

- `docs/AWS_COST_GUARDRAILS.md`

## Official References

- Creating an App Runner service: https://docs.aws.amazon.com/apprunner/latest/dg/manage-create.html
- App Runner service from source image: https://docs.aws.amazon.com/apprunner/latest/dg/service-source-image.html
- App Runner VPC access: https://docs.aws.amazon.com/apprunner/latest/dg/network-vpc.html
