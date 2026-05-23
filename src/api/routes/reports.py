from fastapi import APIRouter
from fastapi import HTTPException

from src.utils.db_utils import get_db_connection


router = APIRouter()


def fetch_one_dict(cur, query):
  cur.execute(query)
  row = cur.fetchone()

  if row is None:
    return {}

  columns = [desc[0] for desc in cur.description]
  return dict(zip(columns, row))


def fetch_all_dicts(cur, query):
  cur.execute(query)
  rows = cur.fetchall()
  columns = [desc[0] for desc in cur.description]
  return [dict(zip(columns, row)) for row in rows]


def to_float(value):
  return float(value) if value is not None else None


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


@router.get("/reports/overview")
def get_reports_overview():
  conn = None
  cur = None

  try:
    conn = get_db_connection()

    if conn is None:
      raise HTTPException(status_code=500, detail="Database connection failed.")

    cur = conn.cursor()

    summary = fetch_one_dict(
      cur,
      """
      SELECT
        route_count,
        congested_segment_count,
        event_count,
        avg_route_congestion_score,
        avg_route_speed,
        high_congestion_route_count
      FROM serving.vw_reports_summary
      """
    )

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
      LIMIT 3;
      """
    )

    segment_rows = fetch_all_dicts(
      cur,
      """
      SELECT
        segment_rank,
        street_name,
        observation_count,
        avg_speed,
        avg_congestion_score
      FROM serving.vw_top_congested_segments
      ORDER BY segment_rank ASC
      LIMIT 5;
      """
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
        severity
      FROM serving.vw_map_events
      ORDER BY event_timestamp DESC, event_id ASC
      LIMIT 5;
      """
    )

    return {
      "summary": {
        "route_count": summary["route_count"],
        "congested_segment_count": summary["congested_segment_count"],
        "event_count": summary["event_count"],
        "avg_route_congestion_score": to_float(summary["avg_route_congestion_score"]),
        "avg_route_speed": to_float(summary["avg_route_speed"]),
        "high_congestion_route_count": summary["high_congestion_route_count"],
      },
      "route_highlights": [format_route(row) for row in route_rows],
      "top_congested_segments": [
        {
          "segment_rank": row["segment_rank"],
          "street_name": row["street_name"],
          "observation_count": row["observation_count"],
          "avg_speed": to_float(row["avg_speed"]),
          "avg_congestion_score": to_float(row["avg_congestion_score"]),
        }
        for row in segment_rows
      ],
      "recent_events": [
        {
          "event_id": row["event_id"],
          "event_timestamp": row["event_timestamp"],
          "event_type": row["event_type"],
          "street_name": row["street_name"],
          "event_description": row["event_description"],
          "severity": row["severity"],
        }
        for row in event_rows
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
