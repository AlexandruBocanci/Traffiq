from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel
from datetime import datetime
from datetime import timedelta

from src.api.auth import require_current_user
from src.utils.db_utils import get_db_connection


router = APIRouter()


class RideHistoryLocation(BaseModel):
  name: str


class AddRideHistoryRequest(BaseModel):
  origin: RideHistoryLocation
  destination: RideHistoryLocation
  route_name: str | None = None
  distance_km: float
  duration_minutes: float
  congestion_score: float | None = None
  ride_status: str = "completed"


def _serialize_ride_history_row(row):
  return {
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
    "traffic_data_source": row[11],
  }


@router.get("/rides/history")
def get_rides_history(current_user: dict = Depends(require_current_user)):
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
        ride_status,
        traffic_data_source
      FROM serving.vw_user_ride_history
      WHERE cognito_user_sub = %s
      ORDER BY started_at DESC, ride_id ASC
      LIMIT 50;
      """,
      (current_user["sub"],),
    )

    rows = cur.fetchall()

    return {
      "count": len(rows),
      "data": [_serialize_ride_history_row(row) for row in rows],
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


@router.post("/rides/history")
def add_ride_history(
  request: AddRideHistoryRequest,
  current_user: dict = Depends(require_current_user),
):
  conn = None
  cur = None

  if request.distance_km <= 0:
    raise HTTPException(status_code=400, detail="distance_km must be greater than 0.")

  if request.duration_minutes <= 0:
    raise HTTPException(status_code=400, detail="duration_minutes must be greater than 0.")

  if request.ride_status not in ["completed", "cancelled"]:
    raise HTTPException(status_code=400, detail="ride_status is not valid.")

  route_name = request.route_name

  if route_name is None or route_name.strip() == "":
    route_name = f"{request.origin.name} to {request.destination.name}"

  ended_at = datetime.now()
  started_at = ended_at - timedelta(minutes=request.duration_minutes)
  avg_speed = round(request.distance_km / (request.duration_minutes / 60), 2)
  congestion_score = request.congestion_score

  if congestion_score is not None and (congestion_score < 0 or congestion_score > 100):
    raise HTTPException(status_code=400, detail="congestion_score must be between 0 and 100.")

  try:
    conn = get_db_connection()

    if conn is None:
      raise HTTPException(status_code=500, detail="Database connection failed.")

    cur = conn.cursor()
    traffic_data_source = "unavailable"

    if congestion_score is not None:
      cur.execute(
        """
        SELECT EXISTS (
          SELECT 1
          FROM gold.current_corridor_traffic
          WHERE source_provider = 'tomtom'
        );
        """
      )

      if cur.fetchone()[0]:
        traffic_data_source = "tomtom_snapshot"
      else:
        congestion_score = None

    cur.execute(
      """
      INSERT INTO silver.user_ride_history (
        cognito_user_sub,
        started_at,
        ended_at,
        origin_name,
        destination_name,
        route_name,
        distance_km,
        avg_speed,
        congestion_score,
        estimated_duration_minutes,
        ride_status,
        traffic_data_source
      )
      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
      RETURNING
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
        ride_status,
        traffic_data_source;
      """,
      (
        current_user["sub"],
        started_at,
        ended_at,
        request.origin.name.strip(),
        request.destination.name.strip(),
        route_name.strip(),
        request.distance_km,
        avg_speed,
        congestion_score,
        request.duration_minutes,
        request.ride_status,
        traffic_data_source,
      ),
    )

    row = cur.fetchone()
    conn.commit()

    return {
      "created": True,
      "data": _serialize_ride_history_row(row),
    }

  except HTTPException:
    raise

  except Exception:
    if conn is not None:
      conn.rollback()
    raise HTTPException(status_code=500, detail="An error occurred.")

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
