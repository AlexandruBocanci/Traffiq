# TomTom Refresh On Use

## Purpose

Task 36D keeps real Suceava mobility snapshots current while the mobile app is
actively used. It does not implement continuous navigation traffic or
full-city real-time monitoring.

## Architecture

```text
React Native APK
  -> public AWS Lambda Function URL (POST only)
  -> DynamoDB conditional 15-minute global lock
  -> TomTom Flow (3 corridors) + TomTom Incidents + Open-Meteo
  -> protected FastAPI callback on AWS App Runner
  -> Amazon RDS Bronze / Silver / Gold / Serving
  -> GET /mobile/drive-overview
```

App Runner already uses a VPC connector to access private RDS. With the
intentional no-NAT low-cost architecture, App Runner cannot call public
TomTom/Open-Meteo endpoints directly. Lambda performs public extraction
outside the VPC; App Runner validates and loads the snapshot into RDS.

## Trigger Behavior

The mobile application invokes the public refresh URL:

- when the Drive screen first loads;
- when the app becomes active in the foreground;
- every 15 minutes while the app remains active.

Lambda permits only `POST`. A `GET` request returns `405` before attempting
the DynamoDB lock or an external API request.

## Global Cost Guard

DynamoDB table:

```text
traffiq-mobility-refresh-lock
billing mode -> PAY_PER_REQUEST
TTL attribute -> expires_at
```

The Lambda function uses a conditional update for the key
`tomtom_real_mobility_snapshot`. If a previous refresh began less than 15
minutes ago, the function returns:

```json
{"refreshed": false, "reason": "rate_limited"}
```

One allowed refresh uses:

```text
3 TomTom Flow requests + 1 TomTom Incidents request + 1 Open-Meteo request
```

Maximum designed daily volume:

```text
96 allowed refreshes/day
384 TomTom non-tile requests/day
96 Open-Meteo requests/day
```

Verified official allowances on `May 27, 2026`:

```text
TomTom non-tile free daily allowance -> 2,500 requests/day
Open-Meteo free non-commercial daily allowance -> 10,000 calls/day
```

The public Lambda URL can receive rate-limited invocations if discovered, but
the DynamoDB lock prevents those invocations from multiplying TomTom request
volume within the 15-minute window.

## Security

AWS SSM Parameter Store `SecureString` parameters:

```text
/traffiq/backend/db-password
/traffiq/mobility/tomtom-api-key
/traffiq/mobility/ingestion-token
```

Rules:

- the APK contains only the public Lambda refresh URL;
- the APK never contains `TOMTOM_API_KEY` or the ingestion token;
- Lambda reads only its TomTom key and ingestion token parameters through a
  narrowly scoped IAM role;
- App Runner receives only a SHA-256 verifier hash for the internal ingestion
  token and reads `DB_PASSWORD` through an SSM secret reference;
- `/internal/mobility/snapshot` is hidden from OpenAPI and rejects missing or
  invalid tokens.

During activation, the local AWS CLI was found to be using a root-user access
key. An IAM user named `traffiq-admin` was created and verified, and the root
access key was deactivated before new production-style resources were
activated.

## AWS Resources

```text
Lambda function -> traffiq-mobility-refresh
DynamoDB table -> traffiq-mobility-refresh-lock
App Runner runtime instance role -> traffiq-apprunner-instance-role
Lambda execution role -> traffiq-mobility-refresh-lambda-role
EAS preview public variable -> EXPO_PUBLIC_TRAFFIQ_MOBILITY_REFRESH_URL
```

## Validation

Validated on `May 27, 2026`:

```text
App Runner status -> RUNNING
ECR/App Runner digest -> sha256:a61e2a17fd0c1225a0730bf042cc9804ebb0c882d959978585fdbf1aaed45565
GET /health -> status=ok
POST /internal/mobility/snapshot without token -> 401
Lambda URL GET -> 405 method_not_allowed
Lambda URL first POST -> refreshed=true, pipeline run_id=9
Lambda URL immediate second POST -> refreshed=false, reason=rate_limited
GET /mobile/drive-overview -> traffic_source=tomtom, congested=3, weather=1
GET /pipeline/status -> run_id=9, status=success
npx.cmd tsc --noEmit -> passed
npx.cmd expo-doctor --verbose -> 18/18 checks passed
npx.cmd expo export --platform android --output-dir .expo-export-task36d -> passed
Android exported bundle -> 1.96 MB, 622 modules
```

Per the agreed release workflow, a rebuilt physical APK is not produced after
each task. The final installed-APK refresh regression test remains required
when the final APK is built after the remaining mobile tasks.

## Sources

- TomTom pricing: https://docs.tomtom.com/pricing
- Open-Meteo pricing: https://open-meteo.com/en/pricing
- AWS App Runner VPC access: https://docs.aws.amazon.com/apprunner/latest/dg/network-vpc.html
- AWS Lambda Function URLs: https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html
- AWS Systems Manager Parameter Store: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
