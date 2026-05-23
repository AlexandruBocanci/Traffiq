import argparse

import pandas as pd

from src.extract.extract_events_csv import extract_events_csv
from src.extract.extract_rides_history_csv import extract_rides_history_csv
from src.extract.extract_route_reference_csv import extract_route_reference_csv
from src.load.load_events_raw_to_bronze import load_events_raw_to_bronze
from src.load.load_events_to_silver import load_events_to_silver
from src.load.load_ride_history_to_silver import load_ride_history_to_silver
from src.load.load_rides_raw_to_bronze import load_rides_raw_to_bronze
from src.load.load_route_hourly_report_to_gold import load_route_hourly_report_to_gold
from src.load.load_route_reference_to_silver import load_route_reference_to_silver
from src.load.load_route_summary_to_gold import load_route_summary_to_gold
from src.load.load_top_congested_segments_to_gold import load_top_congested_segments_to_gold
from src.pipeline.run_pipeline import run_traffic_weather_pipeline
from src.transform.transform_events_data import transform_events_data
from src.transform.transform_rides_history_data import transform_rides_history_data
from src.utils.db_utils import get_db_connection


ROUTE_REFERENCE_SOURCE_FILE = "data/raw/route_reference.csv"
EVENTS_SOURCE_FILE = "data/raw/events_raw.csv"
RIDES_HISTORY_SOURCE_FILE = "data/raw/rides_history_raw.csv"


def reset_demo_tables():
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            TRUNCATE TABLE
                bronze.events_raw,
                bronze.rides_raw,
                silver.route_reference,
                silver.events_observations,
                silver.ride_history,
                gold.route_summary,
                gold.route_hourly_report,
                gold.top_congested_segments
            RESTART IDENTITY;
            """
        )

        conn.commit()
        print("SUCCESS: Demo tables reset.")
        return 1

    except Exception as e:
        if conn is not None:
            conn.rollback()
        print("FAILED: Demo table reset failed:", e)
        return 0

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def get_silver_traffic_df():
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT event_timestamp, street_name, avg_speed, weather_label
            FROM silver.traffic_observations;
            """
        )

        rows = cur.fetchall()
        return pd.DataFrame(
            rows,
            columns=["event_timestamp", "street_name", "avg_speed", "weather_label"],
        )

    except Exception as e:
        print("FAILED: Could not read silver traffic observations:", e)
        return pd.DataFrame()

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def seed_demo_data(allow_cloud_reset=False):
    pipeline_result = run_traffic_weather_pipeline(allow_cloud_reset=allow_cloud_reset)

    if pipeline_result.get("status") != "success":
        return {
            "status": "failed",
            "error": "Traffic-weather pipeline failed",
            "pipeline_result": pipeline_result,
        }

    reset_result = reset_demo_tables()

    if reset_result == 0:
        return {
            "status": "failed",
            "error": "Demo table reset failed",
        }

    route_reference_df = extract_route_reference_csv(ROUTE_REFERENCE_SOURCE_FILE)
    traffic_df = get_silver_traffic_df()

    raw_events_df = extract_events_csv(EVENTS_SOURCE_FILE)
    clean_events_df = transform_events_data(raw_events_df)

    raw_rides_df = extract_rides_history_csv(RIDES_HISTORY_SOURCE_FILE)
    clean_rides_df = transform_rides_history_data(raw_rides_df)

    route_reference_rows = load_route_reference_to_silver(route_reference_df)
    route_summary_rows = load_route_summary_to_gold(route_reference_df, traffic_df)
    route_hourly_rows = load_route_hourly_report_to_gold(route_reference_df, traffic_df)
    top_congested_rows = load_top_congested_segments_to_gold(traffic_df)

    events_bronze_rows = load_events_raw_to_bronze(raw_events_df, EVENTS_SOURCE_FILE)
    events_silver_rows = load_events_to_silver(clean_events_df)

    rides_bronze_rows = load_rides_raw_to_bronze(
        raw_rides_df,
        RIDES_HISTORY_SOURCE_FILE,
    )
    rides_silver_rows = load_ride_history_to_silver(clean_rides_df)

    result = {
        "status": "success",
        "traffic_weather_pipeline_status": pipeline_result["status"],
        "route_reference_rows": route_reference_rows,
        "route_summary_rows": route_summary_rows,
        "route_hourly_rows": route_hourly_rows,
        "top_congested_rows": top_congested_rows,
        "events_bronze_rows": events_bronze_rows,
        "events_silver_rows": events_silver_rows,
        "rides_bronze_rows": rides_bronze_rows,
        "rides_silver_rows": rides_silver_rows,
    }

    print("SUCCESS: Demo data seeded for mobile app.")
    print(result)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Load the full Traffiq controlled demo dataset."
    )
    parser.add_argument(
        "--confirm-cloud-reset",
        action="store_true",
        help="Allow destructive demo table reset when DB_HOST points to Amazon RDS.",
    )
    args = parser.parse_args()

    try:
        seed_demo_data(allow_cloud_reset=args.confirm_cloud_reset)
    except RuntimeError as exc:
        print(f"BLOCKED: {exc}")
        raise SystemExit(1) from exc
