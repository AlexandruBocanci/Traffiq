# Mobile Traffic Profile Chart

## Purpose

The Drive screen includes a 24-hour traffic profile for the monitored Suceava
corridors.

The feature is scoped intentionally:

- it does not claim full-city traffic coverage
- it does not use generated data as TomTom history
- it starts from a baseline profile stored in Gold
- it replaces baseline values with TomTom-observed values as real flow
  snapshots accumulate

## Data Model

Baseline rows live in:

```text
gold.corridor_hourly_traffic_profile
```

The table stores one row for each weekday/hour combination:

```text
7 weekdays x 24 hours = 168 rows
```

Observed values are computed from:

```text
silver.tomtom_flow_observations
```

The API averages real TomTom flow observations by:

```text
weekday_index, hour_of_day
```

If an observed value exists for that weekday/hour, the API returns the TomTom
observed value. If not, it returns the baseline value.

## API

```text
GET /mobile/traffic-profile
```

Response shape:

```text
traffic_scope
metric_label
current_weekday_index
current_hour
generated_at
data[]
```

Each data row includes:

```text
weekday_index
weekday_label
hour_of_day
traffic_score
baseline_congestion_score
observed_congestion_score
observations_count
latest_observed_at
value_source
```

The mobile UI does not display `value_source` as a user-facing badge. It keeps
the chart focused on the product experience while the API remains transparent
for technical validation.

## Mobile UX

The chart is rendered in:

```text
mobile/src/components/TrafficProfileChart.tsx
```

Behavior:

- defaults to the current weekday
- highlights the current hour
- uses green vertical bars that grow from zero
- animates bar height changes when switching weekdays
- uses a compact weekday selector from Monday to Sunday

The chart is intentionally custom React Native UI instead of a web chart
library. This keeps it compatible with Expo/EAS Android APK builds.

## Validation

Task 36E validation:

```text
GET /mobile/traffic-profile -> 168 rows
traffic_scope -> Three monitored Suceava corridors
observed rows -> computed from TomTom snapshots when available
GET /mobile/drive-overview -> traffic_source=tomtom
npx expo export --platform android -> passed
```
