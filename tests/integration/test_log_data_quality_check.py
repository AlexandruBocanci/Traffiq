from src.pipeline.run_pipeline import run_traffic_weather_pipeline
from src.utils.db_utils import get_db_connection


def test_log_data_quality_check():
  result = run_traffic_weather_pipeline()

  if result.get("status") != "success":
    print("FAILED: Pipeline run failed, so data quality checks cannot be validated.")
    print(result)
    return 0

  run_id = result.get("run_id")
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
      """
      SELECT check_name, check_status, affected_records, details
      FROM etl_meta.data_quality_checks
      WHERE run_id = %s
      ORDER BY check_id ASC
      """,
      (run_id,)
    )

    rows = cur.fetchall()

    if len(rows) < 4:
      print("FAILED: Expected at least 4 data quality checks for the latest run.")
      print(rows)
      return 0

    checks = {row[0]: row for row in rows}
    expected_checks = [
      "traffic_raw_not_empty",
      "traffic_transform_removed_invalid_rows",
      "weather_raw_not_empty",
      "weather_transform_removed_invalid_rows",
    ]

    for check_name in expected_checks:
      if check_name not in checks:
        print(f"FAILED: Missing data quality check: {check_name}")
        print(rows)
        return 0

    if checks["traffic_raw_not_empty"][1] != "passed":
      print("FAILED: traffic_raw_not_empty should be passed.")
      print(rows)
      return 0

    if checks["weather_raw_not_empty"][1] != "passed":
      print("FAILED: weather_raw_not_empty should be passed.")
      print(rows)
      return 0

    if checks["traffic_transform_removed_invalid_rows"][2] < 0:
      print("FAILED: traffic_transform_removed_invalid_rows affected_records should be >= 0.")
      print(rows)
      return 0

    if checks["weather_transform_removed_invalid_rows"][2] < 0:
      print("FAILED: weather_transform_removed_invalid_rows affected_records should be >= 0.")
      print(rows)
      return 0

    for row in rows:
      if row[3] is None or row[3] == "":
        print("FAILED: details should not be empty.")
        print(rows)
        return 0

    print("SUCCESS: Data quality logging test passed.")
    print(rows)
    return 1

  except Exception as e:
    print("FAILED: Data quality logging test crashed:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


print(test_log_data_quality_check())
