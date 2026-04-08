from src.load.load_weather_traffic_impact_to_gold import load_weather_traffic_impact_to_gold
from src.utils.db_utils import get_db_connection
import pandas as pd


def test_load_weather_traffic_impact_to_gold():
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT event_timestamp, weather_label, avg_speed FROM silver.traffic_weather_enriched")
    rows = cur.fetchall()
    df = pd.DataFrame(rows, columns=["event_timestamp", "weather_label", "avg_speed"])

    if df.empty:
      print("FAILED: Dataframe empty.")
      return 0

    cur.execute("TRUNCATE TABLE gold.weather_traffic_impact RESTART IDENTITY;")
    conn.commit()

    inserted_rows = load_weather_traffic_impact_to_gold(df)

    if inserted_rows <= 0:
      print("FAILED: inserted_rows should be greater than 0.")
      return 0

    cur.execute("SELECT COUNT(*) FROM gold.weather_traffic_impact")
    db_count = cur.fetchone()[0]

    if db_count != inserted_rows:
      print("FAILED: db_count should be equal to inserted_rows.")
      return 0

    cur.execute("SELECT avg_congestion_score FROM gold.weather_traffic_impact")
    congestion_rows = cur.fetchall()

    for row in congestion_rows:
      if row[0] < 0 or row[0] > 100:
        print("FAILED: avg_congestion_score should have values between 0 and 100.")
        return 0

    print("SUCCESS: Testing the data quality and the loader of gold.weather_traffic_impact passed.")
    return 1

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


print(test_load_weather_traffic_impact_to_gold())
