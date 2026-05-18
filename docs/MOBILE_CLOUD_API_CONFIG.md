# Mobile Cloud API Configuration

## Purpose

This document records how the Traffiq mobile app connects to the cloud backend in v3.

The goal of this task is to remove the mobile app dependency on a backend running on the developer PC.

## Cloud API URL

The public AWS App Runner backend URL is:

```text
https://eguwdq6puz.eu-central-1.awsapprunner.com
```

This URL is now the default API base URL used by the mobile app.

## Mobile Config File

The mobile API base URL is configured in:

```text
mobile/src/config/api.ts
```

Current behavior:

```text
default -> AWS App Runner public API URL
optional override -> EXPO_PUBLIC_TRAFFIQ_API_BASE_URL
```

This means the mobile app can call the deployed backend without requiring FastAPI to run locally on the PC.

## Why This Change Matters

Before this task, the mobile app derived a local backend URL from the Expo development host:

```text
phone -> PC LAN IP -> local FastAPI
```

That worked for local demos, but it was not a real cloud app flow.

After this task:

```text
phone -> AWS App Runner public API -> Amazon RDS PostgreSQL
```

This is the correct v3 direction.

## Local Development Override

Local development is still possible.

If the developer wants the mobile app to call a local backend, set:

```powershell
$env:EXPO_PUBLIC_TRAFFIQ_API_BASE_URL='http://localhost:8000'
npx.cmd expo start
```

For Expo Go on a physical phone calling a local backend, use the PC LAN IP:

```powershell
$env:EXPO_PUBLIC_TRAFFIQ_API_BASE_URL='http://<pc-lan-ip>:8000'
npx.cmd expo start
```

If the environment variable is not set, the app uses the cloud URL.

## Validation

TypeScript validation:

```powershell
npx.cmd tsc --noEmit
```

Validated result:

```text
TypeScript check passed.
```

Cloud health validation:

```powershell
Invoke-RestMethod -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/health'
```

Validated result:

```text
status: ok
```

Cloud mobile overview validation:

```powershell
Invoke-RestMethod -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/mobile/drive-overview'
```

Validated result:

```text
routes: []
events: []
rides: []
congested: []
weather: []
```

The empty lists are expected because RDS currently has schema objects but no loaded data.

## What Is Not Done Yet

This task does not load data into RDS.

That belongs to a later v3 task:

```text
Task 20. Update ETL pipeline for cloud database
```

Until data is loaded into RDS, the mobile app can reach the cloud API but may show empty states.

## Interview Explanation

Use this explanation:

```text
I changed the React Native app configuration so it uses the deployed AWS App Runner backend by default. The mobile app no longer depends on a backend running on my laptop. For local development, I can still override the API URL with an Expo public environment variable.
```
