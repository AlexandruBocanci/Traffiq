from datetime import datetime
from datetime import timedelta

from fastapi.testclient import TestClient

from src.api.main import app
from src.utils.db_utils import get_db_connection


client = TestClient(app)
TEST_PIPELINE_NAME = "test_pipeline_status_endpoint"


def cleanup_pipeline_status_rows():
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            DELETE FROM etl_meta.data_quality_checks
            WHERE run_id IN (
                SELECT run_id
                FROM etl_meta.pipeline_runs
                WHERE pipeline_name = %s
            );
            """,
            (TEST_PIPELINE_NAME,),
        )
        cur.execute(
            """
            DELETE FROM etl_meta.pipeline_runs
            WHERE pipeline_name = %s;
            """,
            (TEST_PIPELINE_NAME,),
        )
        conn.commit()

    except Exception as e:
        if conn is not None:
            conn.rollback()
        print("FAILED: Could not clean pipeline status test rows:", e)

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def insert_pipeline_status_fixture():
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        started_at = datetime.now() + timedelta(minutes=5)
        finished_at = started_at + timedelta(minutes=1)

        cur.execute(
            """
            INSERT INTO etl_meta.pipeline_runs (
                pipeline_name,
                started_at,
                finished_at,
                status,
                records_extracted,
                records_loaded,
                error_message
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING run_id;
            """,
            (
                TEST_PIPELINE_NAME,
                started_at,
                finished_at,
                "success",
                12,
                34,
                None,
            ),
        )
        run_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO etl_meta.data_quality_checks (
                run_id,
                check_name,
                check_status,
                affected_records,
                details
            )
            VALUES
                (%s, %s, %s, %s, %s),
                (%s, %s, %s, %s, %s);
            """,
            (
                run_id,
                "test_records_loaded_positive",
                "passed",
                0,
                "Loaded records must be positive.",
                run_id,
                "test_invalid_rows_removed",
                "passed",
                2,
                "Two invalid rows were removed by the test fixture.",
            ),
        )
        conn.commit()
        return run_id

    except Exception as e:
        if conn is not None:
            conn.rollback()
        print("FAILED: Could not insert pipeline status test fixture:", e)
        return None

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def test_pipeline_status_endpoint_returns_latest_run_and_quality_checks():
    cleanup_pipeline_status_rows()
    run_id = insert_pipeline_status_fixture()

    if run_id is None:
        cleanup_pipeline_status_rows()
        return 0

    response = client.get("/pipeline/status")

    if response.status_code != 200:
        print("FAILED: /pipeline/status should return 200.")
        print(response.status_code)
        print(response.text)
        cleanup_pipeline_status_rows()
        return 0

    response_json = response.json()
    latest_run = response_json.get("latest_run")
    checks = response_json.get("data_quality_checks")

    if latest_run is None:
        print("FAILED: latest_run should not be null.")
        print(response_json)
        cleanup_pipeline_status_rows()
        return 0

    if latest_run["run_id"] != run_id:
        print("FAILED: endpoint should return the newest pipeline run.")
        print(response_json)
        cleanup_pipeline_status_rows()
        return 0

    if latest_run["pipeline_name"] != TEST_PIPELINE_NAME:
        print("FAILED: pipeline_name should match the fixture.")
        print(response_json)
        cleanup_pipeline_status_rows()
        return 0

    if latest_run["status"] != "success":
        print("FAILED: pipeline status should be success.")
        print(response_json)
        cleanup_pipeline_status_rows()
        return 0

    if latest_run["records_extracted"] != 12:
        print("FAILED: records_extracted should match the fixture.")
        print(response_json)
        cleanup_pipeline_status_rows()
        return 0

    if latest_run["records_loaded"] != 34:
        print("FAILED: records_loaded should match the fixture.")
        print(response_json)
        cleanup_pipeline_status_rows()
        return 0

    if len(checks) != 2:
        print("FAILED: endpoint should return both data quality checks.")
        print(response_json)
        cleanup_pipeline_status_rows()
        return 0

    if checks[0]["check_name"] != "test_records_loaded_positive":
        print("FAILED: first check should match fixture ordering.")
        print(response_json)
        cleanup_pipeline_status_rows()
        return 0

    cleanup_pipeline_status_rows()
    print("SUCCESS: /pipeline/status returns latest run and quality checks.")
    return 1


print(test_pipeline_status_endpoint_returns_latest_run_and_quality_checks())
