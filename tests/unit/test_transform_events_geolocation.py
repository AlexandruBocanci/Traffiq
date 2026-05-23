import pandas as pd

from src.transform.transform_events_data import transform_events_data


def test_transform_accepts_geolocated_suceava_event():
    raw_df = pd.DataFrame(
        [
            {
                "event_timestamp": "2026-03-25 07:30:00",
                "event_type": "accident",
                "street_name": "Bulevardul George Enescu",
                "description": "Minor collision",
                "severity": "medium",
                "latitude": 47.6428,
                "longitude": 26.2388,
            }
        ]
    )

    clean_df = transform_events_data(raw_df)

    assert len(clean_df) == 1
    assert clean_df.iloc[0]["latitude"] == 47.6428
    assert clean_df.iloc[0]["longitude"] == 26.2388


def test_transform_rejects_event_outside_suceava_bounds():
    raw_df = pd.DataFrame(
        [
            {
                "event_timestamp": "2026-03-25 07:30:00",
                "event_type": "accident",
                "street_name": "Outside scope",
                "description": "Out-of-scope point",
                "severity": "medium",
                "latitude": 44.4268,
                "longitude": 26.1025,
            }
        ]
    )

    clean_df = transform_events_data(raw_df)

    assert clean_df.empty


if __name__ == "__main__":
    test_transform_accepts_geolocated_suceava_event()
    test_transform_rejects_event_outside_suceava_bounds()
    print("SUCCESS: Geolocated Suceava event transformation validated.")
