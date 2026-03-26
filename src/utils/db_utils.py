from src.config.settings import DB_CONFIG
import psycopg


def get_db_connection():
    try:
        conn = psycopg.connect(**DB_CONFIG)
        print("Connected to the database.")
        return conn
    except Exception as e:
        print("An error occurred:", e)
        return None
