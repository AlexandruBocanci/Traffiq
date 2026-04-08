from src.extract.extract_traffic_csv import extract_traffic_csv
from src.extract.extract_weather_api import extract_weather_api
from src.transform.transform_traffic_data import transform_traffic_data
from src.transform.transform_weather_data import transform_weather_data
from src.load.load_traffic_weather_enriched_to_silver import load_traffic_weather_enriched_to_silver
from src.utils.db_utils import get_db_connection


def test_load_traffic_weather_enriched_to_silver():
  conn = None
  cur = None

  try:
    raw_traffic_df = extract_traffic_csv("data/raw/traffic_raw.csv")
    clean_traffic_df = transform_traffic_data(raw_traffic_df)

    raw_weather_df = extract_weather_api(47.6514, 26.2556)
    clean_weather_df = transform_weather_data(raw_weather_df)

    if clean_traffic_df.empty or clean_weather_df.empty:
      print("FAILED: One or both clean dataframes are empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE silver.traffic_weather_enriched;")
    conn.commit()
    print("Table silver.traffic_weather_enriched truncated successfully.")

    inserted_rows = load_traffic_weather_enriched_to_silver(clean_traffic_df, clean_weather_df)

    if inserted_rows <= 0:
      print("FAILED: inserted_rows should be greater than 0.")
      return 0

    cur.execute("SELECT COUNT(*) FROM silver.traffic_weather_enriched")
    db_count = cur.fetchone()[0]

    if db_count != inserted_rows:
      print("FAILED: database row count is different from inserted_rows.")
      return 0

    cur.execute("SELECT COUNT(*) FROM silver.traffic_weather_enriched WHERE weather_label IS NULL")
    null_weather_labels = cur.fetchone()[0]

    if null_weather_labels > 0:
      print("FAILED: weather_label contains null values.")
      return 0

    print("PASSED: Test loading enriched traffic and weather data into silver.traffic_weather_enriched.")
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


print(test_load_traffic_weather_enriched_to_silver())
