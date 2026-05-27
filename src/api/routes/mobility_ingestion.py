import hashlib
import hmac
from typing import Any

import pandas as pd
from fastapi import APIRouter
from fastapi import Header
from fastapi import HTTPException
from pydantic import BaseModel

from src.config.settings import MOBILITY_INGESTION_TOKEN_SHA256
from src.pipeline.run_tomtom_mobility_pipeline import load_tomtom_mobility_snapshot


router = APIRouter()


class MobilitySnapshotPayload(BaseModel):
    flow_records: list[dict[str, Any]]
    incidents_snapshot: dict[str, Any]
    weather_records: list[dict[str, Any]]


def _validate_ingestion_token(token):
    if not MOBILITY_INGESTION_TOKEN_SHA256 or not token:
        raise HTTPException(status_code=401, detail="Unauthorized ingestion request.")

    received_digest = hashlib.sha256(token.encode("utf-8")).hexdigest()

    if not hmac.compare_digest(received_digest, MOBILITY_INGESTION_TOKEN_SHA256):
        raise HTTPException(status_code=401, detail="Unauthorized ingestion request.")


@router.post("/internal/mobility/snapshot", include_in_schema=False)
def receive_mobility_snapshot(
    payload: MobilitySnapshotPayload,
    ingestion_token: str | None = Header(default=None, alias="X-Traffiq-Ingestion-Token"),
):
    _validate_ingestion_token(ingestion_token)

    if len(payload.flow_records) != 3:
        raise HTTPException(
            status_code=422,
            detail="A mobility snapshot must contain three monitored corridor records.",
        )

    try:
        result = load_tomtom_mobility_snapshot(
            payload.flow_records,
            payload.incidents_snapshot,
            pd.DataFrame(payload.weather_records),
        )
    except Exception:
        raise HTTPException(
            status_code=500, detail="The real mobility snapshot could not be loaded."
        )

    if result.get("status") != "success":
        raise HTTPException(
            status_code=500, detail="The real mobility snapshot could not be loaded."
        )

    return {
        "accepted": True,
        "pipeline_name": "tomtom_real_mobility_snapshot",
        "run_id": result["run_id"],
    }
