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
        latitude=47.6592,
        longitude=26.2698,
        aliases=("iulius mall suceava", "iulius mall", "mall"),
    ),
    SuceavaLocation(
        name="Shopping City Suceava",
        latitude=47.6646646,
        longitude=26.2668578,
        aliases=("shopping city", "shopping", "mall burdujeni"),
    ),
    SuceavaLocation(
        name="Carrefour Suceava",
        latitude=47.6653881,
        longitude=26.2666112,
        aliases=("carrefour", "carrefour suceava"),
    ),
    SuceavaLocation(
        name="Cinema City Suceava",
        latitude=47.6590384,
        longitude=26.2731606,
        aliases=("cinema", "cinema city", "movie"),
    ),
    SuceavaLocation(
        name="Suceava Airport",
        latitude=47.6880591,
        longitude=26.3524817,
        aliases=(
            "aero",
            "aeroport",
            "airport",
            "salcea",
            "stefan cel mare airport",
            "aeroportul stefan cel mare",
        ),
    ),
    SuceavaLocation(
        name="Stefan cel Mare University",
        latitude=47.6410688,
        longitude=26.2439935,
        aliases=(
            "stefan cel mare university",
            "universitatea stefan cel mare",
            "usv",
            "university",
            "universitate",
        ),
    ),
    SuceavaLocation(
        name="Suceava Fortress",
        latitude=47.6448494,
        longitude=26.2703335,
        aliases=("suceava fortress", "cetatea de scaun", "cetate", "fortress"),
    ),
    SuceavaLocation(
        name="Suceava Railway Station",
        latitude=47.6705477,
        longitude=26.2663,
        aliases=(
            "suceava railway station",
            "gara suceava",
            "gara",
            "railway station",
            "train station",
        ),
    ),
    SuceavaLocation(
        name="Suceava Bus Station",
        latitude=47.6614464,
        longitude=26.2525231,
        aliases=("autogara", "bus station", "autogara suceava"),
    ),
    SuceavaLocation(
        name="Suceava County Hospital",
        latitude=47.6391876,
        longitude=26.2404587,
        aliases=("spital", "spital judetean", "hospital", "judetean"),
    ),
    SuceavaLocation(
        name="Suceava City Hall",
        latitude=47.6400692,
        longitude=26.247848,
        aliases=("primaria", "primarie", "city hall", "municipality"),
    ),
    SuceavaLocation(
        name="Administrative Palace Suceava",
        latitude=47.6431779,
        longitude=26.2586426,
        aliases=("prefectura", "palatul administrativ", "administrativ"),
    ),
    SuceavaLocation(
        name="Bucovina Village Museum",
        latitude=47.642498,
        longitude=26.271825,
        aliases=("muzeul satului", "bucovinean village museum", "satul bucovinean"),
    ),
    SuceavaLocation(
        name="Central Park Suceava",
        latitude=47.6427719,
        longitude=26.2596374,
        aliases=("parc central", "central park", "parcul central"),
    ),
    SuceavaLocation(
        name="Saint John Monastery",
        latitude=47.6417094,
        longitude=26.262906,
        aliases=("manastire", "sfantul ioan", "manastirea sfantul ioan cel nou"),
    ),
    SuceavaLocation(
        name="Areni Stadium",
        latitude=47.656296,
        longitude=26.2612726,
        aliases=("stadion", "areni stadium", "stadionul areni"),
    ),
    SuceavaLocation(
        name="Suceava Planetarium",
        latitude=47.6417914,
        longitude=26.2454151,
        aliases=("planetariu", "planetarium"),
    ),
    SuceavaLocation(
        name="Bucovina Library",
        latitude=47.6419722,
        longitude=26.2592412,
        aliases=("biblioteca", "biblioteca bucovinei", "library"),
    ),
    SuceavaLocation(
        name="Stefan cel Mare National College",
        latitude=47.6466058,
        longitude=26.2569654,
        aliases=("colegiul stefan", "stefan cel mare college", "cn stefan cel mare"),
    ),
    SuceavaLocation(
        name="Petru Rares National College",
        latitude=47.6432085,
        longitude=26.2525517,
        aliases=("colegiul petru rares", "petru rares", "cn petru rares"),
    ),
    SuceavaLocation(
        name="Dedeman Suceava",
        latitude=47.6650181,
        longitude=26.2729132,
        aliases=("dedeman", "diy"),
    ),
    SuceavaLocation(
        name="Kaufland Areni",
        latitude=47.6429896,
        longitude=26.2428419,
        aliases=("kaufland areni", "kaufland", "kaufland suceava"),
    ),
    SuceavaLocation(
        name="Kaufland Burdujeni",
        latitude=47.6695937,
        longitude=26.2732467,
        aliases=("kaufland burdujeni",),
    ),
    SuceavaLocation(
        name="Lidl Burdujeni",
        latitude=47.6705224,
        longitude=26.2893638,
        aliases=("lidl burdujeni",),
    ),
    SuceavaLocation(
        name="Lidl George Enescu",
        latitude=47.6401408,
        longitude=26.2341449,
        aliases=("lidl george enescu", "lidl obcini", "lidl"),
    ),
    SuceavaLocation(
        name="Metro Suceava",
        latitude=47.6345652,
        longitude=26.2363453,
        aliases=("metro", "metro suceava"),
    ),
    SuceavaLocation(
        name="Selgros Suceava",
        latitude=47.6695493,
        longitude=26.2478603,
        aliases=("selgros", "selgros suceava"),
    ),
    SuceavaLocation(
        name="Obcini",
        latitude=47.6373921,
        longitude=26.2320203,
        aliases=("obcini", "cartier obcini"),
    ),
    SuceavaLocation(
        name="Burdujeni",
        latitude=47.6724044,
        longitude=26.2790567,
        aliases=("burdujeni", "cartier burdujeni"),
    ),
    SuceavaLocation(
        name="Itcani",
        latitude=47.678359,
        longitude=26.2380981,
        aliases=("itcani", "gara itcani", "cartier itcani"),
    ),
    SuceavaLocation(
        name="Zamca",
        latitude=47.6506364,
        longitude=26.2493017,
        aliases=("zamca", "cartier zamca"),
    ),
    SuceavaLocation(
        name="Areni",
        latitude=47.6402909,
        longitude=26.2469294,
        aliases=("areni", "cartier areni"),
    ),
    SuceavaLocation(
        name="Calea Unirii",
        latitude=47.6585756,
        longitude=26.2641342,
        aliases=("calea unirii", "unirii"),
    ),
    SuceavaLocation(
        name="Bulevardul George Enescu",
        latitude=47.6465386,
        longitude=26.2495266,
        aliases=("bulevardul george enescu", "george enescu"),
    ),
    SuceavaLocation(
        name="Strada Universitatii",
        latitude=47.6416,
        longitude=26.2449,
        aliases=("strada universitatii", "universitatii"),
    ),
    SuceavaLocation(
        name="Strada Stefan cel Mare",
        latitude=47.6514,
        longitude=26.2547,
        aliases=("strada stefan cel mare", "stefan cel mare"),
    ),
    SuceavaLocation(
        name="Bulevardul 1 Mai",
        latitude=47.6416,
        longitude=26.2449,
        aliases=("bulevardul 1 mai", "1 mai"),
    ),
    SuceavaLocation(
        name="Calea Burdujeni",
        latitude=47.6702,
        longitude=26.2776,
        aliases=("calea burdujeni", "burdujeni"),
    ),
    SuceavaLocation(
        name="Strada Traian Vuia",
        latitude=47.6688,
        longitude=26.2861,
        aliases=("strada traian vuia", "traian vuia"),
    ),
    SuceavaLocation(
        name="Strada Ana Ipatescu",
        latitude=47.6505,
        longitude=26.2574,
        aliases=("strada ana ipatescu", "ana ipatescu"),
    ),
    SuceavaLocation(
        name="Strada Mitropoliei",
        latitude=47.6476,
        longitude=26.2576,
        aliases=("strada mitropoliei", "mitropoliei"),
    ),
    SuceavaLocation(
        name="Strada Marasesti",
        latitude=47.6445,
        longitude=26.2495,
        aliases=("strada marasesti", "marasesti"),
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
