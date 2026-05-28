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

User ride history validation after Task 24:

```text
App Runner status -> RUNNING
Backend ECR digest -> sha256:33b830a5ba20e3f8582875d30a06ecb9982c5c69b652471cf90e711f62528fd7
GET /health -> status=ok
GET /rides/history without token -> 401
GET /rides/history with real Cognito access token before insert -> count=0
POST /rides/history with real Cognito access token -> created=True
GET /rides/history with real Cognito access token after insert -> count=1
temporary ride history cleanup rows remaining -> 0
GET /mobile/drive-overview -> rides=0
```

The validation used a temporary Cognito user and cleaned it up after the test.

User preferences validation after Task 25:

```text
App Runner status -> RUNNING
Backend ECR digest -> sha256:9aecf3fb15529ee4654f266936569d43599471c4b4453d4cc6b6d3f5bd5beb91
GET /health -> status=ok
GET /preferences without token -> 401
GET /preferences with real Cognito access token -> distance_unit=km, preferred_route_type=balanced, theme_mode=system
PUT /preferences with real Cognito access token -> updated=True, distance_unit=mi, preferred_route_type=less_congested, theme_mode=dark
GET /preferences after update -> distance_unit=mi, preferred_route_type=less_congested, theme_mode=dark
temporary preferences cleanup -> deleted
temporary Cognito user cleanup -> deleted
```

The validation used a temporary Cognito user and cleaned it up after the test.

Pipeline status validation after Task 26:

```text
App Runner status -> RUNNING
Backend ECR digest -> sha256:d3ae9c92395cfeb4dab1e57494a6558f8df8002fda85ab98aa00295610071865
GET /health -> status=ok
GET /pipeline/status -> run_id=4, pipeline_name=events_pipeline, status=success, records_extracted=5, records_loaded=10, checks=1
```

The endpoint is read-only. It reads ETL metadata from RDS and does not run or reset the pipeline.

Iulius Mall Suceava routing coordinate correction after v3:

```text
App Runner status -> RUNNING
Backend ECR digest -> sha256:018af3a16c840f273ddbe12c2a459a3b7959b0aa5cb2c28fb643b96cbd62e1b9
POST /routes/preview with Current location coordinates to Iulius Mall Suceava -> 200
destination.latitude -> 47.6592
destination.longitude -> 26.2698
provider -> local_suceava_fallback
```

The corrected Iulius Mall coordinate was aligned between backend and mobile fallback routing.

## What This Enables

The Traffiq backend is now reachable through a public AWS URL.

This enables:

- mobile app cloud API configuration
- public demo without local FastAPI
- App Runner to RDS integration
- ETL-loaded Suceava data served from the cloud database

## Task 36C Real Mobility Deployment Validation

On `May 27, 2026`, App Runner was deployed with the backend that serves the
real TomTom mobility snapshot loaded in RDS.

```text
Backend ECR digest -> sha256:5f8426c9bd906f9597f87fb53d200eda7a889a9f04e0c709e981eaef819a39d0
App Runner status -> RUNNING
GET /health -> status=ok
GET /mobile/drive-overview -> traffic_source=tomtom, traffic_rows=3, events_rows=5, weather_rows=1, routes_rows=0, rides_rows=0
GET /reports/overview -> route_highlights=0, report_segments=3
GET /routes/report -> count=0
GET /rides/history without token -> 401
GET /pipeline/status -> pipeline_name=tomtom_real_mobility_snapshot, status=success
```

App Runner reads already-ingested data from RDS and does not contain the
TomTom API key. Task 36D keeps public extraction in AWS Lambda because the
VPC connector has no NAT Gateway for public API egress.

## Task 36D Secure Refresh Callback Deployment

On `May 27, 2026`, App Runner was deployed with a protected internal ingestion
callback for the Lambda refresh worker:

```text
Backend ECR digest -> sha256:a61e2a17fd0c1225a0730bf042cc9804ebb0c882d959978585fdbf1aaed45565
App Runner status -> RUNNING
DB_PASSWORD runtime configuration -> SSM SecureString reference
MOBILITY_INGESTION_TOKEN_SHA256 -> non-secret runtime verifier hash
POST /internal/mobility/snapshot without token -> 401
GET /mobile/drive-overview after Lambda ingestion -> traffic_source=tomtom
GET /pipeline/status -> run_id=9, status=success
```

The callback receives normalized source snapshots only from the authorized
Lambda worker, then reuses the same Bronze/Silver/Gold load path as manual
ingestion. The raw TomTom key remains in Lambda-accessible SSM configuration
and never enters App Runner or the mobile APK.

## Task 36E Traffic Profile API Deployment

On `May 28, 2026`, App Runner was deployed with the mobile traffic profile API:

```text
Backend ECR digest -> sha256:c356d877279ebc05acbc1eb9c3a76a726c408724d23c5e9a0d90d98784f6a23a
App Runner status -> RUNNING
GET /health -> status=ok
GET /mobile/traffic-profile -> rows=168
traffic_scope -> Three monitored Suceava corridors
observed_rows -> 2 at validation time
GET /mobile/drive-overview -> traffic_source=tomtom, congested=3, weather=1, events=5, rides=0
```

The endpoint reads baseline hourly profile rows from Gold and overlays observed
TomTom averages from `silver.tomtom_flow_observations`. It does not claim
full-city traffic coverage and does not expose fake historical TomTom data.

## Task 36G1 Expanded Route Location Deployment

On `May 28, 2026`, App Runner was deployed with the expanded Suceava route
location catalog:

```text
Backend ECR digest -> sha256:fb2f529b60e8880b10e5190d6ff100cfce1e63086c7d4755aebe9b013048f45d
App Runner status -> RUNNING
GET /health -> status=ok
POST /routes/preview City Center -> aero -> destination=Suceava Airport
GET /mobile/drive-overview -> traffic_source=tomtom, congested=3, rides=0
```

The backend now resolves the same expanded route aliases used by the mobile
search catalog for common Suceava destinations, transport points, institutions,
districts, and streets.

## Task 36G Polish And Delete Actions Deployment

On `May 28, 2026`, App Runner was deployed with protected personal delete
actions and Romanian route-name formatting:

```text
Backend ECR digest -> sha256:6ea9a28a76ad6ca45b186a82b23e7c46db8f6ae86c325809bab2888aa128a391
App Runner status -> RUNNING
GET /health -> status=ok
DELETE /rides/history/1 without token -> 401
DELETE /saved-routes/1 without token -> 401
POST /routes/preview City Center -> Iulius Mall Suceava -> 200
```

The new ride-history delete endpoint is protected by Cognito JWT validation and
filters deletes by `cognito_user_sub`, so users can only delete their own ride
history records.

## Task 36H Mobile Timestamp Display Fix Deployment

On `May 28, 2026`, App Runner was redeployed with explicit UTC timestamp
serialization for mobile traffic freshness:

```text
Backend ECR digest -> sha256:2b0ab5abfd7954e3350a9600a4825503d4ae2f6d6695db100b2dba8112c642a0
App Runner status -> RUNNING
GET /health -> status=ok
GET /mobile/drive-overview -> traffic_source=tomtom
traffic_observed_at -> 2026-05-28T14:15:24.669039Z
first_congested_hour -> 17
GET /mobile/traffic-profile -> rows=168
generated_at -> Europe/Bucharest timestamp
```

The root cause was that TomTom ingestion stores UTC timestamps as PostgreSQL
`TIMESTAMP` values without timezone. The API previously serialized those values
without an explicit timezone marker, so the mobile app displayed them as local
clock time and appeared three hours stale. The API now returns UTC timestamps
with `Z`, allowing the phone to convert them correctly to local time.

Follow-up deployment in the same task:

```text
Backend ECR digest -> sha256:3a5a54f12977223755e1135a6ac8c2df502e600099650b54e0b6976a2600eab2
App Runner status -> RUNNING
GET /health -> status=ok
GET /pipeline/status -> started_at=2026-05-28T17:14:32Z
GET /pipeline/status -> finished_at=2026-05-28T17:14:33Z
GET /mobile/drive-overview -> traffic_observed_at=2026-05-28T17:14:32.154006Z
GET /mobile/drive-overview -> first_congested_hour=20
```

This follow-up applies the same explicit UTC serialization to
`GET /pipeline/status`, which is the endpoint used by Account -> Pipeline.

## What Is Not Done Yet

Remaining later work:

- scheduled ETL execution
- Admin / Pipeline mobile screen
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
