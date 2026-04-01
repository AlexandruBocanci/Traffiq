from src.load.load_traffic_raw_to_bronze import load_traffic_raw_to_bronze
from src.extract.extract_traffic_csv import extract_traffic_csv
from src.utils.db_utils import get_db_connection


def test_load_traffic_raw_to_bronze(df, source_file):
  conn = None
  cur = None

  try:
      conn = get_db_connection()
      cur = conn.cursor()

      cur.execute("TRUNCATE TABLE bronze.traffic_raw RESTART IDENTITY;")
      conn.commit()

      expected_rows = len(df)
      inserted_rows = load_traffic_raw_to_bronze(df, source_file)

      cur.execute(
          "SELECT COUNT(*) FROM bronze.traffic_raw WHERE source_file = %s",
          (source_file,)
      )
      db_count = cur.fetchone()[0]

      if expected_rows != inserted_rows:
          print("FAILED: inserted_rows is different from expected_rows.")
          return 0

      if expected_rows != db_count:
          print("FAILED: database row count is different from expected_rows.")
          return 0

      print("PASSED: Test loading raw traffic data into bronze.traffic_raw.")
      return 1

  except Exception as e:
      if conn is not None:
          conn.rollback()
      print("An error occurred:", e)
      return 0

  finally:
      if cur is not None:
          cur.close()
      if conn is not None:
          conn.close()


source_file = "data/raw/traffic_raw.csv"
df = extract_traffic_csv(source_file)
test_load_traffic_raw_to_bronze(df, source_file)
