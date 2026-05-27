import hashlib
import os
from unittest.mock import patch

os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_NAME", "traffiq")
os.environ.setdefault("DB_USER", "test_user")
os.environ.setdefault("DB_PASSWORD", "test_password")
os.environ.setdefault("DB_PORT", "5432")

from fastapi.testclient import TestClient

from src.api.main import app
from src.api.routes import mobility_ingestion


client = TestClient(app)
TEST_TOKEN = "test-ingestion-token"
TEST_DIGEST = hashlib.sha256(TEST_TOKEN.encode("utf-8")).hexdigest()
PAYLOAD = {
    "flow_records": [{}, {}, {}],
    "incidents_snapshot": {},
    "weather_records": [],
}


def test_mobility_ingestion_requires_server_token():
    response = client.post("/internal/mobility/snapshot", json=PAYLOAD)

    assert response.status_code == 401


def test_mobility_ingestion_accepts_verified_worker_payload():
    with patch.object(mobility_ingestion, "MOBILITY_INGESTION_TOKEN_SHA256", TEST_DIGEST):
        with patch.object(
            mobility_ingestion,
            "load_tomtom_mobility_snapshot",
            return_value={"status": "success", "run_id": 22},
        ) as loader:
            response = client.post(
                "/internal/mobility/snapshot",
                headers={"X-Traffiq-Ingestion-Token": TEST_TOKEN},
                json=PAYLOAD,
            )

    assert response.status_code == 200
    assert response.json()["run_id"] == 22
    assert loader.call_count == 1


if __name__ == "__main__":
    test_mobility_ingestion_requires_server_token()
    test_mobility_ingestion_accepts_verified_worker_payload()
    print("SUCCESS: Protected cloud mobility ingestion endpoint validated.")
