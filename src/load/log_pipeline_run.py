from datetime import datetime

from src.utils.db_utils import get_db_connection


def start_pipeline_run(pipeline_name):
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    started_at = datetime.now().isoformat(sep=" ", timespec="seconds")

    cur.execute(
      """
      INSERT INTO etl_meta.pipeline_runs
      (pipeline_name, started_at, status, records_extracted, records_loaded, error_message)
      VALUES (%s, %s, %s, %s, %s, %s)
      RETURNING run_id;
      """,
      (
        pipeline_name,
        started_at,
        "running",
        0,
        0,
        None,
      )
    )

    run_id = cur.fetchone()[0]
    conn.commit()

    print(f"SUCCESS: Pipeline run started with run_id={run_id}.")
    return run_id

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not start pipeline run:", e)
    return None

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()


def finish_pipeline_run(run_id, status, records_extracted, records_loaded, error_message=None):
  conn = None
  cur = None

  try:
    conn = get_db_connection()
    cur = conn.cursor()

    finished_at = datetime.now().isoformat(sep=" ", timespec="seconds")

    cur.execute(
      """
      UPDATE etl_meta.pipeline_runs
      SET
        finished_at = %s,
        status = %s,
        records_extracted = %s,
        records_loaded = %s,
        error_message = %s
      WHERE run_id = %s;
      """,
      (
        finished_at,
        status,
        records_extracted,
        records_loaded,
        error_message,
        run_id,
      )
    )

    conn.commit()

    print(f"SUCCESS: Pipeline run {run_id} finished with status={status}.")
    return 1

  except Exception as e:
    if conn is not None:
      conn.rollback()
    print("FAILED: Could not finish pipeline run:", e)
    return 0

  finally:
    if cur is not None:
      cur.close()
    if conn is not None:
      conn.close()
