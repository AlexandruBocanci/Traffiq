import pandas as pd

from src.extract.extract_traffic_csv import extract_traffic_csv
from src.extract.extract_weather_api import extract_weather_api
from src.load.load_hourly_street_metrics_to_gold import load_hourly_street_metrics_to_gold
from src.load.load_traffic_raw_to_bronze import load_traffic_raw_to_bronze
from src.load.load_traffic_to_silver import load_traffic_to_silver
from src.load.load_traffic_weather_enriched_to_silver import load_traffic_weather_enriched_to_silver
from src.load.load_weather_raw_to_bronze import load_weather_raw_to_bronze
from src.load.load_weather_to_silver import load_weather_to_silver
from src.load.load_weather_traffic_impact_to_gold import load_weather_traffic_impact_to_gold
from src.transform.transform_traffic_data import transform_traffic_data
from src.transform.transform_weather_data import transform_weather_data
from src.load.log_pipeline_run import finish_pipeline_run
from src.load.log_pipeline_run import start_pipeline_run
from src.utils.db_utils import get_db_connection


TRAFFIC_SOURCE_FILE = "data/raw/traffic_raw.csv"
WEATHER_LATITUDE = 47.6514
WEATHER_LONGITUDE = 26.2556


def reset_pipeline_tables():
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            TRUNCATE TABLE
                bronze.traffic_raw,
                bronze.weather_raw,
                silver.traffic_observations,
                silver.weather_observations,
                silver.traffic_weather_enriched,
                gold.hourly_street_metrics,
                gold.weather_traffic_impact
            RESTART IDENTITY;
            """
        )

        conn.commit()
        print("SUCCESS: Pipeline tables reset.")
        return 1

    except Exception as e:
        if conn is not None:
            conn.rollback()
        print("FAILED: Pipeline table reset failed:", e)
        return 0

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def get_enriched_traffic_weather_df():
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                event_timestamp,
                weather_label,
                avg_speed
            FROM silver.traffic_weather_enriched;
            """
        )

        rows = cur.fetchall()
        return pd.DataFrame(
            rows,
            columns=["event_timestamp", "weather_label", "avg_speed"]
        )

    except Exception as e:
        print("FAILED: Could not read enriched traffic-weather data:", e)
        return pd.DataFrame()

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def run_traffic_weather_pipeline():
    run_id = start_pipeline_run("traffic_weather_pipeline")

    reset_result = reset_pipeline_tables()

    if reset_result == 0:
        finish_pipeline_run(
            run_id,
            "failed",
            0,
            0,
            "Pipeline table reset failed"
        )

        return {
            "status": "failed",
            "run_id": run_id,
            "error": "Pipeline table reset failed",
        }

    raw_traffic_df = extract_traffic_csv(TRAFFIC_SOURCE_FILE)
    clean_traffic_df = transform_traffic_data(raw_traffic_df)

    traffic_raw_rows = load_traffic_raw_to_bronze(raw_traffic_df, TRAFFIC_SOURCE_FILE)
    traffic_silver_rows = load_traffic_to_silver(clean_traffic_df)
    hourly_street_metrics_rows = load_hourly_street_metrics_to_gold(clean_traffic_df)

    raw_weather_df = extract_weather_api(WEATHER_LATITUDE, WEATHER_LONGITUDE)
    clean_weather_df = transform_weather_data(raw_weather_df)

    weather_raw_rows = load_weather_raw_to_bronze(raw_weather_df)
    weather_silver_rows = load_weather_to_silver(clean_weather_df)

    traffic_weather_enriched_rows = load_traffic_weather_enriched_to_silver(
        clean_traffic_df,
        clean_weather_df
    )

    enriched_df = get_enriched_traffic_weather_df()
    weather_traffic_impact_rows = load_weather_traffic_impact_to_gold(enriched_df)

    records_extracted = len(raw_traffic_df) + len(raw_weather_df)

    records_loaded = (
        traffic_raw_rows
        + traffic_silver_rows
        + hourly_street_metrics_rows
        + weather_raw_rows
        + weather_silver_rows
        + traffic_weather_enriched_rows
        + weather_traffic_impact_rows
    )

    finish_pipeline_run(
        run_id,
        "success",
        records_extracted,
        records_loaded
    )

    result = {
        "status": "success",
        "run_id": run_id,
        "traffic_raw_rows": traffic_raw_rows,
        "traffic_silver_rows": traffic_silver_rows,
        "hourly_street_metrics_rows": hourly_street_metrics_rows,
        "weather_raw_rows": weather_raw_rows,
        "weather_silver_rows": weather_silver_rows,
        "traffic_weather_enriched_rows": traffic_weather_enriched_rows,
        "weather_traffic_impact_rows": weather_traffic_impact_rows,
        "records_extracted": records_extracted,
        "records_loaded": records_loaded,
    }

    print("SUCCESS: Traffic-weather pipeline completed.")
    print(result)

    return result