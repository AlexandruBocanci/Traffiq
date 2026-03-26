from src.utils.db_utils import get_db_connection


def test_connection():
    conn = get_db_connection()

    if conn is not None:
        print("Database connection test passed.")
        conn.close()
        print("Database connection closed.")
    else:
        print("Database connection test failed.")


test_connection()
