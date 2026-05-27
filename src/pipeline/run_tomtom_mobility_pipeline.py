from src.config.settings import TOMTOM_API_KEY
from src.config.settings import TOMTOM_MONITORED_CORRIDORS
from src.config.settings import TOMTOM_SUCEAVA_BOUNDING_BOX
from src.config.settings import WEATHER_LATITUDE
from src.config.settings import WEATHER_LONGITUDE
from src.config.settings import WEATHER_TIMEZONE
from src.extract.extract_tomtom_traffic_api import extract_tomtom_flow_snapshot
from src.extract.extract_tomtom_traffic_api import extract_tomtom_incidents_snapshot
from src.extract.extract_weather_api import extract_weather_api
from src.load.load_current_mobility_snapshot import replace_current_corridor_traffic_in_gold
from src.load.load_current_mobility_snapshot import replace_current_weather_snapshot_in_silver
from src.load.load_tomtom_raw_to_bronze import load_tomtom_flow_raw_to_bronze
from src.load.load_tomtom_raw_to_bronze import load_tomtom_incidents_raw_to_bronze
from src.load.load_tomtom_to_silver import load_tomtom_flow_to_silver
from src.load.load_tomtom_to_silver import replace_current_tomtom_incidents_in_silver
from src.load.log_data_quality_check import log_data_quality_check
from src.load.log_pipeline_run import finish_pipeline_run
from src.load.log_pipeline_run import start_pipeline_run
from src.transform.transform_tomtom_traffic_data import transform_tomtom_flow_records
from src.transform.transform_tomtom_traffic_data import transform_tomtom_incidents_snapshot
from src.transform.transform_weather_data import transform_weather_data


PIPELINE_NAME = "tomtom_real_mobility_snapshot"


def run_tomtom_mobility_pipeline():
    if TOMTOM_API_KEY == "":
        raise RuntimeError(
            "TOMTOM_API_KEY is not configured. Add it to the Git-ignored local .env file."
        )

    run_id = start_pipeline_run(PIPELINE_NAME)

    if run_id is None:
        return {"status": "failed", "error": "Could not create pipeline run metadata."}

    try:
        flow_raw_records = extract_tomtom_flow_snapshot(
            TOMTOM_API_KEY, TOMTOM_MONITORED_CORRIDORS
        )
        incidents_raw_snapshot = extract_tomtom_incidents_snapshot(
            TOMTOM_API_KEY, TOMTOM_SUCEAVA_BOUNDING_BOX
        )
        raw_weather_df = extract_weather_api(
            WEATHER_LATITUDE, WEATHER_LONGITUDE, WEATHER_TIMEZONE
        )

        flow_df = transform_tomtom_flow_records(flow_raw_records)
        incidents_df = transform_tomtom_incidents_snapshot(incidents_raw_snapshot)
        weather_df = transform_weather_data(raw_weather_df)

        expected_corridors = len(TOMTOM_MONITORED_CORRIDORS)

        if len(flow_df) != expected_corridors:
            raise RuntimeError(
                "TomTom flow response did not contain valid values for all monitored corridors."
            )

        if weather_df.empty:
            raise RuntimeError("Open-Meteo did not return a valid current weather snapshot.")

        flow_bronze_rows = load_tomtom_flow_raw_to_bronze(flow_raw_records)
        incidents_bronze_rows = load_tomtom_incidents_raw_to_bronze(incidents_raw_snapshot)
        flow_silver_rows = load_tomtom_flow_to_silver(flow_df)
        incident_rows = replace_current_tomtom_incidents_in_silver(incidents_df)
        weather_rows = replace_current_weather_snapshot_in_silver(weather_df)
        corridor_gold_rows = replace_current_corridor_traffic_in_gold(flow_df)

        records_extracted = len(flow_raw_records) + len(incidents_df) + len(raw_weather_df)
        records_loaded = (
            flow_bronze_rows
            + incidents_bronze_rows
            + flow_silver_rows
            + incident_rows
            + weather_rows
            + corridor_gold_rows
        )

        log_data_quality_check(
            run_id,
            "tomtom_flow_corridors_complete",
            "passed",
            0,
            f"{expected_corridors} configured Suceava corridors returned valid flow data.",
        )
        log_data_quality_check(
            run_id,
            "tomtom_incidents_current_snapshot",
            "passed",
            0,
            f"{incident_rows} current TomTom incidents normalized for the Suceava bounding area.",
        )
        log_data_quality_check(
            run_id,
            "real_source_serving_snapshot_ready",
            "passed",
            0,
            "Gold traffic snapshot and Open-Meteo current weather snapshot are available.",
        )
        finish_pipeline_run(run_id, "success", records_extracted, records_loaded)

        return {
            "status": "success",
            "flow_bronze_rows": flow_bronze_rows,
            "flow_silver_rows": flow_silver_rows,
            "incident_rows": incident_rows,
            "incidents_bronze_rows": incidents_bronze_rows,
            "weather_snapshot_rows": weather_rows,
            "corridor_gold_rows": corridor_gold_rows,
        }
    except Exception as exc:
        finish_pipeline_run(run_id, "failed", 0, 0, str(exc))
        raise


if __name__ == "__main__":
    try:
        result = run_tomtom_mobility_pipeline()
        print("SUCCESS: Real TomTom mobility snapshot loaded.")
        print(result)
    except Exception as exc:
        print(f"FAILED: Real TomTom mobility snapshot was not loaded: {exc}")
        raise SystemExit(1) from exc
