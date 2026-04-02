from src.extract.extract_traffic_csv import extract_traffic_csv
from src.transform.transform_traffic_data import transform_traffic_data
from src.utils.db_utils import get_db_connection
from src.load.load_hourly_street_metrics_to_gold import load_hourly_street_metrics_to_gold
import pandas as pd
def test_load_hourly_street_metrics_to_gold(df):
  conn = None
  cur = None

  try:

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE gold.hourly_street_metrics RESTART IDENTITY;")
    print("Table gold.hourly_street_metrics truncated successfully")
    conn.commit()

    inserted_rows = load_hourly_street_metrics_to_gold(df)
    gold_df = df.copy()
    gold_df["metric_date"] = pd.to_datetime(gold_df["timestamp"], errors="coerce").dt.date
    gold_df["hour_of_day"] = pd.to_datetime(gold_df["timestamp"], errors="coerce").dt.hour

    gold_df = gold_df.groupby(
    ["metric_date", "hour_of_day", "street_name"],
    as_index=False
    )["speed"].mean()

    expected_rows = len(gold_df)


    if inserted_rows != expected_rows:
      print("FAILED: inserted_rows is different from expected_rows.")
      return 0
    
    cur.execute("SELECT COUNT(*) FROM gold.hourly_street_metrics")
    db_count = cur.fetchone()[0]

    if db_count != expected_rows:
      print("FAILED: database row count is different from expected_rows.")
      return 0
    
    cur.execute("SELECT congestion_score FROM gold.hourly_street_metrics")
    rows = cur.fetchall()
    for row in rows:
      if row[0] < 0 or row[0] > 100:
        print("FAILED: the congestion score values should be between 0 and 100")
        return 0
      
    print("PASSED: Test loading hourly street metrics into gold.hourly_street_metrics.")
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

raw_df = extract_traffic_csv("data/raw/traffic_raw.csv")
clean_df = transform_traffic_data(raw_df)
test_load_hourly_street_metrics_to_gold(clean_df)