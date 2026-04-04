from src.extract.extract_weather_api import extract_weather_api
from src.load.load_weather_raw_to_bronze import load_weather_raw_to_bronze
from src.utils.db_utils import get_db_connection

def test_load_weather_raw_to_bronze():
  conn = None
  cur = None

  try:
    df = extract_weather_api(47.6514, 26.2556)

    if df.empty:
      print("FAILED: The extracted weather dataframe is empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE bronze.weather_raw RESTART IDENTITY;")
    conn.commit()

    inserted_rows = load_weather_raw_to_bronze(df)
    expected_rows = len(df)

    if inserted_rows != expected_rows:
      print("FAILED: inserted_rows is different from expected_rows.")
      return 0

    cur.execute("SELECT COUNT(*) FROM bronze.weather_raw")
    db_count = cur.fetchone()[0]

    if db_count != expected_rows:
      print("FAILED: database row count is different from expected_rows.")
      return 0

    print("PASSED: Test loading raw weather data into bronze.weather_raw.")
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

print(test_load_weather_raw_to_bronze())