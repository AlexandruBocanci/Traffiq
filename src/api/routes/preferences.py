from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel

from src.api.auth import require_current_user
from src.utils.db_utils import get_db_connection


router = APIRouter()

ALLOWED_DISTANCE_UNITS = {"km", "mi"}
ALLOWED_ROUTE_TYPES = {"fastest", "balanced", "less_congested"}
ALLOWED_THEME_MODES = {"system", "dark", "light"}


class UpdatePreferencesRequest(BaseModel):
  distance_unit: str
  preferred_route_type: str
  theme_mode: str


def _serialize_preferences(row):
  return {
    "preference_id": row[0],
    "distance_unit": row[1],
    "preferred_route_type": row[2],
    "theme_mode": row[3],
    "created_at": row[4],
    "updated_at": row[5],
  }


def _validate_preferences(request: UpdatePreferencesRequest):
  if request.distance_unit not in ALLOWED_DISTANCE_UNITS:
    raise HTTPException(status_code=400, detail="distance_unit is not valid.")

  if request.preferred_route_type not in ALLOWED_ROUTE_TYPES:
    raise HTTPException(status_code=400, detail="preferred_route_type is not valid.")

  if request.theme_mode not in ALLOWED_THEME_MODES:
    raise HTTPException(status_code=400, detail="theme_mode is not valid.")


@router.get("/preferences")
def get_preferences(current_user: dict = Depends(require_current_user)):
  conn = None
  cur = None

  try:
    conn = get_db_connection()

    if conn is None:
      raise HTTPException(status_code=500, detail="Database connection failed.")

    cur = conn.cursor()
    cur.execute(
      """
      INSERT INTO silver.user_preferences (cognito_user_sub)
      VALUES (%s)
      ON CONFLICT (cognito_user_sub)
      DO NOTHING;
      """,
      (current_user["sub"],),
    )
    conn.commit()

    cur.execute(
      """
      SELECT
        preference_id,
        distance_unit,
        preferred_route_type,
        theme_mode,
        created_at,
        updated_at
      FROM serving.vw_user_preferences
      WHERE cognito_user_sub = %s;
      """,
      (current_user["sub"],),
    )

    row = cur.fetchone()

    if row is None:
      raise HTTPException(status_code=404, detail="Preferences not found.")

    return {
      "data": _serialize_preferences(row),
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


@router.put("/preferences")
def update_preferences(
  request: UpdatePreferencesRequest,
  current_user: dict = Depends(require_current_user),
):
  _validate_preferences(request)

  conn = None
  cur = None

  try:
    conn = get_db_connection()

    if conn is None:
      raise HTTPException(status_code=500, detail="Database connection failed.")

    cur = conn.cursor()
    cur.execute(
      """
      INSERT INTO silver.user_preferences (
        cognito_user_sub,
        distance_unit,
        preferred_route_type,
        theme_mode
      )
      VALUES (%s, %s, %s, %s)
      ON CONFLICT (cognito_user_sub)
      DO UPDATE SET
        distance_unit = EXCLUDED.distance_unit,
        preferred_route_type = EXCLUDED.preferred_route_type,
        theme_mode = EXCLUDED.theme_mode,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        preference_id,
        distance_unit,
        preferred_route_type,
        theme_mode,
        created_at,
        updated_at;
      """,
      (
        current_user["sub"],
        request.distance_unit,
        request.preferred_route_type,
        request.theme_mode,
      ),
    )

    row = cur.fetchone()
    conn.commit()

    return {
      "updated": True,
      "data": _serialize_preferences(row),
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
