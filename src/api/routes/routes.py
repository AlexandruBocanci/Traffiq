from fastapi import APIRouter
from fastapi import HTTPException

from src.utils.db_utils import get_db_connection


router = APIRouter()


@router.get("/routes/report")
def get_routes_report():
  conn = None
  cur = None

  try:
    conn = get_db_connection()

    if conn is None:
      raise HTTPException(status_code=500, detail="Database connection failed.")

    cur = conn.cursor()
    cur.execute(
      """
      SELECT
        route_id,
        route_name,
        origin_name,
        destination_name,
        route_distance_km,
        avg_speed,
        avg_congestion_score,
        estimated_duration_minutes
      FROM gold.route_summary
      ORDER BY avg_congestion_score DESC, route_id ASC;
      """
    )

    rows = cur.fetchall()
    data = []

    for row in rows:
      data.append(
        {
          "route_id": row[0],
          "route_name": row[1],
          "origin_name": row[2],
          "destination_name": row[3],
          "route_distance_km": float(row[4]) if row[4] is not None else None,
          "avg_speed": float(row[5]) if row[5] is not None else None,
          "avg_congestion_score": float(row[6]) if row[6] is not None else None,
          "estimated_duration_minutes": float(row[7]) if row[7] is not None else None,
        }
      )

    return {
      "count": len(rows),
      "data": data,
    }

  except Exception:
    raise HTTPException(status_code=500, detail="An error occurred.")

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()

@router.get("/routes/hourly")
def get_routes_hourly():
  conn = None
  cur = None

  try:
    conn = get_db_connection()

    if conn is None:
      raise HTTPException(status_code=500, detail="Database connection failed.")

    cur = conn.cursor()
    cur.execute(
      """
      SELECT
        route_id,
        route_name,
        metric_date,
        hour_of_day,
        avg_speed,
        avg_congestion_score,
        estimated_duration_minutes
      FROM gold.route_hourly_report
      ORDER BY route_id ASC, metric_date DESC, hour_of_day ASC;
      """
    )

    rows = cur.fetchall()
    data = []

    for row in rows:
      data.append(
        {
          "route_id": row[0],
          "route_name": row[1],
          "metric_date": row[2],
          "hour_of_day": row[3],
          "avg_speed": float(row[4]) if row[4] is not None else None,
          "avg_congestion_score": float(row[5]) if row[5] is not None else None,
          "estimated_duration_minutes": float(row[6]) if row[6] is not None else None,
        }
      )

    return {
      "count": len(rows),
      "data": data,
    }

  except Exception:
    raise HTTPException(status_code=500, detail="An error occurred.")

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
