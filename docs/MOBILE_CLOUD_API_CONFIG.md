# Mobile Cloud API Configuration

## Purpose

This document records how the Traffiq mobile app connects to the cloud backend.

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

This is the correct cloud-backed mobile direction for the final demo.

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

## Real Mobility Refresh Trigger

Task 36D adds a second public mobile configuration value:

```text
EXPO_PUBLIC_TRAFFIQ_MOBILITY_REFRESH_URL
```

It is configured in the EAS `preview` environment for the final APK build.
The value is a public AWS Lambda Function URL, not an API key. On Drive screen
load, foreground resume, and each 15-minute active interval, mobile sends a
`POST` trigger. The Lambda worker holds server-side TomTom access and the
DynamoDB global refresh lock.

The APK never receives:

```text
TOMTOM_API_KEY
MOBILITY_INGESTION_TOKEN
DB_PASSWORD
```

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

Expected result:

```text
routes: Suceava route records
events: geolocated Suceava alert records
rides: [] for public guest overview
congested: top congested segment records
weather: Open-Meteo-backed weather impact records
```

The public mobile overview intentionally returns `rides: []` because ride history is personal data and is available only through protected authenticated endpoints.

Cloud traffic profile validation:

```powershell
Invoke-RestMethod -Uri 'https://eguwdq6puz.eu-central-1.awsapprunner.com/mobile/traffic-profile'
```

Validated result after Task 36E:

```text
traffic_scope: Three monitored Suceava corridors
rows: 168
current_weekday_index: current Europe/Bucharest weekday
current_hour: current Europe/Bucharest hour
```

The Drive screen uses this endpoint to render the animated 24-hour profile
chart. The chart is APK-compatible because it is built with React Native views
and `Animated`, not a browser-only chart library.

## Current Scope

The mobile cloud configuration is complete for the v4 demo:

- default API target is AWS App Runner
- local backend override remains available
- RDS serves current real TomTom corridor and incident snapshots
- public mobile overview does not expose personal ride history

An installable standalone phone build is handled separately from API configuration.

## Interview Explanation

Use this explanation:

```text
I changed the React Native app configuration so it uses the deployed AWS App Runner backend by default. The mobile app no longer depends on a backend running on my laptop. For local development, I can still override the API URL with an Expo public environment variable.
```
