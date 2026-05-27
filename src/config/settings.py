import os

from dotenv import load_dotenv

load_dotenv()


def _get_required_env(name):
    value = os.getenv(name)

    if value is None or value.strip() == "":
        raise ValueError(f"Missing required environment variable: {name}")

    return value


def _get_int_env(name, default):
    value = os.getenv(name, default)

    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(f"Environment variable {name} must be an integer.") from exc


def _get_float_env(name, default, minimum, maximum):
    value = os.getenv(name, default)

    try:
        numeric_value = float(value)
    except ValueError as exc:
        raise ValueError(f"Environment variable {name} must be a number.") from exc

    if not minimum <= numeric_value <= maximum:
        raise ValueError(
            f"Environment variable {name} must be between {minimum} and {maximum}."
        )

    return numeric_value


def _get_text_env(name, default):
    value = os.getenv(name, default).strip()

    if value == "":
        raise ValueError(f"Environment variable {name} must not be empty.")

    return value


DB_CONFIG = {
    "host": _get_required_env("DB_HOST"),
    "dbname": _get_required_env("DB_NAME"),
    "user": _get_required_env("DB_USER"),
    "password": _get_required_env("DB_PASSWORD"),
    "port": _get_int_env("DB_PORT", "5432"),
}

WEATHER_LOCATION_NAME = _get_text_env("WEATHER_LOCATION_NAME", "Suceava")
WEATHER_LATITUDE = _get_float_env("WEATHER_LATITUDE", "47.6514", -90, 90)
WEATHER_LONGITUDE = _get_float_env("WEATHER_LONGITUDE", "26.2556", -180, 180)
WEATHER_TIMEZONE = _get_text_env("WEATHER_TIMEZONE", "Europe/Bucharest")

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "").strip()
TOMTOM_SUCEAVA_BOUNDING_BOX = "26.1800,47.6000,26.3400,47.7100"
TOMTOM_MONITORED_CORRIDORS = [
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

COGNITO_REGION = os.getenv("COGNITO_REGION", "eu-central-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "eu-central-1_QLCNGVSM1")
COGNITO_APP_CLIENT_ID = os.getenv(
    "COGNITO_APP_CLIENT_ID",
    "6vp5r1edjn8phjhfm2jk1f4dcp",
)
COGNITO_ISSUER = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
)
COGNITO_JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"
