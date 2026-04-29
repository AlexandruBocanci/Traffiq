from fastapi import APIRouter
from fastapi import HTTPException

from src.utils.db_utils import get_db_connection


router = APIRouter()


@router.get("/rides/history")
def get_rides_history():
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
        ride_id,
        started_at,
        ended_at,
        origin_name,
        destination_name,
        route_name,
        distance_km,
        avg_speed,
        congestion_score,
        estimated_duration_minutes,
        ride_status
      FROM silver.ride_history
      ORDER BY started_at DESC, ride_id ASC;
      """
    )

    rows = cur.fetchall()
    data = []

    for row in rows:
      data.append(
        {
          "ride_id": row[0],
          "started_at": row[1],
          "ended_at": row[2],
          "origin_name": row[3],
          "destination_name": row[4],
          "route_name": row[5],
          "distance_km": float(row[6]) if row[6] is not None else None,
          "avg_speed": float(row[7]) if row[7] is not None else None,
          "congestion_score": float(row[8]) if row[8] is not None else None,
          "estimated_duration_minutes": float(row[9]) if row[9] is not None else None,
          "ride_status": row[10],
        }
      )

    return {
      "count": len(rows),
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
