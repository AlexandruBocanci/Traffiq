from fastapi import APIRouter
from fastapi import HTTPException
from pydantic import BaseModel

from src.api.routing_service import RoutingProviderError
from src.api.routing_service import UnknownSuceavaLocationError
from src.api.routing_service import build_route_preview
from src.utils.db_utils import get_db_connection


router = APIRouter()


class RoutePreviewRequest(BaseModel):
  origin_name: str
  destination_name: str
  origin_latitude: float | None = None
  origin_longitude: float | None = None


@router.post("/routes/preview")
def preview_route(request: RoutePreviewRequest):
  try:
    return build_route_preview(
      origin_name=request.origin_name,
      destination_name=request.destination_name,
      origin_latitude=request.origin_latitude,
      origin_longitude=request.origin_longitude,
    )

  except UnknownSuceavaLocationError as exc:
    raise HTTPException(status_code=400, detail=str(exc)) from exc

  except RoutingProviderError as exc:
    raise HTTPException(status_code=502, detail=str(exc)) from exc


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
        observation_count,
        avg_speed,
        min_speed,
        max_speed,
        avg_congestion_score,
        estimated_duration_minutes,
        congestion_level
      FROM serving.vw_routes_report
      ORDER BY avg_congestion_score DESC, route_id ASC
      LIMIT 50;
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
          "observation_count": row[5],
          "avg_speed": float(row[6]) if row[6] is not None else None,
          "min_speed": float(row[7]) if row[7] is not None else None,
          "max_speed": float(row[8]) if row[8] is not None else None,
          "avg_congestion_score": float(row[9]) if row[9] is not None else None,
          "estimated_duration_minutes": float(row[10]) if row[10] is not None else None,
          "congestion_level": row[11],
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
      FROM serving.vw_routes_hourly
      ORDER BY route_id ASC, metric_date DESC, hour_of_day ASC
      LIMIT 100;
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
