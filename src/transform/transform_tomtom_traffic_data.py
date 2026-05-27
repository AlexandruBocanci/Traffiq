import pandas as pd


ICON_CATEGORY_TO_EVENT_TYPE = {
    1: "accident",
    2: "fog",
    3: "hazard",
    4: "rain",
    5: "ice",
    6: "traffic jam",
    7: "lane closed",
    8: "road closed",
    9: "road works",
    10: "wind",
    11: "flooding",
    14: "broken down vehicle",
}

MAGNITUDE_TO_SEVERITY = {
    0: "low",
    1: "low",
    2: "medium",
    3: "high",
    4: "high",
}


def transform_tomtom_flow_records(records):
    cleaned_rows = []

    for record in records:
        segment = record.get("raw_payload", {}).get("flowSegmentData", {})
        current_speed = segment.get("currentSpeed")
        free_flow_speed = segment.get("freeFlowSpeed")

        if current_speed is None or free_flow_speed is None or free_flow_speed <= 0:
            continue

        confidence = segment.get("confidence")

        if confidence is not None and not 0 <= confidence <= 1:
            continue

        cleaned_rows.append(
            {
                "observed_at": record["ingested_at"],
                "corridor_key": record["corridor_key"],
                "corridor_name": record["corridor_name"],
                "current_speed_kmh": current_speed,
                "free_flow_speed_kmh": free_flow_speed,
                "current_travel_time_seconds": segment.get("currentTravelTime"),
                "free_flow_travel_time_seconds": segment.get("freeFlowTravelTime"),
                "confidence": confidence,
                "road_closure": bool(segment.get("roadClosure", False)),
                "source_provider": "tomtom",
            }
        )

    return pd.DataFrame(cleaned_rows)


def _first_coordinate(geometry):
    coordinates = geometry.get("coordinates") or []

    if geometry.get("type") == "Point" and len(coordinates) >= 2:
        return coordinates[1], coordinates[0]

    if geometry.get("type") == "LineString" and coordinates and len(coordinates[0]) >= 2:
        return coordinates[0][1], coordinates[0][0]

    return None, None


def transform_tomtom_incidents_snapshot(snapshot):
    cleaned_rows = []
    observed_at = snapshot["ingested_at"]

    for incident in snapshot.get("raw_payload", {}).get("incidents", []):
        properties = incident.get("properties", {})
        incident_id = properties.get("id")

        if not incident_id:
            continue

        latitude, longitude = _first_coordinate(incident.get("geometry", {}))
        events = properties.get("events") or []
        first_event = events[0] if events else {}
        icon_category = properties.get("iconCategory", first_event.get("iconCategory", 0))
        event_timestamp = properties.get("startTime") or observed_at
        from_location = properties.get("from") or "Suceava monitored area"
        to_location = properties.get("to")
        description = first_event.get("description") or "Traffic incident reported by TomTom"

        if to_location and to_location != from_location:
            from_location = f"{from_location} - {to_location}"

        cleaned_rows.append(
            {
                "incident_id": incident_id,
                "observed_at": observed_at,
                "event_timestamp": event_timestamp,
                "event_type": ICON_CATEGORY_TO_EVENT_TYPE.get(icon_category, "traffic incident"),
                "street_name": from_location,
                "event_description": description,
                "severity": MAGNITUDE_TO_SEVERITY.get(
                    properties.get("magnitudeOfDelay", 0), "low"
                ),
                "latitude": latitude,
                "longitude": longitude,
                "delay_seconds": properties.get("delay"),
                "source_provider": "tomtom",
            }
        )

    return pd.DataFrame(cleaned_rows)
