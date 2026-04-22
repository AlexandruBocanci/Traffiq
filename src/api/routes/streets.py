from fastapi import APIRouter
from fastapi import HTTPException
from src.utils.db_utils import get_db_connection

router = APIRouter()

@router.get("/streets/top-congested")
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
