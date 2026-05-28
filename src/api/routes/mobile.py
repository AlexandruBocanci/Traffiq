from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter
from fastapi import HTTPException

from src.utils.db_utils import get_db_connection


router = APIRouter()


def to_float(value):
    return float(value) if value is not None else None


def fetch_all_dicts(cur, query):
    cur.execute(query)
    rows = cur.fetchall()
    columns = [desc[0] for desc in cur.description]
    return [dict(zip(columns, row)) for row in rows]


def format_route(row):
    return {
        "route_id": row["route_id"],
        "route_name": row["route_name"],
        "origin_name": row["origin_name"],
        "destination_name": row["destination_name"],
        "route_distance_km": to_float(row["route_distance_km"]),
        "observation_count": row["observation_count"],
        "avg_speed": to_float(row["avg_speed"]),
        "min_speed": to_float(row["min_speed"]),
        "max_speed": to_float(row["max_speed"]),
        "avg_congestion_score": to_float(row["avg_congestion_score"]),
        "estimated_duration_minutes": to_float(row["estimated_duration_minutes"]),
        "congestion_level": row["congestion_level"],
    }


def format_event(row):
    return {
        "event_id": row["event_id"],
        "event_timestamp": row["event_timestamp"],
        "event_type": row["event_type"],
        "street_name": row["street_name"],
        "event_description": row["event_description"],
        "severity": row["severity"],
        "latitude": to_float(row["latitude"]),
        "longitude": to_float(row["longitude"]),
    }


def format_ride(row):
    return {
        "ride_id": row["ride_id"],
        "started_at": row["started_at"],
        "ended_at": row["ended_at"],
        "origin_name": row["origin_name"],
        "destination_name": row["destination_name"],
        "route_name": row["route_name"],
        "distance_km": to_float(row["distance_km"]),
        "avg_speed": to_float(row["avg_speed"]),
        "congestion_score": to_float(row["congestion_score"]),
        "estimated_duration_minutes": to_float(row["estimated_duration_minutes"]),
        "ride_status": row["ride_status"],
    }


def format_traffic_profile_row(row):
    return {
        "weekday_index": row["weekday_index"],
        "weekday_label": row["weekday_label"],
        "hour_of_day": row["hour_of_day"],
        "traffic_score": to_float(row["traffic_score"]),
        "baseline_congestion_score": to_float(row["baseline_congestion_score"]),
        "observed_congestion_score": to_float(row["observed_congestion_score"]),
        "observations_count": row["observations_count"],
        "latest_observed_at": row["latest_observed_at"],
        "value_source": row["value_source"],
    }


@router.get("/mobile/drive-overview")
def get_mobile_drive_overview():
    conn = None
    cur = None

    try:
        conn = get_db_connection()

        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed.")

        cur = conn.cursor()

        event_rows = fetch_all_dicts(
            cur,
            """
            SELECT
                event_id,
                event_timestamp,
                event_type,
                street_name,
                event_description,
                severity,
                latitude,
                longitude
            FROM serving.vw_map_events
            ORDER BY event_timestamp DESC, event_id ASC
            LIMIT 5;
            """,
        )

        congested_rows = fetch_all_dicts(
            cur,
            """
            SELECT
                observed_at::date AS metric_date,
                EXTRACT(HOUR FROM observed_at)::integer AS hour_of_day,
                corridor_name AS street_name,
                current_speed_kmh AS avg_speed,
                congestion_score,
                observed_at,
                free_flow_speed_kmh,
                confidence,
                source_provider
            FROM gold.current_corridor_traffic
            WHERE source_provider = 'tomtom'
            ORDER BY congestion_score DESC, observed_at DESC, corridor_name ASC
            LIMIT 5;
            """,
        )

        weather_rows = fetch_all_dicts(
            cur,
            """
            SELECT
                metric_date,
                weather_label,
                avg_speed,
                avg_congestion_score
            FROM serving.vw_weather_impact
            ORDER BY metric_date DESC, avg_congestion_score DESC, weather_label ASC
            LIMIT 5;
            """,
        )

        return {
            "routes": [],
            "events": [format_event(row) for row in event_rows],
            "rides": [],
            "traffic_source": "tomtom",
            "traffic_scope": "Three monitored Suceava corridors",
            "traffic_observed_at": (
                congested_rows[0]["observed_at"] if congested_rows else None
            ),
            "congested": [
                {
                    "metric_date": row["metric_date"],
                    "hour_of_day": row["hour_of_day"],
                    "street_name": row["street_name"],
                    "avg_speed": to_float(row["avg_speed"]),
                    "congestion_score": to_float(row["congestion_score"]),
                    "observed_at": row["observed_at"],
                    "free_flow_speed_kmh": to_float(row["free_flow_speed_kmh"]),
                    "confidence": to_float(row["confidence"]),
                    "source_provider": row["source_provider"],
                }
                for row in congested_rows
            ],
            "weather": [
                {
                    "metric_date": row["metric_date"],
                    "weather_label": row["weather_label"],
                    "avg_speed": to_float(row["avg_speed"]),
                    "avg_congestion_score": to_float(row["avg_congestion_score"]),
                }
                for row in weather_rows
            ],
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(status_code=500, detail="An error occurred.")

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


@router.get("/mobile/traffic-profile")
def get_mobile_traffic_profile():
    conn = None
    cur = None

    try:
        conn = get_db_connection()

        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed.")

        cur = conn.cursor()
        cur.execute(
            """
            WITH observed_profile AS (
                SELECT
                    (EXTRACT(ISODOW FROM observed_at)::integer - 1) AS weekday_index,
                    EXTRACT(HOUR FROM observed_at)::integer AS hour_of_day,
                    ROUND(
                        AVG(
                            LEAST(
                                100,
                                GREATEST(
                                    0,
                                    (
                                        (
                                            free_flow_speed_kmh - current_speed_kmh
                                        ) / NULLIF(free_flow_speed_kmh, 0)
                                    ) * 100
                                )
                            )
                        ),
                        2
                    ) AS observed_congestion_score,
                    COUNT(*) AS observations_count,
                    MAX(observed_at) AS latest_observed_at
                FROM silver.tomtom_flow_observations
                WHERE
                    source_provider = 'tomtom'
                    AND observed_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
                GROUP BY
                    (EXTRACT(ISODOW FROM observed_at)::integer - 1),
                    EXTRACT(HOUR FROM observed_at)::integer
            )
            SELECT
                baseline.weekday_index,
                baseline.weekday_label,
                baseline.hour_of_day,
                baseline.baseline_congestion_score,
                observed.observed_congestion_score,
                COALESCE(observed.observed_congestion_score, baseline.baseline_congestion_score)
                    AS traffic_score,
                COALESCE(observed.observations_count, 0) AS observations_count,
                observed.latest_observed_at,
                CASE
                    WHEN observed.observations_count IS NULL THEN 'baseline'
                    ELSE 'tomtom_observed'
                END AS value_source
            FROM gold.corridor_hourly_traffic_profile baseline
            LEFT JOIN observed_profile observed
                ON baseline.weekday_index = observed.weekday_index
                AND baseline.hour_of_day = observed.hour_of_day
            ORDER BY baseline.weekday_index ASC, baseline.hour_of_day ASC;
            """
        )

        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        data = [format_traffic_profile_row(dict(zip(columns, row))) for row in rows]
        now = datetime.now(ZoneInfo("Europe/Bucharest"))

        return {
            "traffic_scope": "Three monitored Suceava corridors",
            "metric_label": "Traffic profile",
            "current_weekday_index": now.weekday(),
            "current_hour": now.hour,
            "generated_at": now.isoformat(),
            "data": data,
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(status_code=500, detail="An error occurred.")

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
