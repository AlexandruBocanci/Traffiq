# Final Demo Checklist

## Purpose

Use this checklist before a license presentation, portfolio walkthrough, or recruiter demo.

The goal is to prepare Traffiq without guessing commands or opening many separate documents.

## 1. Pre-Demo Startup Checklist

### Cloud Backend

Validate the public App Runner backend:

```powershell
Invoke-RestMethod https://eguwdq6puz.eu-central-1.awsapprunner.com/health
```

Expected:

```text
status: ok
```

Validate the mobile-shaped public response:

```powershell
Invoke-RestMethod https://eguwdq6puz.eu-central-1.awsapprunner.com/mobile/drive-overview
```

Expected:

- `routes` contains Suceava route records
- `events` contains geolocated Suceava alert records
- `congested` contains top congested segment records
- `weather` contains Open-Meteo-backed weather impact records
- `rides` is an empty public list because ride history is personal data

Validate report data:

```powershell
Invoke-RestMethod https://eguwdq6puz.eu-central-1.awsapprunner.com/reports/overview
```

Expected:

- report response is available
- no personal ride history fields are exposed

### Mobile App

Preferred final demo mode:

- install the Android APK by following `docs/ANDROID_APK_DEMO_BUILD.md`
- open `Traffiq` directly from the Android launcher
- stop any PC-hosted Expo development server before the demonstration

Expected:

- app opens without Expo Go
- app works without `npx expo start` or the development PC
- app calls the public App Runner API by default

Development-only fallback from the `mobile/` workspace:

```powershell
npx.cmd expo start
```

Expected:

- Expo starts without bundling errors
- phone can open the app through Expo Go
- app calls the public App Runner API by default

If testing a local backend instead of cloud, set the override before starting Expo:

```powershell
$env:EXPO_PUBLIC_TRAFFIQ_API_BASE_URL='http://<pc-lan-ip>:8000'
npx.cmd expo start
```

Use this override only for local fallback testing.

### Authentication

Before demo, confirm you can do at least one of these:

- use an existing Cognito test account
- create a new account
- confirm email
- login
- logout

Do not write passwords, tokens, or AWS credentials in Git, screenshots, slides, or chat.

## 2. Main Demo Checklist

### Mobile Product Flow

Show the Drive screen first.

Verify:

- weather impact card is visible
- compact Suceava map is visible
- mapped alert markers are visible when event data exists
- route planner opens from `Where to?`
- route preview calculates distance, ETA, and route geometry
- route polyline renders on the map
- destination marker renders on the map
- `Route preview ready` appears after calculation
- `Save route` is clear
- `Change route` is clear
- `End route` clears the selected route
- `Drive` opens the expanded map
- expanded map shows destination, ETA, and distance

Explain:

```text
The mobile app is the product-facing layer. It consumes data from FastAPI, which reads from PostgreSQL serving views backed by the ETL pipeline.
```

### Personal Feature Flow

As guest:

- open History
- verify login prompt appears
- open Account
- verify personal saved routes/preferences require login

As authenticated user:

- calculate a route
- save route
- verify `Save route` becomes `Route saved`
- start drive
- verify ride appears in History
- verify saved route appears in Account
- verify preferences can be read/updated

Explain:

```text
Public traffic intelligence data is available to guests. Personal data is protected by Cognito JWT validation in FastAPI.
```

### API Flow

Open:

```text
https://eguwdq6puz.eu-central-1.awsapprunner.com/mobile/drive-overview
```

Explain:

```text
This endpoint is backend-for-frontend style. It shapes routes, alerts, congestion, weather, and public mobile data into one response for the Drive screen.
```

Open:

```text
https://eguwdq6puz.eu-central-1.awsapprunner.com/pipeline/status
```

Explain:

```text
Pipeline status comes from ETL metadata tables. It shows observability, not only final data.
```

### Data Engineering Flow

Show these files:

- `src/pipeline/run_pipeline.py`
- `src/pipeline/seed_demo_data.py`
- `src/extract/`
- `src/transform/`
- `src/load/`
- `sql/ddl/create_all.sql`
- `sql/ddl/create_serving_views.sql`

Explain:

```text
The project follows a standard data pipeline shape: extract raw data, transform it into clean tables, load Bronze/Silver/Gold layers, expose Serving views, and serve them through FastAPI.
```

### Cloud Architecture Flow

Show:

- `docs/ARCHITECTURE_WALKTHROUGH.md`
- `docs/CLOUD_WORKFLOW.md`
- `docs/AWS_APP_RUNNER_BACKEND.md`
- `docs/AWS_RDS_POSTGRESQL.md`
- `docs/AWS_COGNITO_USER_POOL.md`
- `docs/SECRETS_AND_CONFIG.md`

Explain:

```text
ECR stores the backend image, App Runner runs FastAPI, RDS stores PostgreSQL analytical layers, and Cognito handles authentication for personal features.
```

## 3. Fallback Checklist

### If Public App Runner API Is Down

Try:

```powershell
Invoke-RestMethod https://eguwdq6puz.eu-central-1.awsapprunner.com/health
```

If unavailable:

1. Check whether App Runner service is paused.
2. Resume App Runner from AWS Console or AWS CLI.
3. Wait for service status to become running.
4. Re-test `/health`.

If cloud still fails, use local Docker fallback.

### Local Docker Fallback

From repository root:

```powershell
docker compose up --build -d
```

Validate:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/mobile/drive-overview
```

Start Expo with local backend override for a physical phone:

```powershell
$env:EXPO_PUBLIC_TRAFFIQ_API_BASE_URL='http://<pc-lan-ip>:8000'
npx.cmd expo start
```

Phone and PC must be on the same Wi-Fi network only for this local backend fallback.

### If Route Provider Fails

Expected behavior:

- backend tries OSRM first
- backend can return local Suceava fallback route
- mobile can still show route distance, ETA, and geometry

Explain:

```text
The app is resilient for demo purposes. It does not require paid traffic APIs or NAT Gateway to keep the route preview usable.
```

### If Cognito Login Fails

Fallback:

- continue demo as guest
- show public Drive, map, route preview, alerts, weather, API, and pipeline status
- explain that personal features require Cognito and are intentionally protected

Do not bypass auth or expose protected data publicly.

## 4. Cost Shutdown Checklist

After the demo, reduce AWS cost risk.

### App Runner

Pause App Runner when not testing or presenting.

AWS Console path:

```text
AWS Console -> App Runner -> Services -> traffiq-api -> Actions -> Pause
```

AWS CLI shape:

```powershell
aws apprunner pause-service --service-arn <app-runner-service-arn>
```

### RDS

Stop RDS when not testing or presenting.

AWS Console path:

```text
AWS Console -> RDS -> Databases -> traffiq-db -> Actions -> Stop temporarily
```

AWS CLI shape:

```powershell
aws rds stop-db-instance --db-instance-identifier traffiq-db
```

Important:

```text
AWS can automatically restart a stopped RDS instance after 7 consecutive days.
```

### ECR

Keep only required backend images.

AWS Console path:

```text
AWS Console -> ECR -> Repositories -> traffiq-api -> Images
```

Delete old unused image tags when they are no longer needed.

### Cognito

Cognito can remain configured for the demo. Do not enable paid SMS or advanced enterprise features.

### Billing Check

After shutdown:

```text
AWS Console -> Billing and Cost Management -> Bills
AWS Console -> Billing and Cost Management -> Budgets
```

Expected:

- AWS Budget is active
- App Runner is paused when not used
- RDS is stopped when not used
- no unexpected EC2, ECS, EKS, NAT Gateway, or load balancer resources exist

## 5. Final Presentation Reminder

Use this positioning:

```text
Traffiq is a Data Engineering project that powers a traffic intelligence mobile interface for Suceava. It demonstrates ingestion, transformation, PostgreSQL analytical modeling, Serving views, FastAPI delivery, mobile consumption, cloud deployment, authentication, and operational documentation.
```

Do not position Traffiq as:

- a Waze clone
- real-time city-wide traffic monitoring
- multi-city production navigation
- paid traffic API integration
- 24/7 enterprise infrastructure
