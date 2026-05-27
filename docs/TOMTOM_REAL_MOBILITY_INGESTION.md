# TomTom Real Mobility Ingestion

## Purpose

Task 36C replaces user-facing controlled traffic and event values with real
TomTom observations for the Suceava demo scope.

Traffiq does not claim full-city, Waze-like traffic coverage. The implemented
traffic metric represents three monitored Suceava corridors, while incident
markers represent currently returned TomTom incidents in the Suceava bounding
area.

## Data Flow

```text
TomTom Traffic Flow for 3 monitored corridors + TomTom Traffic Incidents
Open-Meteo current weather for Suceava
-> Python extraction and transformation
-> bronze.tomtom_* raw snapshots
-> silver.tomtom_* standardized observations
-> gold.current_corridor_traffic
-> serving views
-> FastAPI on AWS App Runner
-> React Native mobile app
```

Monitored corridors:

```text
Calea Unirii
Bulevardul 1 Mai
Strada Stefan cel Mare
```

## Congestion Metric

TomTom supplies the observed current speed and the free-flow speed for a road
position. Traffiq derives a slowdown score:

```text
congestion_score = ((free_flow_speed - current_speed) / free_flow_speed) * 100
```

The result is restricted to `0..100`. It is a real observed slowdown metric
for the monitored corridor at snapshot time, not a claim that every Suceava
road has the same condition.

## Secret And Cost Rules

- `TOMTOM_API_KEY` exists only in local Git-ignored `.env` during Task 36C.
- `.dockerignore` excludes `.env` and `.env.*`; the backend container does not
  contain the TomTom key or database password.
- the APK reads the public FastAPI endpoint and does not call TomTom directly.
- Task 36C runs ingestion manually; no automated refresh or scheduler has been
  activated yet.
- one Task 36C snapshot run uses four TomTom non-tile requests: three Flow
  requests and one Incidents request.

Verified official allowance on `May 27, 2026`:

```text
TomTom free daily non-tile allowance -> 2,500 requests/day
Open-Meteo free non-commercial daily allowance -> 10,000 calls/day
```

Task 36D will add backend-controlled refresh-on-use only after secret storage,
global rate limiting, and cost guardrails are implemented.

## Implemented Tables And Views

Added real-source storage:

```text
bronze.tomtom_flow_raw
bronze.tomtom_incidents_raw
silver.tomtom_flow_observations
silver.tomtom_incidents
silver.current_weather_snapshot
gold.current_corridor_traffic
```

Serving behavior:

- `serving.vw_traffic_observations` reads TomTom flow observations.
- `serving.vw_map_events` reads TomTom incidents.
- `serving.vw_weather_impact` combines the current weather snapshot with
  current TomTom corridor observations.
- legacy seeded route analytical views return no public current-route claims.
- `silver.user_ride_history.traffic_data_source` records whether a personal
  ride score was backed by a TomTom snapshot or is legacy/unavailable.

## Validation

Validated against RDS and the public App Runner API on `May 27, 2026`:

```text
TomTom pipeline run_id -> 8
pipeline_name -> tomtom_real_mobility_snapshot
pipeline status -> success
Flow Bronze/Silver rows loaded -> 3 / 3
current incident rows loaded -> 24
current weather rows loaded -> 1
Gold current corridor rows -> 3
GET /health -> status=ok
GET /mobile/drive-overview -> traffic_source=tomtom, congested=3, events=5, weather=1, routes=0, rides=0
GET /reports/overview -> route_highlights=0, top_congested_segments=3
GET /routes/report -> count=0
GET /rides/history without token -> 401
```

The backend container was pushed to ECR and deployed through App Runner:

```text
ECR/App Runner image digest -> sha256:5f8426c9bd906f9597f87fb53d200eda7a889a9f04e0c709e981eaef819a39d0
```

## Mobile Presentation

The mobile app now:

- refuses to label an unverified/legacy cached response as current TomTom data;
- displays observed traffic for monitored corridors;
- displays TomTom incident markers instead of controlled event seed claims;
- avoids exposing legacy seed route analytics as current recommendations;
- labels saved ride congestion provenance so historical personal data is not
  presented as real traffic.

Final installed-APK validation is intentionally performed after subsequent
accepted mobile tasks, so only one final APK build is required.

## Sources

- TomTom pricing: https://docs.tomtom.com/pricing
- TomTom Traffic Flow documentation: https://developer.tomtom.com/traffic-api/documentation/tomtom-maps/traffic-flow/flow-segment-data
- TomTom Traffic Incidents documentation: https://developer.tomtom.com/traffic-api/documentation/traffic-incidents/incident-details
- Open-Meteo pricing: https://open-meteo.com/en/pricing
