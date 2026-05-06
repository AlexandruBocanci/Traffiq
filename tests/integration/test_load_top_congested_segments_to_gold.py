import pandas as pd

from src.extract.extract_traffic_csv import extract_traffic_csv
from src.load.load_top_congested_segments_to_gold import load_top_congested_segments_to_gold
from src.load.load_traffic_to_silver import load_traffic_to_silver
from src.transform.transform_traffic_data import transform_traffic_data
from src.utils.db_utils import get_db_connection


def get_silver_traffic_df(cur):
  cur.execute(
    """
    SELECT
      event_timestamp,
      street_name,
      avg_speed,
      weather_label
    FROM silver.traffic_observations;
    """
  )

  rows = cur.fetchall()
  return pd.DataFrame(
    rows,
    columns=[
      "event_timestamp",
      "street_name",
      "avg_speed",
      "weather_label",
    ],
  )


def test_load_top_congested_segments_to_gold():
  conn = None
  cur = None

  try:
    raw_traffic_df = extract_traffic_csv("data/raw/traffic_raw.csv")
    clean_traffic_df = transform_traffic_data(raw_traffic_df)

    if clean_traffic_df.empty:
      print("FAILED: clean_traffic_df should not be empty.")
      return 0

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
      """
      TRUNCATE TABLE
        silver.traffic_observations,
        gold.top_congested_segments
      RESTART IDENTITY;
      """
    )
    conn.commit()

    traffic_silver_rows = load_traffic_to_silver(clean_traffic_df)

    if traffic_silver_rows <= 0:
      print("FAILED: traffic_silver_rows should be greater than 0.")
      return 0

    silver_traffic_df = get_silver_traffic_df(cur)

    if silver_traffic_df.empty:
      print("FAILED: silver_traffic_df should not be empty.")
      return 0

    inserted_rows = load_top_congested_segments_to_gold(silver_traffic_df)

    if inserted_rows <= 0:
      print("FAILED: inserted_rows should be greater than 0.")
      return 0

    cur.execute("SELECT COUNT(*) FROM gold.top_congested_segments;")
    db_count = cur.fetchone()[0]

    if db_count != inserted_rows:
      print("FAILED: db_count should be equal to inserted_rows.")
      return 0

    cur.execute(
      """
      SELECT
        segment_rank,
        street_name,
        observation_count,
        avg_speed,
        avg_congestion_score
      FROM gold.top_congested_segments
      ORDER BY segment_rank ASC;
      """
    )

    rows = cur.fetchall()
    previous_congestion_score = None

    for index, row in enumerate(rows, start=1):
      segment_rank = row[0]
      street_name = row[1]
      observation_count = row[2]
      avg_speed = row[3]
      avg_congestion_score = row[4]

      if segment_rank != index:
        print("FAILED: segment_rank should be sequential.")
        print(row)
        return 0

      if street_name is None or street_name == "":
        print("FAILED: street_name should not be empty.")
        print(row)
        return 0

      if observation_count <= 0:
        print("FAILED: observation_count should be greater than 0.")
        print(row)
        return 0

      if avg_speed <= 0:
        print("FAILED: avg_speed should be greater than 0.")
        print(row)
        return 0

      if avg_congestion_score < 0 or avg_congestion_score > 100:
        print("FAILED: avg_congestion_score should be between 0 and 100.")
        print(row)
        return 0

      if previous_congestion_score is not None and avg_congestion_score > previous_congestion_score:
        print("FAILED: rows should be sorted by congestion score descending.")
        print(row)
        return 0

      previous_congestion_score = avg_congestion_score

    print("SUCCESS: Top congested segments Gold load test passed.")
    print(rows)
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


print(test_load_top_congested_segments_to_gold())
