from fastapi import APIRouter
from fastapi import HTTPException

from src.utils.db_utils import get_db_connection


router = APIRouter()


def _fetch_one_dict(cur, query, params=None):
    cur.execute(query, params)
    row = cur.fetchone()

    if row is None:
        return None

    columns = [desc[0] for desc in cur.description]
    return dict(zip(columns, row))


def _fetch_all_dicts(cur, query, params=None):
    cur.execute(query, params)
    rows = cur.fetchall()
    columns = [desc[0] for desc in cur.description]
    return [dict(zip(columns, row)) for row in rows]


def _format_pipeline_run(row):
    if row is None:
        return None

    return {
        "run_id": row["run_id"],
        "pipeline_name": row["pipeline_name"],
        "started_at": row["started_at"],
        "finished_at": row["finished_at"],
        "status": row["status"],
        "records_extracted": row["records_extracted"],
        "records_loaded": row["records_loaded"],
        "error_message": row["error_message"],
    }


def _format_quality_check(row):
    return {
        "check_id": row["check_id"],
        "run_id": row["run_id"],
        "check_name": row["check_name"],
        "check_status": row["check_status"],
        "affected_records": row["affected_records"],
        "details": row["details"],
    }


@router.get("/pipeline/status")
def get_pipeline_status():
    conn = None
    cur = None

    try:
        conn = get_db_connection()

        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed.")

        cur = conn.cursor()
        latest_run = _fetch_one_dict(
            cur,
            """
            SELECT
                run_id,
                pipeline_name,
                started_at,
                finished_at,
                status,
                records_extracted,
                records_loaded,
                error_message
            FROM etl_meta.pipeline_runs
            ORDER BY started_at DESC, run_id DESC
            LIMIT 1;
            """,
        )

        if latest_run is None:
            return {
                "latest_run": None,
                "data_quality_checks": [],
            }

        quality_rows = _fetch_all_dicts(
            cur,
            """
            SELECT
                check_id,
                run_id,
                check_name,
                check_status,
                affected_records,
                details
            FROM etl_meta.data_quality_checks
            WHERE run_id = %s
            ORDER BY check_id ASC;
            """,
            (latest_run["run_id"],),
        )

        return {
            "latest_run": _format_pipeline_run(latest_run),
            "data_quality_checks": [
                _format_quality_check(row) for row in quality_rows
            ],
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(status_code=500, detail="An error occurred.")

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
