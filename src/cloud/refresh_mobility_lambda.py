import json
import os
import time
import urllib.parse
import urllib.request
from datetime import datetime
from datetime import timezone

import boto3
from botocore.exceptions import ClientError


FLOW_SEGMENT_URL = (
    "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
)
INCIDENT_DETAILS_URL = "https://api.tomtom.com/traffic/services/5/incidentDetails"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
INCIDENT_FIELDS = (
    "{incidents{type,geometry{type,coordinates},properties{"
    "id,iconCategory,magnitudeOfDelay,startTime,endTime,from,to,length,delay,"
    "roadNumbers,timeValidity,events{code,description,iconCategory}}}}"
)
REFRESH_INTERVAL_SECONDS = 15 * 60
LOCK_KEY = "tomtom_real_mobility_snapshot"
CORRIDORS = [
    {
        "key": "calea_unirii",
        "name": "Calea Unirii",
        "latitude": 47.665300,
        "longitude": 26.276500,
    },
    {
        "key": "bulevardul_1_mai",
        "name": "Bulevardul 1 Mai",
        "latitude": 47.641600,
        "longitude": 26.244900,
    },
    {
        "key": "strada_stefan_cel_mare",
        "name": "Strada Stefan cel Mare",
        "latitude": 47.644600,
        "longitude": 26.256300,
    },
]


def _json_request(url, params=None, headers=None, body=None):
    request_url = url

    if params:
        request_url = f"{url}?{urllib.parse.urlencode(params)}"

    request = urllib.request.Request(
        request_url,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers=headers or {},
        method="POST" if body is not None else "GET",
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def _read_secure_parameter(ssm_client, parameter_name):
    response = ssm_client.get_parameter(Name=parameter_name, WithDecryption=True)
    return response["Parameter"]["Value"]


def _claim_refresh_slot(dynamodb_client, table_name, now_epoch):
    try:
        dynamodb_client.update_item(
            TableName=table_name,
            Key={"lock_key": {"S": LOCK_KEY}},
            UpdateExpression="SET last_started_epoch = :now, expires_at = :expires",
            ConditionExpression=(
                "attribute_not_exists(last_started_epoch) "
                "OR last_started_epoch <= :eligible_before"
            ),
            ExpressionAttributeValues={
                ":now": {"N": str(now_epoch)},
                ":expires": {"N": str(now_epoch + REFRESH_INTERVAL_SECONDS * 2)},
                ":eligible_before": {"N": str(now_epoch - REFRESH_INTERVAL_SECONDS)},
            },
        )
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise


def _extract_flow_snapshot(api_key, ingested_at):
    records = []

    for corridor in CORRIDORS:
        payload = _json_request(
            FLOW_SEGMENT_URL,
            {
                "key": api_key,
                "point": f"{corridor['latitude']},{corridor['longitude']}",
                "unit": "KMPH",
            },
        )
        records.append(
            {
                "corridor_key": corridor["key"],
                "corridor_name": corridor["name"],
                "requested_latitude": corridor["latitude"],
                "requested_longitude": corridor["longitude"],
                "ingested_at": ingested_at,
                "raw_payload": payload,
            }
        )

    return records


def _extract_incidents_snapshot(api_key, ingested_at):
    payload = _json_request(
        INCIDENT_DETAILS_URL,
        {
            "bbox": "26.1800,47.6000,26.3400,47.7100",
            "fields": INCIDENT_FIELDS,
            "key": api_key,
            "language": "en-GB",
            "timeValidityFilter": "present",
        },
    )
    return {
        "requested_bounding_box": "26.1800,47.6000,26.3400,47.7100",
        "ingested_at": ingested_at,
        "raw_payload": payload,
    }


def _extract_weather_records():
    payload = _json_request(
        OPEN_METEO_URL,
        {
            "latitude": 47.6514,
            "longitude": 26.2556,
            "hourly": "temperature_2m,precipitation,wind_speed_10m,weather_code",
            "timezone": "Europe/Bucharest",
            "forecast_days": "1",
        },
    )
    hourly = payload["hourly"]
    return [
        {
            "timestamp": timestamp,
            "temperature": hourly["temperature_2m"][index],
            "precipitation": hourly["precipitation"][index],
            "wind_speed": hourly["wind_speed_10m"][index],
            "weather_code": hourly["weather_code"][index],
        }
        for index, timestamp in enumerate(hourly["time"])
    ]


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    del context
    method = event.get("requestContext", {}).get("http", {}).get("method")

    if method != "POST":
        return _response(405, {"refreshed": False, "reason": "method_not_allowed"})

    now_epoch = int(time.time())
    dynamodb_client = boto3.client("dynamodb")
    table_name = os.environ["LOCK_TABLE_NAME"]

    if not _claim_refresh_slot(dynamodb_client, table_name, now_epoch):
        return _response(200, {"refreshed": False, "reason": "rate_limited"})

    try:
        ssm_client = boto3.client("ssm")
        api_key = _read_secure_parameter(ssm_client, os.environ["TOMTOM_PARAMETER_NAME"])
        ingestion_token = _read_secure_parameter(
            ssm_client, os.environ["INGESTION_TOKEN_PARAMETER_NAME"]
        )
        ingested_at = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
        callback_payload = {
            "flow_records": _extract_flow_snapshot(api_key, ingested_at),
            "incidents_snapshot": _extract_incidents_snapshot(api_key, ingested_at),
            "weather_records": _extract_weather_records(),
        }
        result = _json_request(
            os.environ["INGESTION_CALLBACK_URL"],
            headers={
                "Content-Type": "application/json",
                "X-Traffiq-Ingestion-Token": ingestion_token,
            },
            body=callback_payload,
        )
        return _response(
            200,
            {
                "refreshed": True,
                "pipeline_name": result["pipeline_name"],
                "run_id": result["run_id"],
            },
        )
    except Exception:
        return _response(502, {"refreshed": False, "reason": "refresh_failed"})
