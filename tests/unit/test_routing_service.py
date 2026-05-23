import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))

from src.api.routing_service import UnknownSuceavaLocationError
from src.api.routing_service import build_osrm_coordinates
from src.api.routing_service import resolve_suceava_location
from src.api.routing_service import RoutingProviderError
import src.api.routing_service as routing_service


def test_resolve_suceava_location_from_alias():
  location = resolve_suceava_location("USV")

  if location.name != "Stefan cel Mare University":
    print("FAILED: USV alias should resolve to Stefan cel Mare University.")
    return False

  return True


def test_resolve_seeded_suceava_street_alias():
  location = resolve_suceava_location("Calea Unirii")

  if location.name != "Calea Unirii":
    print("FAILED: Calea Unirii should resolve to the seeded Suceava street.")
    return False

  return True


def test_resolve_unknown_suceava_location():
  try:
    resolve_suceava_location("Bucharest")
  except UnknownSuceavaLocationError:
    return True

  print("FAILED: Unknown location should raise UnknownSuceavaLocationError.")
  return False


def test_build_osrm_coordinates_uses_longitude_latitude_order():
  origin = resolve_suceava_location("City Center")
  destination = resolve_suceava_location("Iulius Mall")
  coordinates = build_osrm_coordinates(origin, destination)

  expected = (
    f"{origin.longitude},{origin.latitude};"
    f"{destination.longitude},{destination.latitude}"
  )

  if coordinates != expected:
    print("FAILED: OSRM coordinates should use longitude,latitude order.")
    return False

  return True


def test_build_route_preview_with_stubbed_provider():
  original_request_osrm_route = routing_service.request_osrm_route

  def fake_request_osrm_route(origin, destination):
    return {
      "distance": 2400,
      "duration": 360,
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [origin.longitude, origin.latitude],
          [destination.longitude, destination.latitude],
        ],
      },
    }

  routing_service.request_osrm_route = fake_request_osrm_route

  try:
    preview = routing_service.build_route_preview("City Center", "Iulius Mall")
  finally:
    routing_service.request_osrm_route = original_request_osrm_route

  if preview["distance_km"] != 2.4:
    print("FAILED: Route preview should convert meters to kilometers.")
    return False

  if preview["duration_minutes"] != 6.0:
    print("FAILED: Route preview should convert seconds to minutes.")
    return False

  if preview["geometry"]["type"] != "LineString":
    print("FAILED: Route preview should include GeoJSON LineString geometry.")
    return False

  return True


def test_build_route_preview_uses_fallback_when_provider_fails():
  original_request_osrm_route = routing_service.request_osrm_route

  def fake_request_osrm_route(origin, destination):
    raise RoutingProviderError("provider unavailable")

  routing_service.request_osrm_route = fake_request_osrm_route

  try:
    preview = routing_service.build_route_preview("City Center", "Iulius Mall")
  finally:
    routing_service.request_osrm_route = original_request_osrm_route

  if preview["provider"] != "local_suceava_fallback":
    print("FAILED: Route preview should use fallback provider when OSRM fails.")
    return False

  if preview["distance_km"] <= 0:
    print("FAILED: Fallback route should return positive distance.")
    return False

  return True


def test_build_route_preview_accepts_explicit_origin_coordinates():
  original_request_osrm_route = routing_service.request_osrm_route

  def fake_request_osrm_route(origin, destination):
    return {
      "distance": 1000,
      "duration": 120,
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [origin.longitude, origin.latitude],
          [destination.longitude, destination.latitude],
        ],
      },
    }

  routing_service.request_osrm_route = fake_request_osrm_route

  try:
    preview = routing_service.build_route_preview(
      "Current location",
      "Iulius Mall",
      origin_latitude=47.475,
      origin_longitude=26.25,
    )
  finally:
    routing_service.request_osrm_route = original_request_osrm_route

  if preview["origin"]["name"] != "Current location":
    print("FAILED: Explicit origin should keep Current location label.")
    return False

  if preview["origin"]["latitude"] != 47.475:
    print("FAILED: Explicit origin latitude should be used.")
    return False

  if preview["origin"]["longitude"] != 26.25:
    print("FAILED: Explicit origin longitude should be used.")
    return False

  return True


def test_current_location_without_coordinates_is_not_catalog_alias():
  try:
    routing_service.build_route_preview("Current location", "Iulius Mall")
  except UnknownSuceavaLocationError:
    return True

  print("FAILED: Current location without coordinates should not resolve to City Center.")
  return False


print(test_resolve_suceava_location_from_alias())
print(test_resolve_seeded_suceava_street_alias())
print(test_resolve_unknown_suceava_location())
print(test_build_osrm_coordinates_uses_longitude_latitude_order())
print(test_build_route_preview_with_stubbed_provider())
print(test_build_route_preview_uses_fallback_when_provider_fails())
print(test_build_route_preview_accepts_explicit_origin_coordinates())
print(test_current_location_without_coordinates_is_not_catalog_alias())
