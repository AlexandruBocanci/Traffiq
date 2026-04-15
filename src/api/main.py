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
def get_traffic():
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


@app.get("/streets/top-congested")
def get_top_congested_streets():
    conn = None
    cur = None

    try:
        conn = get_db_connection()
        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed.")
        
        cur = conn.cursor()
        cur.execute("""
                    SELECT
                        metric_date,
                        hour_of_day,
                        street_name,
                        avg_speed,
                        congestion_score
                    FROM gold.hourly_street_metrics
                    WHERE congestion_score IS NOT NULL
                    ORDER BY congestion_score DESC, metric_date DESC, hour_of_day DESC, street_name ASC
                    LIMIT 5;
                    """)
        rows = cur.fetchall()
        data = []
        for row in rows:
            data.append({
                "metric_date": row[0],
                "hour_of_day": row[1],
                "street_name": row[2],
                "avg_speed": float(row[3]) if row[3] is not None else None,
                "congestion_score": float(row[4]) if row[4] is not None else None
                })
        
        return {
            "count": len(rows),
            "data": data
        }
    except Exception:
        raise HTTPException(status_code=500, detail="An error occured.")
    
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()

@app.get("/weather-impact")
def get_weather_impact():
    conn = None
    cur = None

    try:
        conn = get_db_connection()

        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed.")
        
        cur = conn.cursor()
        cur.execute("""
                    SELECT
                        metric_date,
                        weather_label,
                        avg_speed,
                        avg_congestion_score
                    FROM gold.weather_traffic_impact
                    WHERE avg_congestion_score IS NOT NULL
                    ORDER BY metric_date DESC, avg_congestion_score DESC, weather_label ASC;

                    """)

        rows = cur.fetchall()
        data = []
        for row in rows:
            data.append({
                "metric_date": row[0],
                "weather_label": row[1],
                "avg_speed": float(row[2]) if row[2] is not None else None,
                "avg_congestion_score": float(row[3]) if row[3] is not None else None
            })
        return {
            "count": len(rows),
            "data": data
        }
    except Exception:
        raise HTTPException(status_code=500, detail="An error occured.")
    
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()