import os
from unittest.mock import Mock
from unittest.mock import patch

# Weather request validation must not require a live database configuration.
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_NAME", "traffiq")
os.environ.setdefault("DB_USER", "test_user")
os.environ.setdefault("DB_PASSWORD", "test_password")
os.environ.setdefault("DB_PORT", "5432")

from src.config.settings import WEATHER_LATITUDE
from src.config.settings import WEATHER_LOCATION_NAME
from src.config.settings import WEATHER_LONGITUDE
from src.config.settings import WEATHER_TIMEZONE
from src.extract.extract_weather_api import extract_weather_api


def test_suceava_weather_request_configuration():
    response = Mock()
    response.json.return_value = {
        "hourly": {
            "time": ["2026-05-23T10:00"],
            "temperature_2m": [18.2],
            "precipitation": [0.0],
            "wind_speed_10m": [7.1],
            "weather_code": [1],
        }
    }
    response.raise_for_status.return_value = None

    with patch("src.extract.extract_weather_api.requests.get", return_value=response) as get:
        dataframe = extract_weather_api(
            WEATHER_LATITUDE,
            WEATHER_LONGITUDE,
            WEATHER_TIMEZONE,
        )

    params = get.call_args.kwargs["params"]

    assert WEATHER_LOCATION_NAME == "Suceava"
    assert WEATHER_LATITUDE == 47.6514
    assert WEATHER_LONGITUDE == 26.2556
    assert WEATHER_TIMEZONE == "Europe/Bucharest"
    assert params["latitude"] == 47.6514
    assert params["longitude"] == 26.2556
    assert params["timezone"] == "Europe/Bucharest"
    assert not dataframe.empty
    assert list(dataframe.columns) == [
        "timestamp",
        "temperature",
        "precipitation",
        "wind_speed",
        "weather_code",
    ]


if __name__ == "__main__":
    test_suceava_weather_request_configuration()
    print("SUCCESS: Suceava Open-Meteo request configuration validated.")
