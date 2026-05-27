from unittest.mock import Mock
from unittest.mock import patch

from src.extract.extract_tomtom_traffic_api import extract_tomtom_flow_snapshot
from src.extract.extract_tomtom_traffic_api import extract_tomtom_incidents_snapshot


CORRIDORS = [
    {"key": "one", "name": "One", "latitude": 47.65, "longitude": 26.25},
    {"key": "two", "name": "Two", "latitude": 47.66, "longitude": 26.26},
]


def test_flow_snapshot_requests_one_tomtom_observation_per_corridor():
    response = Mock()
    response.json.return_value = {"flowSegmentData": {"currentSpeed": 31}}
    response.raise_for_status.return_value = None

    with patch(
        "src.extract.extract_tomtom_traffic_api.requests.get", return_value=response
    ) as request:
        records = extract_tomtom_flow_snapshot("test-key", CORRIDORS)

    assert len(records) == 2
    assert request.call_count == 2
    assert request.call_args_list[0].kwargs["params"]["point"] == "47.65,26.25"
    assert request.call_args_list[0].kwargs["params"]["unit"] == "KMPH"


def test_incidents_snapshot_uses_present_suceava_bounding_box_request():
    response = Mock()
    response.json.return_value = {"incidents": []}
    response.raise_for_status.return_value = None

    with patch(
        "src.extract.extract_tomtom_traffic_api.requests.get", return_value=response
    ) as request:
        snapshot = extract_tomtom_incidents_snapshot(
            "test-key", "26.18,47.60,26.34,47.71"
        )

    params = request.call_args.kwargs["params"]
    assert params["bbox"] == "26.18,47.60,26.34,47.71"
    assert params["timeValidityFilter"] == "present"
    assert snapshot["raw_payload"] == {"incidents": []}


if __name__ == "__main__":
    test_flow_snapshot_requests_one_tomtom_observation_per_corridor()
    test_incidents_snapshot_uses_present_suceava_bounding_box_request()
    print("SUCCESS: TomTom extract request configuration validated.")
