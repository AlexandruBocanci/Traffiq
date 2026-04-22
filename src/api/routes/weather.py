from fastapi import HTTPException
from fastapi import APIRouter
from src.utils.db_utils import get_db_connection

router = APIRouter()

@router.get("/weather-impact")
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