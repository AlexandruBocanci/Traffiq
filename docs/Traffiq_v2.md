# Traffiq v2

## 1. Goal

Traffiq v2 extends v1 toward the full product vision.

It adds product realism, richer route intelligence, and stronger user-facing capabilities.

## 2. What v2 Adds Over v1

### Product features

- richer map experience
- route comparison options
- event overlays
- better ride history
- account system foundations

### Data features

- more advanced Gold metrics
- better route-level analytics
- more route summaries and segment-level insights
- stronger metadata and monitoring

### Platform features

- cloud-ready packaging
- environment separation
- better testing
- scheduled pipeline execution

## 3. v2 Product Additions

### Map

- improved map with colored route segments
- event markers
- congestion legend
- route hotspot highlights

### Ride

- start and destination input
- route selection
- pre-ride report panel
- estimated duration and congestion forecast

### History

- richer ride detail pages
- saved routes
- reusable reports

### Account

- login and signup
- profile settings
- reset password flow

## 4. v2 Technical Additions

- event ingestion layer
- route metadata layer
- better API organization
- additional tests
- scheduler or orchestrator
- deployment preparation

## 5. v2 Likely Database Additions

- `silver.events_observations`
- `silver.route_reference`
- `gold.route_summary`
- `gold.top_congested_segments`
- `serving` views for API-specific needs

## 6. v2 API Additions

- `GET /map/events`
- `GET /rides/history`
- `GET /routes/options`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`

## 7. v2 Infrastructure Direction

- Dockerization
- scheduled ETL runs
- deployment to AWS
- environment variable management for dev and prod

## 8. v2 Success Criteria

v2 is successful if:

- the project feels like a real product, not only a data pipeline
- route reporting is significantly richer than v1
- the app structure is ready for cloud deployment
- the system demonstrates clear growth from portfolio project to product-grade concept
