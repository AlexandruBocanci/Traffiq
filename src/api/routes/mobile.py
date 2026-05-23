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


@router.get("/mobile/drive-overview")
def get_mobile_drive_overview():
    conn = None
    cur = None

    try:
        conn = get_db_connection()

        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed.")

        cur = conn.cursor()

        route_rows = fetch_all_dicts(
            cur,
            """
            SELECT
                route_id,
                route_name,
                origin_name,
                destination_name,
                route_distance_km,
                observation_count,
                avg_speed,
                min_speed,
                max_speed,
                avg_congestion_score,
                estimated_duration_minutes,
                congestion_level
            FROM serving.vw_routes_report
            ORDER BY avg_congestion_score DESC, route_id ASC
            LIMIT 5;
            """,
        )

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
                metric_date,
                hour_of_day,
                street_name,
                avg_speed,
                congestion_score
            FROM serving.vw_top_congested_streets
            ORDER BY congestion_score DESC, metric_date DESC, hour_of_day DESC, street_name ASC
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
            "routes": [format_route(row) for row in route_rows],
            "events": [format_event(row) for row in event_rows],
            "rides": [],
            "congested": [
                {
                    "metric_date": row["metric_date"],
                    "hour_of_day": row["hour_of_day"],
                    "street_name": row["street_name"],
                    "avg_speed": to_float(row["avg_speed"]),
                    "congestion_score": to_float(row["congestion_score"]),
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
