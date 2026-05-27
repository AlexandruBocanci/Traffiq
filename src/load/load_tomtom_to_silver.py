import pandas as pd

from src.utils.db_utils import get_db_connection


def _nullable(value):
    return None if pd.isna(value) else value


def load_tomtom_flow_to_silver(df):
    if df.empty:
        return 0

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        for _, row in df.iterrows():
            cur.execute(
                """
                INSERT INTO silver.tomtom_flow_observations (
                    observed_at,
                    corridor_key,
                    corridor_name,
                    current_speed_kmh,
                    free_flow_speed_kmh,
                    current_travel_time_seconds,
                    free_flow_travel_time_seconds,
                    confidence,
                    road_closure,
                    source_provider
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    row["observed_at"],
                    row["corridor_key"],
                    row["corridor_name"],
                    row["current_speed_kmh"],
                    row["free_flow_speed_kmh"],
                    _nullable(row["current_travel_time_seconds"]),
                    _nullable(row["free_flow_travel_time_seconds"]),
                    _nullable(row["confidence"]),
                    row["road_closure"],
                    row["source_provider"],
                ),
            )

        conn.commit()
        return len(df)
    except Exception:
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def replace_current_tomtom_incidents_in_silver(df):
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM silver.tomtom_incidents WHERE source_provider = 'tomtom';")

        for _, row in df.iterrows():
            cur.execute(
                """
                INSERT INTO silver.tomtom_incidents (
                    incident_id,
                    observed_at,
                    event_timestamp,
                    event_type,
                    street_name,
                    event_description,
                    severity,
                    latitude,
                    longitude,
                    delay_seconds,
                    source_provider
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    row["incident_id"],
                    row["observed_at"],
                    row["event_timestamp"],
                    row["event_type"],
                    row["street_name"],
                    row["event_description"],
                    row["severity"],
                    _nullable(row["latitude"]),
                    _nullable(row["longitude"]),
                    _nullable(row["delay_seconds"]),
                    row["source_provider"],
                ),
            )

        conn.commit()
        return len(df)
    except Exception:
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
