from src.utils.db_utils import get_db_connection


def log_data_quality_check(run_id, check_name, check_status, affected_records, details):
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
      """
      INSERT INTO etl_meta.data_quality_checks
      (run_id, check_name, check_status, affected_records, details)
      VALUES (%s, %s, %s, %s, %s)
      """,
      (
        run_id,
        check_name,
        check_status,
        affected_records,
        details,
      )
    )
    conn.commit()
    print(f"SUCCESS: Data quality check logged: {check_name}.")
    return 1

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not log data quality check:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
