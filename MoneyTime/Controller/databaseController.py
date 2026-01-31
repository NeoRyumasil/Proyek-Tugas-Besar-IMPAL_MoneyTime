import psycopg2
import os

def db_connect():
    import psycopg2
import os

def db_connect():
    try:
        db_url = os.getenv('DATABASE_URL')
        
        if db_url:
            connection = psycopg2.connect(db_url, sslmode="require")
        else:
            connection = psycopg2.connect(
                host=os.getenv('DB_SERVER'),
                user=os.getenv('DB_USERNAME'),
                password=os.getenv('DB_PASSWORD'),
                dbname=os.getenv('DB_DATABASE'),
                port=os.getenv('DB_PORT', "5432"),
                sslmode="require"
            )
        
        return connection
    
    except Exception as e:
        print(f"Gagal koneksi ke Database: {e}")
        return None