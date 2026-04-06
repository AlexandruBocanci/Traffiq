from src.extract.extract_weather_api import extract_weather_api
from src.transform.transform_weather_data import transform_weather_data
from src.load.load_weather_to_silver import load_weather_to_silver
from src.utils.db_utils import get_db_connection


def test_load_weather_to_silver(clean_df):
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE silver.weather_observations RESTART IDENTITY;")
    conn.commit()
    print("Table silver.weather_observations truncated successfully.")

    inserted_rows = load_weather_to_silver(clean_df)
    expected_rows = len(clean_df)

    if inserted_rows != expected_rows:
      print("FAILED: inserted_rows is different from expected_rows.")
      return 0

    cur.execute("SELECT COUNT(*) FROM silver.weather_observations")
    db_count = cur.fetchone()[0]

    if expected_rows != db_count:
      print("FAILED: database row count is different from expected_rows.")
      return 0

    print("PASSED: Test loading weather data into silver.weather_observations.")
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


raw_df = extract_weather_api(47.6514, 26.2556)
clean_df = transform_weather_data(raw_df)
print(test_load_weather_to_silver(clean_df))
