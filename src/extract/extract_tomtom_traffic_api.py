from datetime import datetime
from datetime import timezone

import requests


FLOW_SEGMENT_URL = (
    "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
)
INCIDENT_DETAILS_URL = "https://api.tomtom.com/traffic/services/5/incidentDetails"
INCIDENT_FIELDS = (
    "{incidents{type,geometry{type,coordinates},properties{"
    "id,iconCategory,magnitudeOfDelay,startTime,endTime,from,to,length,delay,"
    "roadNumbers,timeValidity,events{code,description,iconCategory}}}}"
)


def _validate_api_key(api_key):
    if api_key is None or api_key.strip() == "":
        raise ValueError(
            "Missing TOMTOM_API_KEY. Configure it in the local .env file before running "
            "the real mobility ingestion pipeline."
        )


def extract_tomtom_flow_snapshot(api_key, corridors):
    _validate_api_key(api_key)
    ingested_at = datetime.now(timezone.utc).replace(tzinfo=None)
    records = []

    for corridor in corridors:
        response = requests.get(
            FLOW_SEGMENT_URL,
            params={
                "key": api_key,
                "point": f"{corridor['latitude']},{corridor['longitude']}",
                "unit": "KMPH",
            },
            timeout=30,
        )
        response.raise_for_status()
        records.append(
            {
                "corridor_key": corridor["key"],
                "corridor_name": corridor["name"],
                "requested_latitude": corridor["latitude"],
                "requested_longitude": corridor["longitude"],
                "ingested_at": ingested_at,
                "raw_payload": response.json(),
            }
        )

    return records


def extract_tomtom_incidents_snapshot(api_key, bounding_box):
    _validate_api_key(api_key)
    ingested_at = datetime.now(timezone.utc).replace(tzinfo=None)
    response = requests.get(
        INCIDENT_DETAILS_URL,
        params={
            "bbox": bounding_box,
            "fields": INCIDENT_FIELDS,
            "key": api_key,
            "language": "en-GB",
            "timeValidityFilter": "present",
        },
        timeout=30,
    )
    response.raise_for_status()

    return {
        "requested_bounding_box": bounding_box,
        "ingested_at": ingested_at,
        "raw_payload": response.json(),
    }
