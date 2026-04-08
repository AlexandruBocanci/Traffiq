import pandas as pd

from src.utils.db_utils import get_db_connection


def load_weather_traffic_impact_to_gold(df):
  if df.empty:
    print("Dataframe is empty.")
    return 0

  df = df.copy()

  df["event_timestamp"] = pd.to_datetime(df["event_timestamp"], errors="coerce")
  df = df[df["event_timestamp"].notna()]

  if df.empty:
    print("No valid event_timestamp values found.")
    return 0

  df["metric_date"] = df["event_timestamp"].dt.date
  df["congestion_score"] = ((60 - df["avg_speed"]) / 60) * 100
  df["congestion_score"] = df["congestion_score"].clip(0, 100)

  gold_df = df.groupby(
    ["metric_date", "weather_label"],
    as_index=False
  ).agg({
    "avg_speed": "mean",
    "congestion_score": "mean"
  })

  gold_df = gold_df.rename(columns={"congestion_score": "avg_congestion_score"})

  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    for _, row in gold_df.iterrows():
      cur.execute(
        """
        INSERT INTO gold.weather_traffic_impact
        (metric_date, weather_label, avg_speed, avg_congestion_score)
        VALUES (%s, %s, %s, %s)
        """,
        (
          row["metric_date"],
          row["weather_label"],
          row["avg_speed"],
          row["avg_congestion_score"],
        )
      )

    conn.commit()
    print(f"SUCCESS: {len(gold_df)} rows inserted into gold.weather_traffic_impact.")
    return len(gold_df)

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
