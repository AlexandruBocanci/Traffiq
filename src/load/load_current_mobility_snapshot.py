from datetime import datetime
from zoneinfo import ZoneInfo

import pandas as pd

from src.utils.db_utils import get_db_connection


def replace_current_corridor_traffic_in_gold(df):
    if df.empty:
        return 0

    current_df = df.copy()
    current_df["congestion_score"] = (
        (current_df["free_flow_speed_kmh"] - current_df["current_speed_kmh"])
        / current_df["free_flow_speed_kmh"]
        * 100
    ).clip(0, 100)

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM gold.current_corridor_traffic WHERE source_provider = 'tomtom';"
        )

        for _, row in current_df.iterrows():
            cur.execute(
                """
                INSERT INTO gold.current_corridor_traffic (
                    corridor_key,
                    corridor_name,
                    observed_at,
                    current_speed_kmh,
                    free_flow_speed_kmh,
                    congestion_score,
                    confidence,
                    road_closure,
                    source_provider
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    row["corridor_key"],
                    row["corridor_name"],
                    row["observed_at"],
                    row["current_speed_kmh"],
                    row["free_flow_speed_kmh"],
                    row["congestion_score"],
                    row["confidence"],
                    row["road_closure"],
                    row["source_provider"],
                ),
            )

        conn.commit()
        return len(current_df)
    except Exception:
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def replace_current_weather_snapshot_in_silver(weather_df):
    if weather_df.empty:
        return 0

    current_df = weather_df.copy()
    current_df["timestamp"] = pd.to_datetime(current_df["timestamp"], errors="coerce")
    current_df = current_df[current_df["timestamp"].notna()]

    if current_df.empty:
        return 0

    local_now = datetime.now(ZoneInfo("Europe/Bucharest")).replace(tzinfo=None)
    nearest_index = (current_df["timestamp"] - local_now).abs().idxmin()
    row = current_df.loc[nearest_index]
    weather_label = "rainy" if row["precipitation"] > 0 else "clear"

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO silver.current_weather_snapshot (
                source_provider,
                observed_at,
                weather_label,
                temperature_c,
                precipitation_mm,
                wind_speed_kmh
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (source_provider) DO UPDATE SET
                observed_at = EXCLUDED.observed_at,
                weather_label = EXCLUDED.weather_label,
                temperature_c = EXCLUDED.temperature_c,
                precipitation_mm = EXCLUDED.precipitation_mm,
                wind_speed_kmh = EXCLUDED.wind_speed_kmh;
            """,
            (
                "open-meteo",
                row["timestamp"],
                weather_label,
                row["temperature"],
                row["precipitation"],
                row["wind_speed"],
            ),
        )
        conn.commit()
        return 1
    except Exception:
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
