from src.transform.build_corridor_hourly_profile_baseline import (
    build_corridor_hourly_profile_baseline,
)
from src.utils.db_utils import get_db_connection


def load_corridor_hourly_profile_baseline():
    rows = build_corridor_hourly_profile_baseline()

    conn = None
    cur = None

    try:
        conn = get_db_connection()

        if conn is None:
            raise RuntimeError("Database connection failed.")

        cur = conn.cursor()

        for row in rows:
            cur.execute(
                """
                INSERT INTO gold.corridor_hourly_traffic_profile (
                    weekday_index,
                    weekday_label,
                    hour_of_day,
                    baseline_congestion_score
                )
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (weekday_index, hour_of_day) DO UPDATE SET
                    weekday_label = EXCLUDED.weekday_label,
                    baseline_congestion_score = EXCLUDED.baseline_congestion_score,
                    updated_at = CURRENT_TIMESTAMP;
                """,
                (
                    row["weekday_index"],
                    row["weekday_label"],
                    row["hour_of_day"],
                    row["baseline_congestion_score"],
                ),
            )

        conn.commit()
        return len(rows)
    except Exception:
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    inserted_rows = load_corridor_hourly_profile_baseline()
    print(f"SUCCESS: {inserted_rows} hourly profile baseline rows loaded.")
