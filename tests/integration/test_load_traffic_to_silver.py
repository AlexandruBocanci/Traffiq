from src.load.load_traffic_to_silver import load_traffic_to_silver
from src.transform.transform_traffic_data import transform_traffic_data
from src.extract.extract_traffic_csv import extract_traffic_csv
from src.utils.db_utils import get_db_connection

def test_load_traffic_to_silver(df):
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("TRUNCATE TABLE silver.traffic_observations RESTART IDENTITY;")
    conn.commit()
    inserted_rows = load_traffic_to_silver(df)
    expected_rows = len(df)
    if inserted_rows != expected_rows:
      print("FAILED: inserted_rows is different from expected_rows.")
      return 0
    cur.execute("SELECT COUNT(*) FROM silver.traffic_observations")
    db_count = cur.fetchone()[0]
    if db_count != expected_rows:
      print("FAILED: database row count is different from expected_rows.")
      return 0
    print("PASSED: Test loading raw traffic data into silver.traffic_observations.")
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

test_load_traffic_to_silver(clean_df)