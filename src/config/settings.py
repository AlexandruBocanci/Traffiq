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


DB_CONFIG = {
    "host": _get_required_env("DB_HOST"),
    "dbname": _get_required_env("DB_NAME"),
    "user": _get_required_env("DB_USER"),
    "password": _get_required_env("DB_PASSWORD"),
    "port": _get_int_env("DB_PORT", "5432"),
}
