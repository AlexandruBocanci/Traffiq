from datetime import datetime

from src.transform.transform_tomtom_traffic_data import transform_tomtom_flow_records
from src.transform.transform_tomtom_traffic_data import transform_tomtom_incidents_snapshot


OBSERVED_AT = datetime(2026, 5, 27, 9, 0, 0)


def test_transform_tomtom_flow_records_keeps_real_speed_baseline_fields():
    dataframe = transform_tomtom_flow_records(
        [
            {
                "corridor_key": "calea_unirii",
                "corridor_name": "Calea Unirii",
                "ingested_at": OBSERVED_AT,
                "raw_payload": {
                    "flowSegmentData": {
                        "currentSpeed": 25,
                        "freeFlowSpeed": 50,
                        "currentTravelTime": 120,
                        "freeFlowTravelTime": 60,
                        "confidence": 0.91,
                        "roadClosure": False,
                    }
                },
            }
        ]
    )

    assert len(dataframe) == 1
    assert dataframe.iloc[0]["current_speed_kmh"] == 25
    assert dataframe.iloc[0]["free_flow_speed_kmh"] == 50
    assert dataframe.iloc[0]["confidence"] == 0.91
    assert dataframe.iloc[0]["source_provider"] == "tomtom"


def test_transform_tomtom_incidents_normalizes_severity_and_geometry():
    dataframe = transform_tomtom_incidents_snapshot(
        {
            "ingested_at": OBSERVED_AT,
            "raw_payload": {
                "incidents": [
                    {
                        "properties": {
                            "id": "event-1",
                            "iconCategory": 9,
                            "magnitudeOfDelay": 3,
                            "startTime": "2026-05-27T08:30:00Z",
                            "from": "Calea Unirii",
                            "events": [{"description": "Roadworks"}],
                            "delay": 240,
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [26.2765, 47.6653],
                        },
                    }
                ]
            },
        }
    )

    assert len(dataframe) == 1
    assert dataframe.iloc[0]["event_type"] == "road works"
    assert dataframe.iloc[0]["severity"] == "high"
    assert dataframe.iloc[0]["latitude"] == 47.6653
    assert dataframe.iloc[0]["longitude"] == 26.2765


def test_transform_tomtom_incidents_accepts_missing_delay():
    dataframe = transform_tomtom_incidents_snapshot(
        {
            "ingested_at": OBSERVED_AT,
            "raw_payload": {
                "incidents": [
                    {
                        "properties": {
                            "id": "event-without-delay",
                            "events": [{"description": "Traffic incident"}],
                        },
                        "geometry": {"type": "Point", "coordinates": [26.25, 47.65]},
                    }
                ]
            },
        }
    )

    assert len(dataframe) == 1
    assert dataframe.iloc[0]["delay_seconds"] is None


if __name__ == "__main__":
    test_transform_tomtom_flow_records_keeps_real_speed_baseline_fields()
    test_transform_tomtom_incidents_normalizes_severity_and_geometry()
    test_transform_tomtom_incidents_accepts_missing_delay()
    print("SUCCESS: TomTom Silver transformations validated.")
