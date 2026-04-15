from src.utils.db_utils import get_db_connection
from fastapi import FastAPI
from fastapi import HTTPException


app = FastAPI(
    title="Traffiq API",
    description="Backend API for Traffiq v1.",
    version="1.0.0"
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/traffic")
def traffic():
    conn = None
    cur = None

    try:
        conn = get_db_connection()

        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed.")

        cur = conn.cursor()
        cur.execute(
            """
            SELECT
                traffic_obs_id,
                event_timestamp,
                street_name,
                avg_speed,
                weather_label
            FROM silver.traffic_observations
            ORDER BY event_timestamp DESC, traffic_obs_id DESC
            """
        )

        rows = cur.fetchall()

        data = []
        for row in rows:
            data.append(
                {
                    "traffic_obs_id": row[0],
                    "event_timestamp": row[1],
                    "street_name": row[2],
                    "avg_speed": float(row[3]) if row[3] is not None else None,
                    "weather_label": row[4],
                }
            )

        return {
            "count": len(rows),
            "data": data,
        }

    except Exception:
        raise HTTPException(status_code=500, detail="An error occurred")

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


@app.get("/traffic/top-speed")
def get_top_speed():
    conn = None
    cur = None

    try:
        conn = get_db_connection()

        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed.")

        cur = conn.cursor()
        cur.execute(
            """
            SELECT
                traffic_obs_id,
                event_timestamp,
                street_name,
                avg_speed,
                weather_label
            FROM silver.traffic_observations
            WHERE avg_speed IS NOT NULL
            ORDER BY avg_speed DESC, event_timestamp DESC, traffic_obs_id DESC
            LIMIT 5;
            """
        )

        rows = cur.fetchall()
        data = []

        for row in rows:
            data.append(
                {
                    "traffic_obs_id": row[0],
                    "event_timestamp": row[1],
                    "street_name": row[2],
                    "avg_speed": float(row[3]) if row[3] is not None else None,
                    "weather_label": row[4],
                }
            )

        return {
            "count": len(rows),
            "data": data,
        }

    except Exception:
        raise HTTPException(status_code=500, detail="An error occurred")

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
