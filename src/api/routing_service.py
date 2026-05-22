import re
import unicodedata
from dataclasses import dataclass
from math import asin
from math import cos
from math import radians
from math import sin
from math import sqrt
from typing import Any

import httpx


OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving/{coordinates}"
OSRM_PROVIDER_NAME = "OSRM"
FALLBACK_PROVIDER_NAME = "local_suceava_fallback"
REQUEST_TIMEOUT_SECONDS = 8.0


@dataclass(frozen=True)
class SuceavaLocation:
    name: str
    latitude: float
    longitude: float
    aliases: tuple[str, ...]


class UnknownSuceavaLocationError(ValueError):
    pass


class RoutingProviderError(RuntimeError):
    pass


def build_location(name: str, latitude: float, longitude: float) -> SuceavaLocation:
    return SuceavaLocation(
        name=name,
        latitude=latitude,
        longitude=longitude,
        aliases=(),
    )


SUCEAVA_LOCATIONS = [
    SuceavaLocation(
        name="City Center",
        latitude=47.6514,
        longitude=26.2556,
        aliases=("city center", "suceava center", "centru"),
    ),
    SuceavaLocation(
        name="Iulius Mall Suceava",
        latitude=47.6703,
        longitude=26.2589,
        aliases=("iulius mall suceava", "iulius mall", "mall"),
    ),
    SuceavaLocation(
        name="Stefan cel Mare University",
        latitude=47.6416,
        longitude=26.2449,
        aliases=(
            "stefan cel mare university",
            "universitatea stefan cel mare",
            "usv",
            "university",
        ),
    ),
    SuceavaLocation(
        name="Suceava Fortress",
        latitude=47.6467,
        longitude=26.2704,
        aliases=("suceava fortress", "cetatea de scaun", "fortress"),
    ),
    SuceavaLocation(
        name="Suceava Railway Station",
        latitude=47.6613,
        longitude=26.2736,
        aliases=("suceava railway station", "gara suceava", "railway station"),
    ),
]


def normalize_location_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.strip().lower())
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_value).strip()


def resolve_suceava_location(value: str) -> SuceavaLocation:
    normalized_value = normalize_location_name(value)

    for location in SUCEAVA_LOCATIONS:
        normalized_names = {normalize_location_name(location.name)}
        normalized_names.update(normalize_location_name(alias) for alias in location.aliases)

        if normalized_value in normalized_names:
            return location

    raise UnknownSuceavaLocationError(
        f"Unknown Suceava location: {value}. Choose one of the supported Suceava locations."
    )


def build_osrm_coordinates(origin: SuceavaLocation, destination: SuceavaLocation) -> str:
    return (
        f"{origin.longitude},{origin.latitude};"
        f"{destination.longitude},{destination.latitude}"
    )


def request_osrm_route(origin: SuceavaLocation, destination: SuceavaLocation) -> dict[str, Any]:
    coordinates = build_osrm_coordinates(origin, destination)

    try:
        response = httpx.get(
            OSRM_ROUTE_URL.format(coordinates=coordinates),
            params={
                "alternatives": "false",
                "geometries": "geojson",
                "overview": "full",
                "steps": "false",
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RoutingProviderError("Could not reach the routing provider.") from exc

    payload = response.json()

    if payload.get("code") != "Ok" or not payload.get("routes"):
        raise RoutingProviderError("The routing provider could not calculate this route.")

    return payload["routes"][0]


def calculate_haversine_km(origin: SuceavaLocation, destination: SuceavaLocation) -> float:
    earth_radius_km = 6371.0
    lat_delta = radians(destination.latitude - origin.latitude)
    lon_delta = radians(destination.longitude - origin.longitude)
    origin_lat = radians(origin.latitude)
    destination_lat = radians(destination.latitude)

    haversine_value = (
        sin(lat_delta / 2) ** 2
        + cos(origin_lat) * cos(destination_lat) * sin(lon_delta / 2) ** 2
    )

    return 2 * earth_radius_km * asin(sqrt(haversine_value))


def build_fallback_route(origin: SuceavaLocation, destination: SuceavaLocation) -> dict[str, Any]:
    straight_line_km = calculate_haversine_km(origin, destination)
    estimated_road_distance_km = straight_line_km * 1.35
    average_city_speed_kmh = 32
    duration_minutes = (estimated_road_distance_km / average_city_speed_kmh) * 60

    return {
        "distance": estimated_road_distance_km * 1000,
        "duration": duration_minutes * 60,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [origin.longitude, origin.latitude],
                [destination.longitude, destination.latitude],
            ],
        },
        "provider": FALLBACK_PROVIDER_NAME,
    }


def build_route_preview(
    origin_name: str,
    destination_name: str,
    origin_latitude: float | None = None,
    origin_longitude: float | None = None,
) -> dict[str, Any]:
    if origin_latitude is not None and origin_longitude is not None:
        origin = build_location(origin_name or "Current location", origin_latitude, origin_longitude)
    else:
        origin = resolve_suceava_location(origin_name)

    destination = resolve_suceava_location(destination_name)

    try:
        route = request_osrm_route(origin, destination)
        provider = OSRM_PROVIDER_NAME
    except RoutingProviderError:
        route = build_fallback_route(origin, destination)
        provider = FALLBACK_PROVIDER_NAME

    return {
        "origin": {
            "name": origin.name,
            "latitude": origin.latitude,
            "longitude": origin.longitude,
        },
        "destination": {
            "name": destination.name,
            "latitude": destination.latitude,
            "longitude": destination.longitude,
        },
        "distance_km": round(float(route["distance"]) / 1000, 2),
        "duration_minutes": round(float(route["duration"]) / 60, 1),
        "geometry": route["geometry"],
        "provider": provider,
    }
