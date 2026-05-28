from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel

from src.api.auth import require_current_user
from src.utils.db_utils import get_db_connection


router = APIRouter()


class SavedRouteLocation(BaseModel):
  name: str
  latitude: float
  longitude: float


class SaveRouteRequest(BaseModel):
  route_name: str | None = None
  origin: SavedRouteLocation
  destination: SavedRouteLocation
  distance_km: float
  duration_minutes: float
  provider: str


def _serialize_saved_route(row):
  return {
    "saved_route_id": row[0],
    "route_name": row[1],
    "origin_name": row[2],
    "origin_latitude": float(row[3]),
    "origin_longitude": float(row[4]),
    "destination_name": row[5],
    "destination_latitude": float(row[6]),
    "destination_longitude": float(row[7]),
    "distance_km": float(row[8]),
    "duration_minutes": float(row[9]),
    "provider": row[10],
    "created_at": row[11],
    "updated_at": row[12],
  }


@router.get("/saved-routes")
def get_saved_routes(current_user: dict = Depends(require_current_user)):
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
        saved_route_id,
        route_name,
        origin_name,
        origin_latitude,
        origin_longitude,
        destination_name,
        destination_latitude,
        destination_longitude,
        distance_km,
        duration_minutes,
        provider,
        created_at,
        updated_at
      FROM serving.vw_saved_routes
      WHERE cognito_user_sub = %s
      ORDER BY created_at DESC, saved_route_id ASC
      LIMIT 50;
      """,
      (current_user["sub"],),
    )

    rows = cur.fetchall()

    return {
      "count": len(rows),
      "data": [_serialize_saved_route(row) for row in rows],
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


@router.post("/saved-routes")
def save_route(
  request: SaveRouteRequest,
  current_user: dict = Depends(require_current_user),
):
  conn = None
  cur = None

  route_name = request.route_name

  if route_name is None or route_name.strip() == "":
    route_name = f"{request.origin.name} către {request.destination.name}"

  try:
    conn = get_db_connection()

    if conn is None:
      raise HTTPException(status_code=500, detail="Database connection failed.")

    cur = conn.cursor()
    cur.execute(
      """
      INSERT INTO silver.saved_routes (
        cognito_user_sub,
        route_name,
        origin_name,
        origin_latitude,
        origin_longitude,
        destination_name,
        destination_latitude,
        destination_longitude,
        distance_km,
        duration_minutes,
        provider
      )
      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
      ON CONFLICT (cognito_user_sub, origin_name, destination_name)
      DO UPDATE SET
        route_name = EXCLUDED.route_name,
        origin_latitude = EXCLUDED.origin_latitude,
        origin_longitude = EXCLUDED.origin_longitude,
        destination_latitude = EXCLUDED.destination_latitude,
        destination_longitude = EXCLUDED.destination_longitude,
        distance_km = EXCLUDED.distance_km,
        duration_minutes = EXCLUDED.duration_minutes,
        provider = EXCLUDED.provider,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        saved_route_id,
        route_name,
        origin_name,
        origin_latitude,
        origin_longitude,
        destination_name,
        destination_latitude,
        destination_longitude,
        distance_km,
        duration_minutes,
        provider,
        created_at,
        updated_at;
      """,
      (
        current_user["sub"],
        route_name.strip(),
        request.origin.name.strip(),
        request.origin.latitude,
        request.origin.longitude,
        request.destination.name.strip(),
        request.destination.latitude,
        request.destination.longitude,
        request.distance_km,
        request.duration_minutes,
        request.provider.strip(),
      ),
    )

    row = cur.fetchone()
    conn.commit()

    return {
      "saved": True,
      "data": _serialize_saved_route(row),
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


@router.delete("/saved-routes/{saved_route_id}")
def delete_saved_route(
  saved_route_id: int,
  current_user: dict = Depends(require_current_user),
):
  conn = None
  cur = None

  try:
    conn = get_db_connection()

    if conn is None:
      raise HTTPException(status_code=500, detail="Database connection failed.")

    cur = conn.cursor()
    cur.execute(
      """
      DELETE FROM silver.saved_routes
      WHERE saved_route_id = %s
        AND cognito_user_sub = %s;
      """,
      (saved_route_id, current_user["sub"]),
    )

    deleted_count = cur.rowcount
    conn.commit()

    if deleted_count == 0:
      raise HTTPException(status_code=404, detail="Saved route not found.")

    return {
      "deleted": True,
      "saved_route_id": saved_route_id,
    }

  except HTTPException:
    if conn is not None:
      conn.rollback()
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
