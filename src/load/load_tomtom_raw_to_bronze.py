import json

from src.utils.db_utils import get_db_connection


def load_tomtom_flow_raw_to_bronze(records):
    if not records:
        return 0

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        for record in records:
            cur.execute(
                """
                INSERT INTO bronze.tomtom_flow_raw (
                    corridor_key,
                    corridor_name,
                    requested_latitude,
                    requested_longitude,
                    ingested_at,
                    raw_payload
                )
                VALUES (%s, %s, %s, %s, %s, %s::jsonb);
                """,
                (
                    record["corridor_key"],
                    record["corridor_name"],
                    record["requested_latitude"],
                    record["requested_longitude"],
                    record["ingested_at"],
                    json.dumps(record["raw_payload"]),
                ),
            )

        conn.commit()
        return len(records)
    except Exception:
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def load_tomtom_incidents_raw_to_bronze(snapshot):
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO bronze.tomtom_incidents_raw (
                requested_bounding_box,
                ingested_at,
                raw_payload
            )
            VALUES (%s, %s, %s::jsonb);
            """,
            (
                snapshot["requested_bounding_box"],
                snapshot["ingested_at"],
                json.dumps(snapshot["raw_payload"]),
            ),
        )
        conn.commit()
        return 1
    except Exception:
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
