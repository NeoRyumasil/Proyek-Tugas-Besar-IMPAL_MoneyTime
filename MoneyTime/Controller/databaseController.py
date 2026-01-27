import psycopg2
import os

def db_connect():
    try:
        # Koneksi
        connection = psycopg2.connect(
            host = os.getenv('DB_SERVER'),
            user = os.getenv('DB_USERNAME'),
            password = os.getenv('DB_PASSWORD'),
            dbname = os.getenv('DB_DATABASE'),
            port = "6543",
            connect_timeout=10,
            sslmode = "require"
        )
        
        return connection
    
    except Exception as e:
        print(f"Gagal koneksi ke Azure SQL: {e}")
        return None