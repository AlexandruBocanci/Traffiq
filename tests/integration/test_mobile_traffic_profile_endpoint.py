from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)


def test_mobile_traffic_profile_endpoint():
    response = client.get("/mobile/traffic-profile")

    if response.status_code != 200:
        print("FAILED: /mobile/traffic-profile should return status code 200.")
        print(response.text)
        return 0

    response_json = response.json()
    required_keys = [
        "traffic_scope",
        "metric_label",
        "current_weekday_index",
        "current_hour",
        "generated_at",
        "data",
    ]

    for key in required_keys:
        if key not in response_json:
            print(f"FAILED: missing key {key}.")
            print(response_json)
            return 0

    if response_json["traffic_scope"] != "Three monitored Suceava corridors":
        print("FAILED: traffic profile must not claim full-city coverage.")
        print(response_json)
        return 0

    rows = response_json["data"]

    if len(rows) != 168:
        print("FAILED: expected one 24-hour profile for each weekday.")
        print(len(rows))
        return 0

    keys = {(row["weekday_index"], row["hour_of_day"]) for row in rows}

    if len(keys) != 168:
        print("FAILED: weekday/hour rows must be unique.")
        return 0

    for row in rows:
        if row["traffic_score"] < 0 or row["traffic_score"] > 100:
            print("FAILED: traffic score should be between 0 and 100.")
            print(row)
            return 0

        if row["value_source"] not in ["baseline", "tomtom_observed"]:
            print("FAILED: profile row source should be explicit.")
            print(row)
            return 0

    print("SUCCESS: Mobile traffic profile exposes 7x24 monitored-corridor data.")
    return 1


print(test_mobile_traffic_profile_endpoint())
