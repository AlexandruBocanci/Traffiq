import pandas as pd

from src.utils.db_utils import get_db_connection


def load_traffic_weather_enriched_to_silver(traffic_df, weather_df):
  if traffic_df.empty or weather_df.empty:
    print("FAILED: One or both dataframes are empty.")
    return 0

  traffic_df = traffic_df.copy()
  weather_df = weather_df.copy()

  traffic_df["timestamp"] = pd.to_datetime(traffic_df["timestamp"], errors="coerce")
  weather_df["timestamp"] = pd.to_datetime(weather_df["timestamp"], errors="coerce")

  traffic_df = traffic_df[traffic_df["timestamp"].notna()]
  weather_df = weather_df[weather_df["timestamp"].notna()]

  if traffic_df.empty or weather_df.empty:
    print("FAILED: One or both dataframes have no valid timestamps.")
    return 0

  traffic_df["hour_of_day"] = traffic_df["timestamp"].dt.hour
  weather_df["hour_of_day"] = weather_df["timestamp"].dt.hour

  weather_df["weather_label"] = weather_df["precipitation"].apply(
    lambda value: "rainy" if value > 0 else "clear"
  )

  enriched_df = traffic_df.merge(
    weather_df[
      ["hour_of_day", "weather_label", "temperature", "precipitation", "wind_speed"]
    ],
    on="hour_of_day",
    how="inner"
  )

  if enriched_df.empty:
    print("FAILED: Enriched dataframe is empty.")
    return 0

  enriched_df = enriched_df.rename(
    columns={
      "timestamp": "event_timestamp",
      "speed": "avg_speed",
      "temperature": "temperature_c",
      "precipitation": "precipitation_mm",
      "wind_speed": "wind_speed_kmh",
    }
  )

  enriched_df = enriched_df[
    [
      "event_timestamp",
      "street_name",
      "avg_speed",
      "weather_label",
      "temperature_c",
      "precipitation_mm",
      "wind_speed_kmh",
    ]
  ]

  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for _, row in enriched_df.iterrows():
      cur.execute(
        """
        INSERT INTO silver.traffic_weather_enriched
        (event_timestamp, street_name, avg_speed, weather_label, temperature_c, precipitation_mm, wind_speed_kmh)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
          row["event_timestamp"],
          row["street_name"],
          row["avg_speed"],
          row["weather_label"],
          row["temperature_c"],
          row["precipitation_mm"],
          row["wind_speed_kmh"],
        )
      )

    conn.commit()
    print(f"SUCCESS: {len(enriched_df)} rows inserted into silver.traffic_weather_enriched.")
    return len(enriched_df)

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("An error occured:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
