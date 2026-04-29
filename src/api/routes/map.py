from fastapi import APIRouter
from fastapi import HTTPException

from src.utils.db_utils import get_db_connection


router = APIRouter()


@router.get("/map/events")
def get_map_events():
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
        event_obs_id,
        event_timestamp,
        event_type,
        street_name,
        event_description,
        severity
      FROM silver.events_observations
      ORDER BY event_timestamp DESC, event_obs_id ASC;
      """
    )

    rows = cur.fetchall()
    data = []

    for row in rows:
      data.append(
        {
          "event_id": row[0],
          "event_timestamp": row[1],
          "event_type": row[2],
          "street_name": row[3],
          "event_description": row[4],
          "severity": row[5],
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
