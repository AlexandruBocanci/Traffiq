import argparse

from src.extract.extract_events_csv import extract_events_csv
from src.load.load_events_raw_to_bronze import load_events_raw_to_bronze
from src.load.load_events_to_silver import load_events_to_silver
from src.load.log_data_quality_check import log_data_quality_check
from src.load.log_pipeline_run import finish_pipeline_run
from src.load.log_pipeline_run import start_pipeline_run
from src.pipeline.execution_safety import validate_configured_pipeline_target
from src.transform.transform_events_data import transform_events_data
from src.utils.db_utils import get_db_connection


EVENTS_SOURCE_FILE = "data/raw/events_raw.csv"


def reset_event_tables():
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            TRUNCATE TABLE
                bronze.events_raw,
                silver.events_observations
            RESTART IDENTITY;
            """
        )
        conn.commit()
        print("SUCCESS: Event tables reset.")
        return 1
    except Exception as exc:
        if conn is not None:
            conn.rollback()
        print("FAILED: Event table reset failed:", exc)
        return 0
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def run_events_pipeline(allow_cloud_reset=False):
    validate_configured_pipeline_target(allow_cloud_reset)

    raw_events_df = extract_events_csv(EVENTS_SOURCE_FILE)
    clean_events_df = transform_events_data(raw_events_df)

    run_id = start_pipeline_run("events_pipeline")

    if run_id is None:
        return {"status": "failed", "error": "Could not start pipeline metadata logging"}

    invalid_rows = len(raw_events_df) - len(clean_events_df)
    log_data_quality_check(
        run_id,
        "events_suceava_coordinates_valid",
        "passed" if not clean_events_df.empty else "failed",
        invalid_rows,
        "Events must have allowed type/severity and coordinates inside Suceava bounds.",
    )

    if clean_events_df.empty:
        finish_pipeline_run(run_id, "failed", len(raw_events_df), 0, "No valid event rows")
        return {"status": "failed", "run_id": run_id, "error": "No valid event rows"}

    if reset_event_tables() == 0:
        finish_pipeline_run(run_id, "failed", len(raw_events_df), 0, "Event reset failed")
        return {"status": "failed", "run_id": run_id, "error": "Event reset failed"}

    bronze_rows = load_events_raw_to_bronze(raw_events_df, EVENTS_SOURCE_FILE)
    silver_rows = load_events_to_silver(clean_events_df)
    records_loaded = bronze_rows + silver_rows

    if bronze_rows <= 0 or silver_rows <= 0:
        finish_pipeline_run(
            run_id,
            "failed",
            len(raw_events_df),
            records_loaded,
            "Event load returned no inserted rows",
        )
        return {"status": "failed", "run_id": run_id, "error": "Event load failed"}

    finish_pipeline_run(run_id, "success", len(raw_events_df), records_loaded)

    result = {
        "status": "success",
        "run_id": run_id,
        "events_raw_rows": bronze_rows,
        "events_silver_rows": silver_rows,
        "records_extracted": len(raw_events_df),
        "records_loaded": records_loaded,
        "invalid_rows_removed": invalid_rows,
    }
    print("SUCCESS: Events pipeline completed.")
    print(result)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Load geolocated controlled Suceava event alerts."
    )
    parser.add_argument(
        "--confirm-cloud-reset",
        action="store_true",
        help="Allow destructive events table reset when DB_HOST points to Amazon RDS.",
    )
    args = parser.parse_args()

    try:
        run_events_pipeline(allow_cloud_reset=args.confirm_cloud_reset)
    except RuntimeError as exc:
        print(f"BLOCKED: {exc}")
        raise SystemExit(1) from exc
